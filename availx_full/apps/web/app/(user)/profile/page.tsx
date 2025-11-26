'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BookingCard } from '@/components/booking-card'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useAuthStore } from '@/stores/auth-store'
import { useUserBookings } from '@/hooks/use-booking'
import { useRouter } from 'next/navigation'
import { User, MapPin, Mail, Phone, Edit, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { data: bookings, isLoading } = useUserBookings()

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <Badge variant="secondary" className="mb-4">
                {user.role}
              </Badge>

              <div className="space-y-2 text-sm text-left mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </div>
                {user.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date().toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : bookings && bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onContact={() => router.push(`/chat?booking=${booking.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No bookings yet</p>
                  <Button onClick={() => router.push('/search')}>
                    Find Services
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
