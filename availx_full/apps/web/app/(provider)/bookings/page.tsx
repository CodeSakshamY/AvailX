'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useProviderBookings, useUpdateBookingStatus } from '@/hooks/use-booking'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function ProviderBookingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const { data: bookings, isLoading } = useProviderBookings()
  const updateStatus = useUpdateBookingStatus()

  const filteredBookings = bookings?.filter((b: any) => {
    if (activeTab === 'all') return true
    return b.status === activeTab.toUpperCase()
  })

  const handleStatusUpdate = (bookingId: string, status: string) => {
    updateStatus.mutate({ bookingId, status })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredBookings && filteredBookings.length > 0 ? (
            <div className="grid gap-4">
              {filteredBookings.map((booking: any) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{booking.customer.name}</h3>
                          <Badge>{booking.status}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-1">{booking.service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(booking.scheduledFor)}
                        </p>
                        {booking.location && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {booking.location.address}
                          </p>
                        )}
                        <p className="text-lg font-semibold mt-2">
                          {formatCurrency(booking.totalAmount)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        {booking.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => handleStatusUpdate(booking.id, 'ACCEPTED')}
                              disabled={updateStatus.isLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                              disabled={updateStatus.isLoading}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </>
                        )}
                        {booking.status === 'ACCEPTED' && (
                          <Button
                            onClick={() => handleStatusUpdate(booking.id, 'IN_PROGRESS')}
                            disabled={updateStatus.isLoading}
                          >
                            Start Job
                          </Button>
                        )}
                        {booking.status === 'IN_PROGRESS' && (
                          <Button
                            onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                            disabled={updateStatus.isLoading}
                          >
                            Complete Job
                          </Button>
                        )}
                        <Button variant="outline">Contact Customer</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No bookings found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
