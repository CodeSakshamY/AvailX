'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchBar } from '@/components/search-bar'
import { ProviderCard } from '@/components/provider-card'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useFeaturedProviders } from '@/hooks/use-providers'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'
import {
  Wrench,
  Zap,
  Home,
  Scissors,
  BookOpen,
  Droplet,
  Car,
  Laptop,
} from 'lucide-react'

const categories = [
  { id: '1', name: 'Plumbing', icon: Droplet, color: 'text-blue-500' },
  { id: '2', name: 'Electrician', icon: Zap, color: 'text-yellow-500' },
  { id: '3', name: 'Carpentry', icon: Wrench, color: 'text-orange-500' },
  { id: '4', name: 'Cleaning', icon: Home, color: 'text-green-500' },
  { id: '5', name: 'Salon', icon: Scissors, color: 'text-pink-500' },
  { id: '6', name: 'Tutoring', icon: BookOpen, color: 'text-purple-500' },
  { id: '7', name: 'Mechanics', icon: Car, color: 'text-red-500' },
  { id: '8', name: 'IT Support', icon: Laptop, color: 'text-indigo-500' },
]

export default function HomePage() {
  const router = useRouter()
  const { data: featuredProviders, isLoading } = useFeaturedProviders()
  const { data: servicesData } = trpc.services.getCategories.useQuery()

  const handleSearch = (query: string, location?: string) => {
    router.push(`/search?q=${query}${location ? `&location=${location}` : ''}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold">
          Find Trusted Local Services
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with verified service providers near you. From plumbing to tutoring,
          we've got you covered.
        </p>
        <div className="max-w-3xl mx-auto mt-8">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/search?category=${category.id}`)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Icon className={`h-8 w-8 mb-2 ${category.color}`} />
                  <p className="text-sm font-medium">{category.name}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Featured Providers Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top Rated Providers</h2>
          <Button variant="outline" onClick={() => router.push('/search')}>
            View All
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : featuredProviders && featuredProviders.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProviders.slice(0, 6).map((provider: any) => (
              <ProviderCard
                key={provider.id}
                provider={{
                  id: provider.id,
                  name: provider.name,
                  businessName: provider.businessName,
                  photo: provider.photo,
                  rating: provider.rating || 4.5,
                  totalReviews: provider.totalReviews || 0,
                  isVerified: provider.isVerified || false,
                  categories: provider.categories || [],
                  startingPrice: provider.startingPrice,
                  responseTime: '< 1 hour',
                }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No featured providers available yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Trust Badges Section */}
      <section className="bg-muted rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Why Choose AvailX?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-primary rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="font-semibold mb-2">Verified Providers</h3>
            <p className="text-sm text-muted-foreground">
              All providers verified with Aadhaar and background checks
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="font-semibold mb-2">Trusted Reviews</h3>
            <p className="text-sm text-muted-foreground">
              Real reviews from verified customers
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="font-semibold mb-2">Secure Bookings</h3>
            <p className="text-sm text-muted-foreground">
              Protected payments and service guarantees
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
