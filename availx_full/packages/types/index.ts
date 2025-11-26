import { z } from 'zod';

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const signUpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional(),
  role: z.enum(['CUSTOMER', 'PROVIDER']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  password: z.string().optional(),
  otp: z.string().length(6).optional(),
});

export const verifyOTPSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  otp: z.string().length(6),
});

export const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  purpose: z.enum(['LOGIN', 'SIGNUP', 'VERIFICATION']),
});

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

export const updateCustomerProfileSchema = z.object({
  dateOfBirth: z.string().datetime().optional(),
  addresses: z.array(z.object({
    label: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    isDefault: z.boolean().default(false),
  })).optional(),
  preferredLanguage: z.enum(['en', 'hi', 'ur']).optional(),
  notificationPreferences: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).optional(),
});

export const createProviderProfileSchema = z.object({
  businessName: z.string().min(2).optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  categoryId: z.string().cuid(),
  subCategoryIds: z.array(z.string().cuid()).min(1),
  serviceAreas: z.array(z.union([
    z.object({
      type: z.literal('radius'),
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().min(1).max(50),
    }),
    z.object({
      type: z.literal('pincodes'),
      pincodes: z.array(z.string().regex(/^\d{6}$/)),
    }),
  ])),
  baseLocation: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  pricing: z.object({
    hourlyRate: z.number().positive().optional(),
    fixedPrice: z.number().positive().optional(),
    custom: z.string().optional(),
  }),
  workingHours: z.record(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']), z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean(),
  })).optional(),
});

export const updateProviderProfileSchema = createProviderProfileSchema.partial();

// ============================================================================
// SEARCH & DISCOVERY SCHEMAS
// ============================================================================

export const searchProvidersSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  subCategoryIds: z.array(z.string().cuid()).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    radiusKm: z.number().default(10),
  }),
  filters: z.object({
    minRating: z.number().min(0).max(5).optional(),
    maxPrice: z.number().positive().optional(),
    isAadhaarVerified: z.boolean().optional(),
    isBackgroundVerified: z.boolean().optional(),
    isAvailableNow: z.boolean().optional(),
  }).optional(),
  sort: z.enum(['relevance', 'rating', 'price_low', 'price_high', 'distance', 'response_time']).default('relevance'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

// ============================================================================
// BOOKING SCHEMAS
// ============================================================================

export const createBookingSchema = z.object({
  providerId: z.string().cuid(),
  serviceType: z.string().min(3),
  serviceLocation: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  specialInstructions: z.string().max(500).optional(),
  quotedPrice: z.number().positive().optional(),
});

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().cuid(),
  status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  cancellationReason: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().cuid(),
  reason: z.string().min(10, 'Please provide a reason for cancellation'),
});

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const recordPaymentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'UPI', 'CARD', 'WALLET']),
  transactionId: z.string().optional(),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const createReviewSchema = z.object({
  bookingId: z.string().cuid(),
  overallRating: z.number().int().min(1).max(5),
  qualityRating: z.number().int().min(1).max(5).optional(),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});

export const respondToReviewSchema = z.object({
  reviewId: z.string().cuid(),
  response: z.string().min(10).max(500),
});

export const flagReviewSchema = z.object({
  reviewId: z.string().cuid(),
  reason: z.enum(['SPAM', 'ABUSIVE', 'FAKE', 'INAPPROPRIATE', 'OTHER']),
  details: z.string().optional(),
});

// ============================================================================
// CHAT SCHEMAS
// ============================================================================

export const sendMessageSchema = z.object({
  chatRoomId: z.string().cuid().optional(),
  recipientId: z.string().cuid(),
  type: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'VOICE', 'LOCATION']),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }).optional(),
});

export const markMessagesReadSchema = z.object({
  chatRoomId: z.string().cuid(),
  messageIds: z.array(z.string().cuid()),
});

// ============================================================================
// VERIFICATION SCHEMAS
// ============================================================================

export const initiateAadhaarVerificationSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Invalid Aadhaar number'),
});

export const verifyAadhaarOTPSchema = z.object({
  requestId: z.string(),
  otp: z.string().length(6),
});

export const requestBackgroundCheckSchema = z.object({
  providerId: z.string().cuid(),
  documents: z.array(z.object({
    type: z.enum(['ID_PROOF', 'ADDRESS_PROOF', 'POLICE_CLEARANCE']),
    url: z.string().url(),
  })),
});

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const approveProviderSchema = z.object({
  providerId: z.string().cuid(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const banUserSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().min(10),
  duration: z.enum(['TEMPORARY', 'PERMANENT']),
  durationDays: z.number().int().positive().optional(),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const sendNotificationSchema = z.object({
  userId: z.string().cuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()).optional(),
});

// ============================================================================
// TYPE EXPORTS (Inferred from Zod schemas)
// ============================================================================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type SendOTPInput = z.infer<typeof sendOTPSchema>;

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
export type CreateProviderProfileInput = z.infer<typeof createProviderProfileSchema>;
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;

export type SearchProvidersInput = z.infer<typeof searchProvidersSchema>;

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type RespondToReviewInput = z.infer<typeof respondToReviewSchema>;
export type FlagReviewInput = z.infer<typeof flagReviewSchema>;

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkMessagesReadInput = z.infer<typeof markMessagesReadSchema>;

export type InitiateAadhaarVerificationInput = z.infer<typeof initiateAadhaarVerificationSchema>;
export type VerifyAadhaarOTPInput = z.infer<typeof verifyAadhaarOTPSchema>;
export type RequestBackgroundCheckInput = z.infer<typeof requestBackgroundCheckSchema>;

export type ApproveProviderInput = z.infer<typeof approveProviderSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

// ============================================================================
// ADDITIONAL AUTH SCHEMAS
// ============================================================================

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  profilePhoto: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// ============================================================================
// PROVIDER EXTENDED SCHEMAS
// ============================================================================

export const uploadDocumentSchema = z.object({
  type: z.enum(['AADHAAR', 'PAN', 'CERTIFICATION', 'ID_PROOF', 'ADDRESS_PROOF', 'POLICE_CLEARANCE']),
  url: z.string().url(),
  title: z.string().optional(),
  issuer: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
});

export const setWorkRadiusSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radiusKm: z.number().min(1).max(50),
});

export const setAvailabilitySchema = z.object({
  date: z.string().datetime(),
  slots: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean(),
  })),
});

export const addServiceSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  pricing: z.object({
    amount: z.number().positive(),
    unit: z.enum(['HOURLY', 'FIXED', 'PER_UNIT']),
  }),
  duration: z.number().positive().optional(), // in minutes
});

export const updateServiceSchema = z.object({
  serviceId: z.string().cuid(),
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  pricing: z.object({
    amount: z.number().positive(),
    unit: z.enum(['HOURLY', 'FIXED', 'PER_UNIT']),
  }).optional(),
  duration: z.number().positive().optional(),
});

export const removeServiceSchema = z.object({
  serviceId: z.string().cuid(),
});

// ============================================================================
// CATEGORY & SERVICE SCHEMAS
// ============================================================================

export const getCategorySchema = z.object({
  categoryId: z.string().cuid(),
});

export const getSubCategoriesSchema = z.object({
  categoryId: z.string().cuid(),
});

export const getServicesByProviderSchema = z.object({
  providerId: z.string().cuid(),
});

// ============================================================================
// BOOKING EXTENDED SCHEMAS
// ============================================================================

export const rescheduleBookingSchema = z.object({
  bookingId: z.string().cuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  reason: z.string().min(10).optional(),
});

// ============================================================================
// REVIEW EXTENDED SCHEMAS
// ============================================================================

export const updateReviewSchema = z.object({
  reviewId: z.string().cuid(),
  overallRating: z.number().int().min(1).max(5).optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});

export const deleteReviewSchema = z.object({
  reviewId: z.string().cuid(),
});

export const getReviewsForProviderSchema = z.object({
  providerId: z.string().cuid(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export const getRatingsSummarySchema = z.object({
  providerId: z.string().cuid(),
});

// ============================================================================
// PAYMENT EXTENDED SCHEMAS
// ============================================================================

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string(),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  amount: z.number().positive().optional(),
  reason: z.string(),
});

export const getTransactionHistorySchema = z.object({
  userId: z.string().cuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

// ============================================================================
// NOTIFICATION EXTENDED SCHEMAS
// ============================================================================

export const sendBookingConfirmationSchema = z.object({
  bookingId: z.string().cuid(),
});

export const sendProviderAlertSchema = z.object({
  providerId: z.string().cuid(),
  type: z.enum(['NEW_BOOKING', 'CANCELLATION', 'REVIEW', 'MESSAGE']),
  data: z.record(z.any()),
});

export const sendPaymentSuccessSchema = z.object({
  paymentId: z.string().cuid(),
});

export const sendReviewReminderSchema = z.object({
  bookingId: z.string().cuid(),
});

export const updateNotificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  bookingUpdates: z.boolean().optional(),
  messages: z.boolean().optional(),
  promotions: z.boolean().optional(),
});

// ============================================================================
// AI ROUTER SCHEMAS
// ============================================================================

export const askAssistantSchema = z.object({
  query: z.string().min(5),
  context: z.record(z.any()).optional(),
  conversationId: z.string().optional(),
});

export const getProviderInsightsSchema = z.object({
  providerId: z.string().cuid(),
  period: z.enum(['WEEK', 'MONTH', 'QUARTER', 'YEAR']).default('MONTH'),
});

export const getAutoReplySuggestionsSchema = z.object({
  messageContent: z.string(),
  chatRoomId: z.string().cuid(),
});

export const getSmartMatchingSchema = z.object({
  serviceType: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  requirements: z.string().optional(),
  budget: z.number().positive().optional(),
});

// ============================================================================
// CHAT EXTENDED SCHEMAS
// ============================================================================

export const createChatSessionSchema = z.object({
  recipientId: z.string().cuid(),
  bookingId: z.string().cuid().optional(),
});

export const getChatMessagesSchema = z.object({
  chatRoomId: z.string().cuid(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().cuid().optional(),
});

export const markReadSchema = z.object({
  chatRoomId: z.string().cuid(),
  lastReadMessageId: z.string().cuid(),
});

// ============================================================================
// ADMIN EXTENDED SCHEMAS
// ============================================================================

export const getAllUsersSchema = z.object({
  role: z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

export const getAllProvidersSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  categoryId: z.string().cuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

export const verifyProviderDocumentsSchema = z.object({
  providerId: z.string().cuid(),
  documentType: z.enum(['AADHAAR', 'BACKGROUND_CHECK', 'CERTIFICATION']),
  verified: z.boolean(),
  notes: z.string().optional(),
});

export const blockUserSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().min(10),
  permanent: z.boolean().default(false),
});

export const blockProviderSchema = z.object({
  providerId: z.string().cuid(),
  reason: z.string().min(10),
  permanent: z.boolean().default(false),
});

export const listReportsSchema = z.object({
  type: z.enum(['USER', 'PROVIDER', 'REVIEW', 'BOOKING']).optional(),
  status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

export const resolveReportSchema = z.object({
  reportId: z.string().cuid(),
  resolution: z.enum(['RESOLVED', 'DISMISSED']),
  notes: z.string(),
  actionTaken: z.string().optional(),
});

// ============================================================================
// TYPE EXPORTS (Additional)
// ============================================================================

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type SetWorkRadiusInput = z.infer<typeof setWorkRadiusSchema>;
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
export type AddServiceInput = z.infer<typeof addServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type RemoveServiceInput = z.infer<typeof removeServiceSchema>;

export type GetCategoryInput = z.infer<typeof getCategorySchema>;
export type GetSubCategoriesInput = z.infer<typeof getSubCategoriesSchema>;
export type GetServicesByProviderInput = z.infer<typeof getServicesByProviderSchema>;

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
export type GetReviewsForProviderInput = z.infer<typeof getReviewsForProviderSchema>;
export type GetRatingsSummaryInput = z.infer<typeof getRatingsSummarySchema>;

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type GetTransactionHistoryInput = z.infer<typeof getTransactionHistorySchema>;

export type SendBookingConfirmationInput = z.infer<typeof sendBookingConfirmationSchema>;
export type SendProviderAlertInput = z.infer<typeof sendProviderAlertSchema>;
export type SendPaymentSuccessInput = z.infer<typeof sendPaymentSuccessSchema>;
export type SendReviewReminderInput = z.infer<typeof sendReviewReminderSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

export type AskAssistantInput = z.infer<typeof askAssistantSchema>;
export type GetProviderInsightsInput = z.infer<typeof getProviderInsightsSchema>;
export type GetAutoReplySuggestionsInput = z.infer<typeof getAutoReplySuggestionsSchema>;
export type GetSmartMatchingInput = z.infer<typeof getSmartMatchingSchema>;

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type GetChatMessagesInput = z.infer<typeof getChatMessagesSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;

export type GetAllUsersInput = z.infer<typeof getAllUsersSchema>;
export type GetAllProvidersInput = z.infer<typeof getAllProvidersSchema>;
export type VerifyProviderDocumentsInput = z.infer<typeof verifyProviderDocumentsSchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type BlockProviderInput = z.infer<typeof blockProviderSchema>;
export type ListReportsInput = z.infer<typeof listReportsSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
