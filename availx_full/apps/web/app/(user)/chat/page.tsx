'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useConversations, useMessages, useSendMessage } from '@/hooks/use-chat'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateTime } from '@/lib/utils'
import { Send, MessageCircle } from 'lucide-react'

export default function ChatPage() {
  const { user } = useAuthStore()
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations, isLoading: conversationsLoading } = useConversations()
  const { data: messages, isLoading: messagesLoading } = useMessages(activeConversation || '')
  const sendMessage = useSendMessage()

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0].id)
    }
  }, [conversations, activeConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim() || !activeConversation) return

    sendMessage.mutate({
      conversationId: activeConversation,
      content: message,
    })

    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (conversationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
      <div className="grid md:grid-cols-4 gap-4 h-full">
        {/* Conversations List */}
        <Card className="md:col-span-1 overflow-hidden">
          <CardHeader className="pb-3">
            <h2 className="font-semibold">Messages</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto h-[calc(100vh-16rem)]">
              {conversations && conversations.length > 0 ? (
                conversations.map((conv: any) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted transition ${
                      activeConversation === conv.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={conv.otherUser.photo} />
                        <AvatarFallback>
                          {conv.otherUser.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.otherUser.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-3 overflow-hidden flex flex-col">
          {activeConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>PR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {conversations?.find((c: any) => c.id === activeConversation)?.otherUser.name}
                    </p>
                    <p className="text-sm text-muted-foreground">Active now</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-4 overflow-y-auto">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg: any) => {
                      const isOwnMessage = msg.senderId === user?.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {formatDateTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </CardContent>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={handleSendMessage} disabled={sendMessage.isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
