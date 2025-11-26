import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/providers/trpc-provider'
import { Toaster } from '@/components/ui/toaster'
import { AIAssistant } from '@/components/ai-assistant'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AvailX - Trust-First Service Marketplace',
  description: 'Connect with verified local service providers in India',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          {children}
          <AIAssistant />
          <Toaster />
        </TRPCProvider>
      </body>
    </html>
  )
}
