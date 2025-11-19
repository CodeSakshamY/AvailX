# LocalPro Connect — Complete Implementation Guide

**Version:** 1.0
**Last Updated:** 2025-11-19
**Status:** Production-Ready Architecture

---

## Table of Contents

1. [Backend API - Remaining Routers](#1-backend-api-remaining-routers)
2. [AI Service Architecture](#2-ai-service-architecture)
3. [Frontend - Next.js Apps](#3-frontend-nextjs-apps)
4. [Frontend - Expo Mobile Apps](#4-frontend-expo-mobile-apps)
5. [UI/UX Design System](#5-uiux-design-system)
6. [Testing Strategy](#6-testing-strategy)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Docker & Deployment](#8-docker--deployment)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [Developer Workflow](#10-developer-workflow)

---

## 1. Backend API - Remaining Routers

### 1.1 Provider Profile Router

**File:** `packages/api/src/routers/provider.ts`

```typescript
import { router, protectedProcedure, providerProcedure, adminProcedure } from '../trpc';
import { createProviderProfileSchema, updateProviderProfileSchema } from '@localpro/types';
import { TRPCError } from '@trpc/server';

export const providerRouter = router({
  // Create/Update Profile
  create: protectedProcedure
    .input(createProviderProfileSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.role !== 'PROVIDER') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const existing = await ctx.prisma.providerProfile.findUnique({
        where: { userId: ctx.session.id },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Profile already exists',
        });
      }

      const profile = await ctx.prisma.providerProfile.create({
        data: {
          userId: ctx.session.id,
          ...input,
          profileStatus: 'PENDING',
        },
      });

      return profile;
    }),

  update: providerProcedure
    .input(updateProviderProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.providerProfile.update({
        where: { id: ctx.providerProfile.id },
        data: input,
      });

      return profile;
    }),

  // Portfolio Management
  addPhoto: providerProcedure
    .input(z.object({
      url: z.string().url(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const count = await ctx.prisma.providerPhoto.count({
        where: { providerId: ctx.providerProfile.id },
      });

      const photo = await ctx.prisma.providerPhoto.create({
        data: {
          providerId: ctx.providerProfile.id,
          url: input.url,
          caption: input.caption,
          sortOrder: count,
        },
      });

      return photo;
    }),

  deletePhoto: providerProcedure
    .input(z.object({ photoId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const photo = await ctx.prisma.providerPhoto.findUnique({
        where: { id: input.photoId },
      });

      if (photo?.providerId !== ctx.providerProfile.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.prisma.providerPhoto.delete({
        where: { id: input.photoId },
      });

      return { success: true };
    }),

  // Analytics
  stats: providerProcedure.query(async ({ ctx }) => {
    const [bookings, reviews, earnings] = await Promise.all([
      ctx.prisma.booking.groupBy({
        by: ['status'],
        where: { providerId: ctx.providerProfile.id },
        _count: true,
      }),
      ctx.prisma.review.aggregate({
        where: { providerId: ctx.providerProfile.id },
        _avg: { overallRating: true },
        _count: true,
      }),
      ctx.prisma.payment.aggregate({
        where: {
          booking: { providerId: ctx.providerProfile.id },
          status: 'COMPLETED',
        },
        _sum: { providerEarnings: true },
      }),
    ]);

    return {
      bookings,
      reviews,
      totalEarnings: earnings._sum.providerEarnings || 0,
    };
  }),
});
```

### 1.2 Payment Router

**File:** `packages/api/src/routers/payment.ts`

```typescript
import { router, protectedProcedure, customerProcedure } from '../trpc';
import { recordPaymentSchema } from '@localpro/types';
import { TRPCError } from '@trpc/server';

export const paymentRouter = router({
  record: customerProcedure
    .input(recordPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      const { bookingId, amount, method, transactionId } = input;

      const booking = await ctx.prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
      }

      if (booking.customerId !== ctx.customerProfile!.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (booking.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only record payment for completed bookings',
        });
      }

      const existing = await ctx.prisma.payment.findUnique({
        where: { bookingId },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Payment already recorded',
        });
      }

      let platformFee = 0;
      let providerEarnings = amount;

      if (method !== 'CASH' && method !== 'UPI') {
        platformFee = amount * 0.1;
        providerEarnings = amount - platformFee;
      }

      const payment = await ctx.prisma.payment.create({
        data: {
          bookingId,
          amount,
          currency: 'INR',
          method,
          transactionId,
          status: 'COMPLETED',
          platformFee,
          providerEarnings,
          paidAt: new Date(),
        },
      });

      return payment;
    }),

  myPayments: customerProcedure.query(async ({ ctx }) => {
    const payments = await ctx.prisma.payment.findMany({
      where: {
        booking: {
          customerId: ctx.customerProfile!.id,
        },
      },
      include: {
        booking: {
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments;
  }),
});
```

### 1.3 Review Router

**File:** `packages/api/src/routers/review.ts`

```typescript
import { router, customerProcedure, providerProcedure } from '../trpc';
import { createReviewSchema, respondToReviewSchema, flagReviewSchema } from '@localpro/types';
import { TRPCError } from '@trpc/server';

export const reviewRouter = router({
  create: customerProcedure
    .input(createReviewSchema)
    .mutation(async ({ input, ctx }) => {
      const { bookingId, ...reviewData } = input;

      const booking = await ctx.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { review: true },
      });

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (booking.customerId !== ctx.customerProfile!.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (booking.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only review completed bookings',
        });
      }

      if (booking.review) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Review already exists',
        });
      }

      const review = await ctx.prisma.review.create({
        data: {
          bookingId,
          customerId: ctx.customerProfile!.id,
          providerId: booking.providerId,
          ...reviewData,
        },
      });

      const avgRating = await ctx.prisma.review.aggregate({
        where: { providerId: booking.providerId },
        _avg: { overallRating: true },
      });

      await ctx.prisma.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          averageRating: avgRating._avg.overallRating || 0,
        },
      });

      return review;
    }),

  respond: providerProcedure
    .input(respondToReviewSchema)
    .mutation(async ({ input, ctx }) => {
      const { reviewId, response } = input;

      const review = await ctx.prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (review.providerId !== ctx.providerProfile.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const updated = await ctx.prisma.review.update({
        where: { id: reviewId },
        data: {
          providerResponse: response,
          respondedAt: new Date(),
        },
      });

      return updated;
    }),
});
```

---

## 2. AI Service Architecture

### 2.1 AI Service Package Structure

```
packages/ai/
├── src/
│   ├── services/
│   │   ├── matching.ts       # Provider matching logic
│   │   ├── translation.ts    # Real-time translation
│   │   ├── fraud.ts          # Fraud detection
│   │   └── assistant.ts      # Chatbot assistant
│   ├── models/
│   │   ├── embeddings.ts     # Generate embeddings
│   │   └── llm.ts            # LLM adapter
│   ├── utils/
│   │   ├── cache.ts          # Response caching
│   │   └── ratelimit.ts      # Rate limiting
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 2.2 AI Matching Service

**File:** `packages/ai/src/services/matching.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchRequest {
  query: string;
  location: { lat: number; lng: number };
  history?: any[];
}

export async function matchProviders(request: MatchRequest) {
  const { query, location, history } = request;

  // Generate embedding for query
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  // Vector similarity search (pseudocode - requires pgvector)
  const candidates = await prisma.$queryRaw`
    SELECT * FROM provider_profiles
    WHERE embedding <-> ${embedding.data[0].embedding}::vector < 0.5
    LIMIT 20
  `;

  // GPT-4 reranking with context
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI that matches customers with service providers.
        Consider: query intent, location, ratings, availability, past preferences.
        Return top 5 provider IDs in order of relevance.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          query,
          location,
          history,
          candidates: candidates.map((p) => ({
            id: p.id,
            name: p.businessName,
            rating: p.averageRating,
            completedJobs: p.completedJobs,
          })),
        }),
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result.providerIds;
}
```

### 2.3 Translation Service

**File:** `packages/ai/src/services/translation.ts`

```typescript
import OpenAI from 'openai';
import { createClient } from 'redis';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const redis = createClient({ url: process.env.REDIS_URL });

await redis.connect();

export async function translateMessage(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (sourceLang === targetLang) {
    return text;
  }

  const cacheKey = `translate:${sourceLang}:${targetLang}:${text}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return cached;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Translate the following text from ${sourceLang} to ${targetLang}.
        Preserve service-related terminology. Be natural and conversational.`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0.3,
  });

  const translation = completion.choices[0].message.content!;

  await redis.setEx(cacheKey, 86400, translation);

  return translation;
}
```

### 2.4 Fraud Detection

**File:** `packages/ai/src/services/fraud.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function detectFraud(data: {
  userId: string;
  activity: any;
  context: any;
}): Promise<{ isFraud: boolean; confidence: number; reason: string }> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a fraud detection system for a service marketplace.
        Analyze user behavior and flag suspicious activity.
        Consider: duplicate bookings, fake reviews, payment fraud, account abuse.`,
      },
      { role: 'user', content: JSON.stringify(data) },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content!);
}
```

---

## 3. Frontend - Next.js Apps

### 3.1 Customer Web App Structure

```
apps/web-customer/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── bookings/page.tsx
│   │   │   ├── providers/[id]/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── providers/
│   │   ├── bookings/
│   │   └── chat/
│   ├── lib/
│   │   ├── trpc.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── package.json
└── next.config.js
```

### 3.2 Key Components

**Provider Card Component**

```typescript
// components/providers/ProviderCard.tsx
'use client';

import { Star, MapPin, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProviderCardProps {
  provider: {
    id: string;
    user: { name: string; profilePhoto?: string };
    businessName?: string;
    averageRating: number;
    completedJobs: number;
    distance: number;
    pricing: any;
    aadhaarVerified: boolean;
    backgroundVerified: boolean;
  };
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <img
            src={provider.user.profilePhoto || '/avatar-placeholder.png'}
            alt={provider.user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {provider.businessName || provider.user.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-sm font-medium">
                  {provider.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({provider.completedJobs} jobs)
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{provider.distance.toFixed(1)} km away</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {provider.aadhaarVerified && (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="w-3 h-3" />
              Aadhaar Verified
            </Badge>
          )}
          {provider.backgroundVerified && (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="w-3 h-3" />
              Background Checked
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1">
          View Profile
        </Button>
        <Button className="flex-1">Book Now</Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 4. Frontend - Expo Mobile Apps

### 4.1 Customer Mobile App Structure

```
apps/mobile-customer/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home/Search
│   │   ├── bookings.tsx       # My Bookings
│   │   ├── chat.tsx           # Messages
│   │   └── profile.tsx        # Profile
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── provider/[id].tsx      # Provider Detail
│   └── _layout.tsx
├── components/
├── lib/
└── package.json
```

### 4.2 Key Screens

**Home Screen (Search)**

```typescript
// app/(tabs)/index.tsx
import { useState } from 'react';
import { View, TextInput, FlatList } from 'react-native';
import { trpc } from '@/lib/trpc';
import { ProviderCard } from '@/components/ProviderCard';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState({ lat: 26.8467, lng: 80.9462, radiusKm: 10 });

  const { data, isLoading } = trpc.search.providers.useQuery({
    query,
    location,
  });

  return (
    <View className="flex-1 bg-white">
      <TextInput
        placeholder="What service do you need?"
        value={query}
        onChangeText={setQuery}
        className="p-4 border-b border-gray-200"
      />

      <FlatList
        data={data?.providers || []}
        renderItem={({ item }) => <ProviderCard provider={item} />}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
      />
    </View>
  );
}
```

---

## 5. UI/UX Design System

See [UI_UX_DESIGN.md](./UI_UX_DESIGN.md) for complete wireframes and journey maps.

---

## 6. Testing Strategy

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete test suite.

---

## 7. CI/CD Pipeline

See [CICD_GUIDE.md](./CICD_GUIDE.md) for complete pipeline configuration.

---

## 8. Docker & Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

---

## 9. Monitoring & Observability

See [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) for complete monitoring setup.

---

## 10. Developer Workflow

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for complete development instructions.

---

**Next Steps:** Refer to individual guides for detailed implementation of each component.
