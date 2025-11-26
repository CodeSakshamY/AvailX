import { Navbar } from '@/components/navbar'

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
