/**
 * Custom Chat Hooks
 * Wraps tRPC chat mutations and queries
 */

import { trpc } from '@/lib/trpc'
import { useChatStore } from '@/stores/chat-store'
import { useEffect } from 'react'

export function useConversations() {
  return trpc.chat.getConversations.useQuery()
}

export function useMessages(conversationId: string) {
  const { setMessages } = useChatStore()

  const query = trpc.chat.getMessages.useQuery(
    { conversationId },
    {
      enabled: !!conversationId,
      refetchInterval: 3000, // Poll every 3 seconds (replace with WebSocket later)
    }
  )

  useEffect(() => {
    if (query.data) {
      setMessages(conversationId, query.data)
    }
  }, [query.data, conversationId, setMessages])

  return query
}

export function useSendMessage() {
  const utils = trpc.useContext()

  return trpc.chat.sendMessage.useMutation({
    onSuccess: (_, variables) => {
      utils.chat.getMessages.invalidate({ conversationId: variables.conversationId })
      utils.chat.getConversations.invalidate()
    },
  })
}

export function useMarkAsRead() {
  const utils = trpc.useContext()

  return trpc.chat.markAsRead.useMutation({
    onSuccess: (_, variables) => {
      utils.chat.getMessages.invalidate({ conversationId: variables.conversationId })
      utils.chat.getConversations.invalidate()
    },
  })
}
