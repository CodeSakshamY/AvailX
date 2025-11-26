'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Sparkles } from 'lucide-react'

export default function ProviderChatPage() {
  const [message, setMessage] = useState('')
  const [showAiSuggestion, setShowAiSuggestion] = useState(true)

  const aiSuggestions = [
    "I'm on my way and will reach in 15 minutes.",
    "I've completed the work. Please review and confirm.",
    "Thank you for choosing my service!",
  ]

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold mb-6">Customer Chat</h1>

      <div className="grid md:grid-cols-4 gap-4 h-full">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <h2 className="font-semibold">Conversations</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-8 text-center text-muted-foreground">
              <p>No conversations yet</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col">
          <CardContent className="flex-1 p-8 text-center flex items-center justify-center">
            <p className="text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </CardContent>

          {showAiSuggestion && (
            <div className="p-4 bg-muted/50 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Quick Replies</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setMessage(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
