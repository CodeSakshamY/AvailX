import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, MapPin, Clock, IndianRupee, MessageCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface BookingCardProps {
  booking: {
    id: string
    provider: {
      id: string
      name: string
      photo?: string
    }
    service: {
      name: string
    }
    scheduledFor: Date
    status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    totalAmount: number
    location?: {
      address: string
    }
  }
  onCancel?: () => void
  onContact?: () => void
}

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  ACCEPTED: 'default',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
}

export function BookingCard({ booking, onCancel, onContact }: BookingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={booking.provider.photo} alt={booking.provider.name} />
              <AvatarFallback>
                {booking.provider.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{booking.provider.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{booking.service.name}</p>
            </div>
          </div>
          <Badge variant={statusColors[booking.status] as any}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(booking.scheduledFor)}</span>
        </div>

        {booking.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="line-clamp-1">{booking.location.address}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm font-semibold">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          <span>{formatCurrency(booking.totalAmount)}</span>
        </div>

        <div className="flex gap-2 pt-2">
          {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onContact}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
