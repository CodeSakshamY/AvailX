# AvailX tRPC Client Setup Guide

This guide shows how to set up the type-safe tRPC client in your frontend applications (React, React Native, Next.js).

## Table of Contents

- [Installation](#installation)
- [Client Setup](#client-setup)
- [React Query Setup](#react-query-setup)
- [Usage Examples](#usage-examples)
- [Next.js Integration](#nextjs-integration)
- [React Native Integration](#react-native-integration)

## Installation

```bash
# Core dependencies
pnpm add @trpc/client @trpc/server @trpc/react-query @tanstack/react-query zod

# For Next.js
pnpm add @trpc/next

# For React Native
pnpm add @trpc/react-query react-native-mmkv superjson
```

## Client Setup

### 1. Create the tRPC client

Create `lib/trpc.ts`:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@localpro/api';
import superjson from 'superjson';

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Create the client
export function getTRPCClient(token?: string) {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/trpc',
        headers() {
          return {
            authorization: token ? `Bearer ${token}` : '',
          };
        },
      }),
    ],
  });
}
```

### 2. Create Provider Component

Create `components/providers/TRPCProvider.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { trpc, getTRPCClient } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() => getTRPCClient(token));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 3. Wrap your app

```typescript
// app/layout.tsx (Next.js App Router)
import { TRPCProvider } from '@/components/providers/TRPCProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

## React Query Setup

The tRPC client automatically integrates with React Query. All queries and mutations are type-safe!

## Usage Examples

### Authentication

```typescript
import { trpc } from '@/lib/trpc';

function LoginForm() {
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (phone: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({
        phone,
        password,
      });

      console.log('Login successful:', result.token);
      // Save token to localStorage/AsyncStorage
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(phone, password);
    }}>
      {/* Form fields */}
      <button type="submit" disabled={loginMutation.isLoading}>
        {loginMutation.isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Search Providers

```typescript
import { trpc } from '@/lib/trpc';

function ProviderSearch() {
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 });

  const { data, isLoading, error } = trpc.provider.searchByRadius.useQuery({
    latitude: location.lat,
    longitude: location.lng,
    radiusKm: 10,
    sortBy: 'distance',
    page: 1,
    limit: 20,
  });

  if (isLoading) return <div>Loading providers...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Found {data.pagination.total} providers near you</h2>
      {data.providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
```

### Create Booking

```typescript
import { trpc } from '@/lib/trpc';

function BookingForm({ providerId }: { providerId: string }) {
  const utils = trpc.useContext();
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch bookings
      utils.booking.listForCustomer.invalidate();
    },
  });

  const handleSubmit = async (data: BookingFormData) => {
    try {
      const booking = await createBooking.mutateAsync({
        providerId,
        serviceType: data.serviceType,
        serviceLocation: {
          address: data.address,
          lat: data.lat,
          lng: data.lng,
        },
        scheduledDate: data.date.toISOString(),
        scheduledTime: {
          start: data.startTime,
          end: data.endTime,
        },
        specialInstructions: data.notes,
      });

      console.log('Booking created:', booking);
      router.push(`/bookings/${booking.id}`);
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createBooking.isLoading}>
        {createBooking.isLoading ? 'Creating...' : 'Book Now'}
      </button>
    </form>
  );
}
```

### Real-time Chat

```typescript
import { trpc } from '@/lib/trpc';

function ChatRoom({ chatRoomId }: { chatRoomId: string }) {
  const utils = trpc.useContext();

  const { data: messages } = trpc.chat.getMessages.useQuery({
    chatRoomId,
    limit: 50,
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ chatRoomId });
    },
  });

  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({
      chatRoomId,
      recipientId: recipientId,
      type: 'TEXT',
      content,
    });
  };

  return (
    <div>
      <MessageList messages={messages?.messages || []} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
```

### Provider Dashboard

```typescript
import { trpc } from '@/lib/trpc';

function ProviderDashboard() {
  const { data: stats, isLoading } = trpc.provider.getDashboardStats.useQuery();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stats">
        <StatCard
          title="Total Jobs"
          value={stats.stats.totalJobs}
          icon="briefcase"
        />
        <StatCard
          title="Completed"
          value={stats.stats.completedJobs}
          icon="check"
        />
        <StatCard
          title="Average Rating"
          value={stats.stats.averageRating.toFixed(1)}
          icon="star"
        />
      </div>

      <div className="recent-bookings">
        <h2>Recent Bookings</h2>
        {stats.recentBookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}
```

### AI Assistant

```typescript
import { trpc } from '@/lib/trpc';

function AIAssistant() {
  const [query, setQuery] = useState('');
  const askAssistant = trpc.ai.askAssistant.useMutation();

  const handleAsk = async () => {
    const response = await askAssistant.mutateAsync({
      query,
      context: { page: 'dashboard' },
    });

    console.log('AI Response:', response.response);
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask me anything..."
      />
      <button onClick={handleAsk} disabled={askAssistant.isLoading}>
        Ask
      </button>
      {askAssistant.data && (
        <div className="response">
          {askAssistant.data.response}
        </div>
      )}
    </div>
  );
}
```

## Next.js Integration

For Next.js App Router with server components:

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@localpro/api';
import { createContext } from '@localpro/api';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

## React Native Integration

For React Native apps:

```typescript
// lib/trpc.ts (React Native specific)
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@localpro/api';
import superjson from 'superjson';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: 'https://api.availx.com/trpc',
        async headers() {
          const token = await AsyncStorage.getItem('auth_token');
          return {
            authorization: token ? `Bearer ${token}` : '',
          };
        },
      }),
    ],
  });
}
```

## Error Handling

```typescript
import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@localpro/api';

function Component() {
  const mutation = trpc.booking.create.useMutation({
    onError: (error) => {
      if (error instanceof TRPCClientError) {
        // Handle specific error codes
        switch (error.data?.code) {
          case 'UNAUTHORIZED':
            router.push('/login');
            break;
          case 'BAD_REQUEST':
            showToast('Invalid booking data');
            break;
          default:
            showToast('An error occurred');
        }
      }
    },
  });
}
```

## Optimistic Updates

```typescript
function LikeButton({ providerId }: { providerId: string }) {
  const utils = trpc.useContext();

  const likeMutation = trpc.provider.like.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.provider.getById.cancel({ providerId });

      // Snapshot the previous value
      const previousData = utils.provider.getById.getData({ providerId });

      // Optimistically update
      utils.provider.getById.setData(
        { providerId },
        (old) => old && { ...old, isLiked: true }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.provider.getById.setData({ providerId }, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after success or error
      utils.provider.getById.invalidate({ providerId });
    },
  });
}
```

## Type Safety

All tRPC calls are fully type-safe:

```typescript
// ✅ Correct
const result = await trpc.auth.login.mutate({
  phone: '+919876543210',
  password: 'secret',
});

// ❌ TypeScript error - missing required field
const result = await trpc.auth.login.mutate({
  phone: '+919876543210',
  // password is missing!
});

// ✅ Autocomplete works perfectly
const providers = await trpc.provider.searchByRadius.query({
  latitude: 28.6139,
  longitude: 77.2090,
  radiusKm: 10,
  // TypeScript suggests all available options
});
```

That's it! Your AvailX frontend is now connected to the backend with full type safety! 🎉
