'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateBooking } from '@/hooks/use-booking'
import { useProviderProfile } from '@/hooks/use-providers'
import { useBookingStore } from '@/stores/booking-store'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Calendar, MapPin, Clock, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  scheduledDate: z.string().min(1, 'Please select a date'),
  scheduledTime: z.string().min(1, 'Please select a time'),
  address: z.string().min(10, 'Please provide complete address'),
  notes: z.string().optional(),
})

type BookingForm = z.infer<typeof bookingSchema>

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const providerId = searchParams.get('provider')

  const { data: provider, isLoading } = useProviderProfile(providerId || '')
  const createBooking = useCreateBooking()
  const { step, setStep, nextStep, currentBooking, setBookingData } = useBookingStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  })

  const [selectedService, setSelectedService] = useState<any>(null)

  const onSubmit = (data: BookingForm) => {
    if (!providerId) return

    createBooking.mutate({
      providerId,
      serviceId: data.serviceId,
      scheduledFor: new Date(`${data.scheduledDate}T${data.scheduledTime}`),
      location: {
        address: data.address,
        lat: 0, // Should get from geocoding
        lng: 0,
      },
      notes: data.notes,
    })
  }

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
        <h1 className="text-2xl font-bold mb-4">Provider not found</h1>
        <Button onClick={() => router.push('/search')}>Back to Search</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Book Service with {provider.businessName || provider.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Selection */}
            <div>
              <Label>Select Service *</Label>
              <div className="grid gap-3 mt-2">
                {provider.services?.map((service: any) => (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedService?.id === service.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedService(service)
                      setBookingData({ serviceId: service.id })
                    }}
                  >
                    <input
                      type="radio"
                      value={service.id}
                      {...register('serviceId')}
                      className="hidden"
                      checked={selectedService?.id === service.id}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(service.price)}</p>
                        {service.duration && (
                          <p className="text-xs text-muted-foreground">{service.duration} mins</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.serviceId && (
                <p className="text-sm text-destructive mt-1">{errors.serviceId.message}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('scheduledDate')}
                />
                {errors.scheduledDate && (
                  <p className="text-sm text-destructive mt-1">{errors.scheduledDate.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="scheduledTime">Time *</Label>
                <Input id="scheduledTime" type="time" {...register('scheduledTime')} />
                {errors.scheduledTime && (
                  <p className="text-sm text-destructive mt-1">{errors.scheduledTime.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Service Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter complete address where service is needed"
                rows={3}
                {...register('address')}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific requirements or instructions"
                rows={2}
                {...register('notes')}
              />
            </div>

            {/* Summary */}
            {selectedService && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{formatCurrency(selectedService.price)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedService.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBooking.isLoading}
                className="flex-1"
              >
                {createBooking.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
