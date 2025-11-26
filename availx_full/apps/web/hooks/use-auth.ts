/**
 * Custom Auth Hooks
 * Wraps tRPC auth mutations with auth store integration
 */

import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      })
      router.push(user?.role === 'PROVIDER' ? '/provider/dashboard' : '/home')
    },
    onError: (error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      if (data.requiresOtp) {
        toast({
          title: 'OTP Sent',
          description: 'Please verify your phone number',
        })
      } else {
        setAuth(data.user!, data.token!)
        router.push('/home')
      }
    },
    onError: (error) => {
      toast({
        title: 'Signup Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const verifyOtpMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast({
        title: 'Verification Successful',
        description: 'Your account is now active!',
      })
      router.push(user?.role === 'PROVIDER' ? '/provider/dashboard' : '/home')
    },
    onError: (error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const logout = () => {
    clearAuth()
    router.push('/login')
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    })
  }

  return {
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    verifyOtp: verifyOtpMutation.mutate,
    logout,
    isLoading: loginMutation.isLoading || signupMutation.isLoading || verifyOtpMutation.isLoading,
    isAuthenticated,
    user,
  }
}
