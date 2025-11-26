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

const loginSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit phone number'),
  otp: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [otpSent, setOtpSent] = useState(false)
  const { login, verifyOtp, isLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginForm) => {
    if (!otpSent) {
      // Send OTP
      login({ phone: data.phone })
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
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Login to access trusted service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  OTP sent to your phone number
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpSent ? 'Verify OTP' : 'Send OTP'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/provider/login"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Are you a service provider? Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
