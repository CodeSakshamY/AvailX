'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Loader2, Briefcase, Shield } from 'lucide-react'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  businessName: z.string().min(2, 'Business name required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit phone number'),
  email: z.string().email('Enter valid email').optional().or(z.literal('')),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/, 'Enter valid 12-digit Aadhaar').optional(),
  otp: z.string().optional(),
})

type SignupForm = z.infer<typeof signupSchema>

export default function ProviderSignupPage() {
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
      signup({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        role: 'PROVIDER',
        businessName: data.businessName,
      })
      setOtpSent(true)
    } else {
      verifyOtp({ phone: data.phone, otp: data.otp! })
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Join as Provider</CardTitle>
          <CardDescription>
            Start growing your business with AvailX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Verification Required</p>
                <p className="text-muted-foreground">
                  All providers must complete Aadhaar verification for customer trust
                </p>
              </div>
            </div>
          </div>

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
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="John's Plumbing Services"
                {...register('businessName')}
                disabled={otpSent || isLoading}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive mt-1">{errors.businessName.message}</p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  OTP sent to {getValues('phone')}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpSent ? 'Verify & Register' : 'Create Provider Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              Already a provider?{' '}
              <Link href="/provider/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
            <Link href="/signup" className="text-muted-foreground hover:text-primary block">
              Looking for services? Sign up as Customer
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
