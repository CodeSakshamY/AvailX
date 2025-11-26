/**
 * Custom Booking Hooks
 * Wraps tRPC booking mutations and queries
 */

import { trpc } from '@/lib/trpc'
import { useToast } from '@/components/ui/use-toast'
import { useBookingStore } from '@/stores/booking-store'
import { useRouter } from 'next/navigation'

export function useCreateBooking() {
  const { toast } = useToast()
  const { clearBooking } = useBookingStore()
  const router = useRouter()
  const utils = trpc.useContext()

  return trpc.booking.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Booking Created',
        description: 'Your booking has been submitted successfully!',
      })
      clearBooking()
      utils.booking.getUserBookings.invalidate()
      router.push(`/booking/${data.id}`)
    },
    onError: (error) => {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUserBookings(status?: string) {
  return trpc.booking.getUserBookings.useQuery({ status })
}

export function useProviderBookings(status?: string) {
  return trpc.booking.getProviderBookings.useQuery({ status })
}

export function useBookingDetails(bookingId: string) {
  return trpc.booking.getDetails.useQuery({ bookingId }, {
    enabled: !!bookingId,
  })
}

export function useUpdateBookingStatus() {
  const { toast } = useToast()
  const utils = trpc.useContext()

  return trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Booking status has been updated',
      })
      utils.booking.getProviderBookings.invalidate()
      utils.booking.getUserBookings.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
