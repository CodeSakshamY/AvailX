/**
 * Chat Store (Zustand)
 * Manages real-time chat state and messages
 */

import { create } from 'zustand'

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: Date
  isRead: boolean
}

interface ChatStore {
  conversations: Map<string, Message[]>
  activeConversationId: string | null
  unreadCount: number

  addMessage: (conversationId: string, message: Message) => void
  setMessages: (conversationId: string, messages: Message[]) => void
  setActiveConversation: (conversationId: string | null) => void
  markAsRead: (conversationId: string) => void
  incrementUnreadCount: () => void
  resetUnreadCount: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: new Map(),
  activeConversationId: null,
  unreadCount: 0,

  addMessage: (conversationId, message) =>
    set((state) => {
      const messages = state.conversations.get(conversationId) || []
      const newConversations = new Map(state.conversations)
      newConversations.set(conversationId, [...messages, message])
      return { conversations: newConversations }
    }),

  setMessages: (conversationId, messages) =>
    set((state) => {
      const newConversations = new Map(state.conversations)
      newConversations.set(conversationId, messages)
      return { conversations: newConversations }
    }),

  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),

  markAsRead: (conversationId) =>
    set((state) => {
      const messages = state.conversations.get(conversationId) || []
      const updatedMessages = messages.map((m) => ({ ...m, isRead: true }))
      const newConversations = new Map(state.conversations)
      newConversations.set(conversationId, updatedMessages)
      return { conversations: newConversations }
    }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  resetUnreadCount: () => set({ unreadCount: 0 }),
}))
