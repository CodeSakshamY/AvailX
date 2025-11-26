'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search-bar'
import { ProviderCard } from '@/components/provider-card'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { useSearchProviders } from '@/hooks/use-providers'
import { SlidersHorizontal } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''

  const [searchQuery, setSearchQuery] = useState(query)
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    radiusKm: 10,
  })

  // Get user location (placeholder)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to Lucknow coordinates
          setUserLocation({ lat: 26.8467, lng: 80.9462 })
        }
      )
    } else {
      // Default to Lucknow coordinates
      setUserLocation({ lat: 26.8467, lng: 80.9462 })
    }
  }, [])

  const { data: providers, isLoading } = useSearchProviders({
    query: searchQuery,
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
    radiusKm: filters.radiusKm,
    categoryId: category,
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const filteredProviders = providers?.filter((p: any) => {
    if (filters.minRating > 0 && (p.rating || 0) < filters.minRating) return false
    if (filters.minPrice > 0 && (p.startingPrice || 0) < filters.minPrice) return false
    if (filters.maxPrice < 10000 && (p.startingPrice || 0) > filters.maxPrice) return false
    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          onFilterClick={() => {}}
          placeholder="Search for services..."
        />
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-4">Filters</h3>
              </div>

              <div>
                <Label className="text-sm mb-2">
                  Search Radius: {filters.radiusKm}km
                </Label>
                <Slider
                  value={[filters.radiusKm]}
                  onValueChange={(value) =>
                    setFilters({ ...filters, radiusKm: value[0] })
                  }
                  min={1}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm mb-2">
                  Minimum Rating: {filters.minRating}★
                </Label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={(value) =>
                    setFilters({ ...filters, minRating: value[0] })
                  }
                  min={0}
                  max={5}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="minPrice" className="text-sm">
                  Min Price
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: Number(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="maxPrice" className="text-sm">
                  Max Price
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPrice: Number(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setFilters({
                    minPrice: 0,
                    maxPrice: 10000,
                    minRating: 0,
                    radiusKm: 10,
                  })
                }
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Filters */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="rounded-full h-14 w-14 shadow-lg">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your search results
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {/* Same filter controls as desktop */}
                <div>
                  <Label className="text-sm mb-2">
                    Search Radius: {filters.radiusKm}km
                  </Label>
                  <Slider
                    value={[filters.radiusKm]}
                    onValueChange={(value) =>
                      setFilters({ ...filters, radiusKm: value[0] })
                    }
                    min={1}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results */}
        <main className="flex-1">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredProviders?.length || 0} providers found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredProviders && filteredProviders.length > 0 ? (
            <div className="grid gap-6">
              {filteredProviders.map((provider: any) => (
                <ProviderCard
                  key={provider.id}
                  provider={{
                    id: provider.id,
                    name: provider.name,
                    businessName: provider.businessName,
                    photo: provider.photo,
                    rating: provider.rating || 4.5,
                    totalReviews: provider.totalReviews || 0,
                    distance: provider.distance,
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
                <p className="text-muted-foreground mb-4">
                  No providers found matching your criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({
                      minPrice: 0,
                      maxPrice: 10000,
                      minRating: 0,
                      radiusKm: 10,
                    })
                  }}
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
