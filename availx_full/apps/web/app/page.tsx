import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to home page (user app)
  redirect('/home')
}
