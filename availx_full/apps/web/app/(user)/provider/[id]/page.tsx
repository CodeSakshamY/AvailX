'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RatingStars } from '@/components/rating-stars'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useProviderProfile, useProviderServices } from '@/hooks/use-providers'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Clock, Shield, MessageCircle, Calendar } from 'lucide-react'

export default function ProviderProfilePage() {
  const params = useParams()
  const router = useRouter()
  const providerId = params.id as string

  const { data: provider, isLoading } = useProviderProfile(providerId)
  const { data: services } = useProviderServices(providerId)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Provider Not Found</h1>
        <Button onClick={() => router.push('/search')}>Back to Search</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Provider Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={provider.photo} alt={provider.name} />
              <AvatarFallback className="text-3xl">
                {provider.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    {provider.businessName || provider.name}
                    {provider.isVerified && (
                      <Shield className="h-6 w-6 text-blue-500" />
                    )}
                  </h1>
                  <RatingStars rating={provider.rating || 4.5} size="lg" />
                  <p className="text-muted-foreground mt-1">
                    {provider.totalReviews || 0} reviews • {provider.completedJobs || 0} jobs completed
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {provider.categories?.map((category: string) => (
                  <Badge key={category}>{category}</Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {provider.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {provider.location.city}
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Response time: &lt; 1 hour
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/booking?provider=${providerId}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/chat?provider=${providerId}`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {provider.bio || 'Experienced professional providing quality services.'}
              </p>
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card>
            <CardHeader>
              <CardTitle>Services & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services && services.length > 0 ? (
                  services.map((service: any) => (
                    <div
                      key={service.id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(service.price)}</p>
                        {service.duration && (
                          <p className="text-xs text-muted-foreground">
                            {service.duration} mins
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No services listed yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {provider.reviews && provider.reviews.length > 0 ? (
                  provider.reviews.map((review: any) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <RatingStars rating={review.rating} size="sm" showValue={false} />
                        <span className="font-medium">{review.customerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No reviews yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verification Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Aadhaar Verified</span>
              </div>
              {provider.backgroundCheck && (
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Background Check Done</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">95%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Repeat Customers</p>
                <p className="text-2xl font-bold">{provider.repeatCustomers || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(provider.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
