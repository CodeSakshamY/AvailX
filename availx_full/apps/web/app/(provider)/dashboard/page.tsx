'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useProviderBookings } from '@/hooks/use-booking'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency } from '@/lib/utils'
import {
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export default function ProviderDashboardPage() {
  const { user } = useAuthStore()
  const { data: bookings, isLoading } = useProviderBookings()

  const pendingBookings = bookings?.filter((b: any) => b.status === 'PENDING')
  const todayBookings = bookings?.filter((b: any) => {
    const today = new Date().toDateString()
    return new Date(b.scheduledFor).toDateString() === today
  })

  const stats = {
    totalBookings: bookings?.length || 0,
    pendingBookings: pendingBookings?.length || 0,
    todayBookings: todayBookings?.length || 0,
    monthlyRevenue: 45000, // Placeholder
    rating: 4.8,
    completionRate: 95,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Bookings</p>
                <p className="text-3xl font-bold mt-2">{stats.todayBookings}</p>
              </div>
              <Calendar className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold mt-2">{stats.pendingBookings}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Rating</p>
                <p className="text-3xl font-bold mt-2">{stats.rating}★</p>
              </div>
              <Star className="h-10 w-10 text-yellow-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{booking.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.service.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.scheduledFor).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          booking.status === 'PENDING'
                            ? 'warning'
                            : booking.status === 'COMPLETED'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {booking.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bookings yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Insights */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion Rate</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Response Time</span>
                  <span className="font-medium">&lt; 1 hour</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Customer Satisfaction</span>
                  <span className="font-medium">98%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Jobs</span>
                <span className="font-semibold">{stats.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Customers</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Repeat Customers</span>
                <span className="font-semibold">8</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
