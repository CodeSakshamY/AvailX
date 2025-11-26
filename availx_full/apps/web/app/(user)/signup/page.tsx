'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit phone number'),
  email: z.string().email('Enter valid email').optional().or(z.literal('')),
  otp: z.string().optional(),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [otpSent, setOtpSent] = useState(false)
  const { signup, verifyOtp, isLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = (data: SignupForm) => {
    if (!otpSent) {
      // Create account and send OTP
      signup({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        role: 'CUSTOMER',
      })
      setOtpSent(true)
    } else {
      // Verify OTP
      verifyOtp({ phone: data.phone, otp: data.otp! })
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join AvailX to access verified service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                disabled={otpSent || isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                {...register('phone')}
                disabled={otpSent || isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                disabled={otpSent || isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            {otpSent && (
              <div>
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  {...register('otp')}
                  disabled={isLoading}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive mt-1">{errors.otp.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  OTP sent to {getValues('phone')}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpSent ? 'Verify & Create Account' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/provider/signup"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Want to provide services? Register as Provider
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
