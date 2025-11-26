import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RatingStars } from '@/components/rating-stars'
import { MapPin, Clock, IndianRupee, Shield } from 'lucide-react'
import { formatCurrency, formatDistance } from '@/lib/utils'
import Link from 'next/link'

interface ProviderCardProps {
  provider: {
    id: string
    name: string
    businessName?: string
    photo?: string
    rating: number
    totalReviews: number
    distance?: number
    isVerified: boolean
    categories: string[]
    startingPrice?: number
    responseTime?: string
  }
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={provider.photo} alt={provider.name} />
            <AvatarFallback>
              {provider.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {provider.businessName || provider.name}
                  {provider.isVerified && (
                    <Shield className="h-4 w-4 text-blue-500" />
                  )}
                </h3>
                <RatingStars
                  rating={provider.rating}
                  size="sm"
                  showValue={true}
                />
                <p className="text-xs text-muted-foreground">
                  {provider.totalReviews} reviews
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {provider.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {provider.distance && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {formatDistance(provider.distance)}
                </div>
              )}
              {provider.startingPrice && (
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  From {formatCurrency(provider.startingPrice)}
                </div>
              )}
              {provider.responseTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {provider.responseTime}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Link href={`/provider/${provider.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Link>
              <Link href={`/booking?provider=${provider.id}`} className="flex-1">
                <Button className="w-full">Book Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
