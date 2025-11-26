# AvailX React Query Hooks Examples

Complete guide to using all AvailX tRPC endpoints with React Query.

## Table of Contents

1. [Authentication](#authentication)
2. [Provider Management](#provider-management)
3. [Booking Management](#booking-management)
4. [Services & Categories](#services--categories)
5. [Reviews & Ratings](#reviews--ratings)
6. [Payments](#payments)
7. [Notifications](#notifications)
8. [AI Features](#ai-features)
9. [Chat & Messaging](#chat--messaging)
10. [Admin Operations](#admin-operations)

---

## Authentication

### Login with OTP

```typescript
import { trpc } from '@/lib/trpc';

function LoginWithOTP() {
  const sendOTP = trpc.auth.sendOTP.useMutation();
  const verifyPhone = trpc.auth.verifyPhone.useMutation();

  // Step 1: Send OTP
  const handleSendOTP = async (phone: string) => {
    await sendOTP.mutateAsync({
      phone: '+919876543210',
      purpose: 'LOGIN',
    });
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (phone: string, otp: string) => {
    const result = await verifyPhone.mutateAsync({
      phone,
      otp,
    });
    // Save token
    localStorage.setItem('token', result.token);
  };
}
```

### Sign Up

```typescript
function SignUpForm() {
  const signUp = trpc.auth.signUp.useMutation();

  const handleSignUp = async () => {
    const result = await signUp.mutateAsync({
      phone: '+919876543210',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'CUSTOMER',
      password: 'securePassword123',
    });

    localStorage.setItem('token', result.token);
    router.push('/dashboard');
  };
}
```

### Update Profile

```typescript
function ProfileSettings() {
  const utils = trpc.useContext();
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.getCurrentUser.invalidate();
    },
  });

  const handleUpdate = async () => {
    await updateProfile.mutateAsync({
      name: 'John Smith',
      email: 'johnsmith@example.com',
      profilePhoto: 'https://cdn.example.com/photo.jpg',
    });
  };
}
```

### Change Password

```typescript
function ChangePasswordForm() {
  const changePassword = trpc.auth.changePassword.useMutation();

  const handleChangePassword = async () => {
    await changePassword.mutateAsync({
      currentPassword: 'oldPassword123',
      newPassword: 'newSecurePassword456',
    });

    showToast('Password changed successfully');
  };
}
```

---

## Provider Management

### Search Providers by Radius

```typescript
function ProviderSearch() {
  const { data, isLoading, fetchNextPage, hasNextPage } =
    trpc.provider.searchByRadius.useInfiniteQuery(
      {
        latitude: 28.6139,
        longitude: 77.2090,
        radiusKm: 10,
        categoryId: 'clx...',
        minRating: 4.0,
        sortBy: 'rating',
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      }
    );

  return (
    <div>
      {data?.pages.map((page) =>
        page.providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

### Get Provider Details

```typescript
function ProviderProfile({ providerId }: { providerId: string }) {
  const { data: provider } = trpc.provider.getById.useQuery({ providerId });

  if (!provider) return <LoadingSkeleton />;

  return (
    <div>
      <h1>{provider.user.name}</h1>
      <p>{provider.description}</p>
      <Rating value={provider.averageRating} />
      <ReviewsList reviews={provider.reviews} />
    </div>
  );
}
```

### Create Provider Profile

```typescript
function ProviderOnboarding() {
  const createProfile = trpc.provider.createProfile.useMutation();

  const handleSubmit = async () => {
    await createProfile.mutateAsync({
      businessName: 'Quick Fix Plumbing',
      description: 'Professional plumbing services with 10 years experience',
      categoryId: 'clx...',
      subCategoryIds: ['clx...', 'clx...'],
      baseLocation: {
        address: '123 Main St, Delhi',
        lat: 28.6139,
        lng: 77.2090,
      },
      pricing: {
        hourlyRate: 500,
        fixedPrice: 1000,
      },
      workingHours: {
        monday: { start: '09:00', end: '18:00', isAvailable: true },
        tuesday: { start: '09:00', end: '18:00', isAvailable: true },
      },
    });
  };
}
```

### Upload Documents

```typescript
function DocumentUpload() {
  const uploadDocument = trpc.provider.uploadDocument.useMutation();

  const handleUpload = async (documentUrl: string) => {
    await uploadDocument.mutateAsync({
      type: 'AADHAAR',
      url: documentUrl,
    });
  };
}
```

### Provider Dashboard

```typescript
function ProviderDashboard() {
  const { data: stats } = trpc.provider.getDashboardStats.useQuery();

  return (
    <Dashboard>
      <StatsGrid>
        <Stat title="Total Jobs" value={stats?.stats.totalJobs} />
        <Stat title="Completed" value={stats?.stats.completedJobs} />
        <Stat title="Rating" value={stats?.stats.averageRating} />
      </StatsGrid>

      <BookingsList bookings={stats?.recentBookings} />
      <ReviewsList reviews={stats?.recentReviews} />
    </Dashboard>
  );
}
```

---

## Booking Management

### Create Booking

```typescript
function BookingCheckout({ providerId }: { providerId: string }) {
  const utils = trpc.useContext();
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (booking) => {
      utils.booking.listForCustomer.invalidate();
      router.push(`/bookings/${booking.id}`);
    },
  });

  const handleBook = async () => {
    await createBooking.mutateAsync({
      providerId,
      serviceType: 'Plumbing Repair',
      serviceLocation: {
        address: '123 Home St',
        lat: 28.6139,
        lng: 77.2090,
      },
      scheduledDate: new Date('2025-12-01').toISOString(),
      scheduledTime: {
        start: '10:00',
        end: '12:00',
      },
      quotedPrice: 1500,
      specialInstructions: 'Please call before arriving',
    });
  };
}
```

### List Customer Bookings

```typescript
function MyBookings() {
  const { data, isLoading } = trpc.booking.listForCustomer.useQuery({
    status: 'PENDING',
    page: 1,
    limit: 20,
  });

  return (
    <div>
      {data?.bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
```

### Reschedule Booking

```typescript
function RescheduleBooking({ bookingId }: { bookingId: string }) {
  const utils = trpc.useContext();
  const reschedule = trpc.booking.reschedule.useMutation({
    onSuccess: () => {
      utils.booking.getById.invalidate({ bookingId });
    },
  });

  const handleReschedule = async () => {
    await reschedule.mutateAsync({
      bookingId,
      scheduledDate: new Date('2025-12-05').toISOString(),
      scheduledTime: {
        start: '14:00',
        end: '16:00',
      },
      reason: 'Need to change due to schedule conflict',
    });
  };
}
```

### Cancel Booking

```typescript
function CancelBooking({ bookingId }: { bookingId: string }) {
  const cancel = trpc.booking.cancel.useMutation();

  const handleCancel = async () => {
    await cancel.mutateAsync({
      bookingId,
      reason: 'Found alternative solution',
    });
  };
}
```

---

## Services & Categories

### List Categories

```typescript
function CategoriesPage() {
  const { data: categories } = trpc.services.listCategories.useQuery();

  return (
    <Grid>
      {categories?.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          providerCount={category._count.providers}
        />
      ))}
    </Grid>
  );
}
```

### Get Category Details

```typescript
function CategoryPage({ slug }: { slug: string }) {
  const { data: category } = trpc.services.getCategory.useQuery({ slug });

  return (
    <div>
      <h1>{category?.name}</h1>
      <SubCategoriesList subcategories={category?.subCategories} />
    </div>
  );
}
```

### Search Services

```typescript
function ServiceSearch() {
  const [query, setQuery] = useState('');
  const { data } = trpc.services.searchServices.useQuery(
    { query, limit: 20 },
    { enabled: query.length >= 2 }
  );

  return (
    <Autocomplete
      value={query}
      onChange={setQuery}
      suggestions={data?.categories || []}
    />
  );
}
```

---

## Reviews & Ratings

### Add Review

```typescript
function AddReview({ bookingId }: { bookingId: string }) {
  const utils = trpc.useContext();
  const addReview = trpc.reviews.addReview.useMutation({
    onSuccess: () => {
      utils.reviews.getReviewsForProvider.invalidate();
    },
  });

  const handleSubmit = async () => {
    await addReview.mutateAsync({
      bookingId,
      overallRating: 5,
      qualityRating: 5,
      punctualityRating: 4,
      professionalismRating: 5,
      valueRating: 4,
      comment: 'Excellent service! Very professional and on time.',
      photos: ['https://cdn.example.com/review1.jpg'],
    });
  };
}
```

### Get Reviews for Provider

```typescript
function ProviderReviews({ providerId }: { providerId: string }) {
  const { data } = trpc.reviews.getReviewsForProvider.useQuery({
    providerId,
    page: 1,
    limit: 10,
  });

  return (
    <div>
      {data?.reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
```

### Get Ratings Summary

```typescript
function RatingsSummary({ providerId }: { providerId: string }) {
  const { data: summary } = trpc.reviews.getRatingsSummary.useQuery({
    providerId,
  });

  return (
    <div>
      <h2>{summary?.averageRating.toFixed(1)} / 5.0</h2>
      <p>{summary?.totalReviews} reviews</p>

      <RatingBreakdown distribution={summary?.ratingDistribution} />

      <CategoryRatings averages={summary?.categoryAverages} />
    </div>
  );
}
```

---

## Payments

### Create Payment Intent

```typescript
function CheckoutPayment({ bookingId }: { bookingId: string }) {
  const createIntent = trpc.payments.createPaymentIntent.useMutation();
  const confirmPayment = trpc.payments.confirmPayment.useMutation();

  const handlePayment = async () => {
    // Step 1: Create payment intent
    const intent = await createIntent.mutateAsync({
      bookingId,
      amount: 1500,
      currency: 'INR',
    });

    // Step 2: Confirm payment (integrate with Stripe/Razorpay)
    const result = await confirmPayment.mutateAsync({
      paymentIntentId: intent.clientSecret,
      paymentMethodId: 'pm_...',
    });

    console.log('Payment successful:', result.transactionId);
  };
}
```

### Get Transaction History

```typescript
function TransactionHistory() {
  const { data } = trpc.payments.getTransactionHistory.useQuery({
    page: 1,
    limit: 20,
  });

  return (
    <TransactionList>
      {data?.payments.map((payment) => (
        <TransactionItem key={payment.id} payment={payment} />
      ))}
    </TransactionList>
  );
}
```

### Provider Earnings

```typescript
function EarningsDashboard() {
  const { data: earnings } = trpc.payments.getEarningsSummary.useQuery();

  return (
    <div>
      <h2>Total Earnings: ₹{earnings?.totalEarnings}</h2>
      <p>This month: ₹{earnings?.monthlyEarnings}</p>
      <p>Platform fees: ₹{earnings?.totalPlatformFees}</p>
    </div>
  );
}
```

---

## Notifications

### Get Notifications

```typescript
function NotificationsList() {
  const { data } = trpc.notifications.getNotifications.useQuery({
    page: 1,
    limit: 20,
    unreadOnly: false,
  });

  return (
    <div>
      <Badge count={data?.unreadCount} />
      {data?.notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
```

### Mark Notifications as Read

```typescript
function NotificationItem({ id }: { id: string }) {
  const utils = trpc.useContext();
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
    },
  });

  const handleRead = async () => {
    await markAsRead.mutateAsync({
      notificationIds: [id],
    });
  };
}
```

---

## AI Features

### AI Assistant

```typescript
function AIChat() {
  const [messages, setMessages] = useState([]);
  const askAssistant = trpc.ai.askAssistant.useMutation();

  const handleAsk = async (query: string) => {
    const response = await askAssistant.mutateAsync({
      query,
      context: { userId: currentUserId },
    });

    setMessages([...messages, { role: 'assistant', content: response.response }]);
  };
}
```

### Provider Insights

```typescript
function ProviderInsights() {
  const { data: insights } = trpc.ai.providerInsights.useQuery({
    period: 'MONTH',
  });

  return (
    <div>
      <p>{insights?.summary}</p>

      <Recommendations items={insights?.recommendations} />

      <TrendsChart trends={insights?.trends} />
    </div>
  );
}
```

### Smart Matching

```typescript
function SmartProviderMatch() {
  const smartMatch = trpc.ai.smartMatching.useMutation();

  const findBestMatch = async () => {
    const results = await smartMatch.mutateAsync({
      serviceType: 'Plumbing',
      location: { lat: 28.6139, lng: 77.2090 },
      requirements: 'Need urgent pipe repair',
      budget: 2000,
    });

    return results.matches; // AI-ranked providers
  };
}
```

---

## Chat & Messaging

### Create Chat Session

```typescript
function StartChat({ providerId }: { providerId: string }) {
  const createSession = trpc.chat.createChatSession.useMutation();

  const handleStartChat = async () => {
    const session = await createSession.mutateAsync({
      recipientId: providerId,
    });

    router.push(`/chat/${session.id}`);
  };
}
```

### Send Message

```typescript
function ChatRoom({ chatRoomId }: { chatRoomId: string }) {
  const utils = trpc.useContext();
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ chatRoomId });
    },
  });

  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({
      chatRoomId,
      recipientId: 'user_id',
      type: 'TEXT',
      content,
    });
  };
}
```

### Get Messages

```typescript
function MessagesList({ chatRoomId }: { chatRoomId: string }) {
  const { data } = trpc.chat.getMessages.useQuery({
    chatRoomId,
    limit: 50,
  });

  return (
    <div>
      {data?.messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}
```

---

## Admin Operations

### Get All Users

```typescript
function AdminUsers() {
  const { data } = trpc.admin.getAllUsers.useQuery({
    role: 'CUSTOMER',
    page: 1,
    limit: 50,
  });

  return <UserTable users={data?.users} />;
}
```

### Approve Provider

```typescript
function ProviderApproval({ providerId }: { providerId: string }) {
  const approve = trpc.admin.approveProvider.useMutation();

  const handleApprove = async () => {
    await approve.mutateAsync({
      providerId,
      approved: true,
    });
  };

  const handleReject = async () => {
    await approve.mutateAsync({
      providerId,
      approved: false,
      rejectionReason: 'Incomplete documentation',
    });
  };
}
```

### Admin Dashboard

```typescript
function AdminDashboard() {
  const { data: stats } = trpc.admin.getDashboardStats.useQuery();

  return (
    <Dashboard>
      <Stat title="Total Users" value={stats?.stats.totalUsers} />
      <Stat title="Pending Providers" value={stats?.stats.pendingProviders} />

      <RecentUsers users={stats?.recentUsers} />
      <PendingProviders providers={stats?.recentProviders} />
    </Dashboard>
  );
}
```

---

## Advanced Patterns

### Prefetching

```typescript
function ProvidersList() {
  const utils = trpc.useContext();

  const handleMouseEnter = (providerId: string) => {
    // Prefetch provider details on hover
    utils.provider.getById.prefetch({ providerId });
  };

  return (
    <div>
      {providers.map((provider) => (
        <div
          key={provider.id}
          onMouseEnter={() => handleMouseEnter(provider.id)}
        >
          {provider.name}
        </div>
      ))}
    </div>
  );
}
```

### Polling

```typescript
function LiveBookingStatus({ bookingId }: { bookingId: string }) {
  const { data } = trpc.booking.getById.useQuery(
    { bookingId },
    {
      refetchInterval: 5000, // Poll every 5 seconds
      refetchIntervalInBackground: true,
    }
  );

  return <BookingStatus status={data?.status} />;
}
```

That's everything! You now have complete examples for all AvailX tRPC endpoints! 🚀
