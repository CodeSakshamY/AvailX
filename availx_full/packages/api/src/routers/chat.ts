import { router, protectedProcedure } from '../trpc';
import {
  createChatSessionSchema,
  sendMessageSchema,
  getChatMessagesSchema,
  markReadSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

/**
 * Chat Router
 * Manages real-time chat between customers and providers
 */
export const chatRouter = router({
  /**
   * Create or get existing chat session
   */
  createChatSession: protectedProcedure
    .input(createChatSessionSchema)
    .mutation(async ({ input, ctx }) => {
      const { recipientId, bookingId } = input;

      // Determine if current user is customer or provider
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.id },
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Get recipient user
      const recipient = await ctx.prisma.user.findUnique({
        where: { id: recipientId },
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      });

      if (!recipient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recipient not found',
        });
      }

      // Determine customer and provider IDs
      let customerId: string;
      let providerId: string;

      if (user.customerProfile && recipient.providerProfile) {
        customerId = user.customerProfile.id;
        providerId = recipient.providerProfile.id;
      } else if (user.providerProfile && recipient.customerProfile) {
        providerId = user.providerProfile.id;
        customerId = recipient.customerProfile.id;
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Chat can only be between customer and provider',
        });
      }

      // Check if chat room already exists
      const existingChatRoom = await ctx.prisma.chatRoom.findFirst({
        where: {
          customerId,
          providerId,
          ...(bookingId ? { bookingId } : {}),
        },
      });

      if (existingChatRoom) {
        return existingChatRoom;
      }

      // Create new chat room
      const chatRoom = await ctx.prisma.chatRoom.create({
        data: {
          customerId,
          providerId,
          bookingId,
        },
      });

      return chatRoom;
    }),

  /**
   * Send a message
   */
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const { chatRoomId, recipientId, type, content, mediaUrl, location } = input;

      let finalChatRoomId = chatRoomId;

      // If no chat room ID, create or find one
      if (!finalChatRoomId) {
        const session = await this.caller(ctx).createChatSession({
          recipientId,
        });
        finalChatRoomId = session.id;
      }

      // Verify user has access to this chat room
      const chatRoom = await ctx.prisma.chatRoom.findUnique({
        where: { id: finalChatRoomId },
        include: {
          customer: true,
          provider: true,
        },
      });

      if (!chatRoom) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat room not found',
        });
      }

      const isParticipant =
        chatRoom.customer.userId === ctx.session.id ||
        chatRoom.provider.userId === ctx.session.id;

      if (!isParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this chat room',
        });
      }

      // Create message
      const message = await ctx.prisma.message.create({
        data: {
          chatRoomId: finalChatRoomId,
          senderId: ctx.session.id,
          type,
          content,
          originalContent: content,
          mediaUrl,
          location: location as any,
        },
      });

      // Update chat room's last message time
      await ctx.prisma.chatRoom.update({
        where: { id: finalChatRoomId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    }),

  /**
   * Get messages from a chat room
   */
  getMessages: protectedProcedure
    .input(getChatMessagesSchema)
    .query(async ({ input, ctx }) => {
      const { chatRoomId, limit, cursor } = input;

      // Verify access
      const chatRoom = await ctx.prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          customer: true,
          provider: true,
        },
      });

      if (!chatRoom) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat room not found',
        });
      }

      const isParticipant =
        chatRoom.customer.userId === ctx.session.id ||
        chatRoom.provider.userId === ctx.session.id;

      if (!isParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this chat room',
        });
      }

      // Fetch messages
      const messages = await ctx.prisma.message.findMany({
        where: {
          chatRoomId,
          ...(cursor ? { id: { lt: cursor } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
        },
      });

      const nextCursor = messages.length === limit ? messages[messages.length - 1].id : undefined;

      return {
        messages: messages.reverse(), // Reverse to show oldest first
        nextCursor,
        hasMore: messages.length === limit,
      };
    }),

  /**
   * Mark messages as read
   */
  markRead: protectedProcedure
    .input(markReadSchema)
    .mutation(async ({ input, ctx }) => {
      const { chatRoomId, lastReadMessageId } = input;

      // Verify access
      const chatRoom = await ctx.prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          customer: true,
          provider: true,
        },
      });

      if (!chatRoom) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat room not found',
        });
      }

      const isParticipant =
        chatRoom.customer.userId === ctx.session.id ||
        chatRoom.provider.userId === ctx.session.id;

      if (!isParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this chat room',
        });
      }

      // Mark all messages up to lastReadMessageId as read
      await ctx.prisma.message.updateMany({
        where: {
          chatRoomId,
          id: { lte: lastReadMessageId },
          senderId: { not: ctx.session.id }, // Don't mark own messages
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return { success: true };
    }),

  /**
   * Get all chat rooms for the current user
   */
  getChatRooms: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit } = input;
      const offset = (page - 1) * limit;

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.id },
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const whereClause: any = {};

      if (user.customerProfile) {
        whereClause.customerId = user.customerProfile.id;
      } else if (user.providerProfile) {
        whereClause.providerId = user.providerProfile.id;
      }

      const [chatRooms, total] = await Promise.all([
        ctx.prisma.chatRoom.findMany({
          where: whereClause,
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                  },
                },
              },
            },
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: {
                messages: {
                  where: {
                    senderId: { not: ctx.session.id },
                    isRead: false,
                  },
                },
              },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.prisma.chatRoom.count({ where: whereClause }),
      ]);

      return {
        chatRooms,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
      };
    }),
});
