import { prisma } from '@localpro/database';

const OTP_EXPIRY_MINUTES = 10;
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(phone: string, otp: string): Promise<void> {
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  otpStore.set(phone, { otp, expiresAt });

  await prisma.verificationToken.create({
    data: {
      identifier: phone,
      token: otp,
      expires: new Date(expiresAt),
    },
  });
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const stored = otpStore.get(phone);

  if (!stored) {
    const dbToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: phone,
        token: otp,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!dbToken) {
      return false;
    }

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: phone,
          token: otp,
        },
      },
    });

    return true;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return false;
  }

  if (stored.otp !== otp) {
    return false;
  }

  otpStore.delete(phone);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: phone,
    },
  });

  return true;
}

export async function sendOTPviaSMS(phone: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV === 'development' || process.env.MOCK_SMS === 'true') {
    console.log(`[MOCK SMS] Sending OTP ${otp} to ${phone}`);
    return;
  }

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.warn('Twilio credentials not configured, skipping SMS');
    return;
  }

  try {
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: phone,
          Body: `Your LocalPro Connect verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send OTP via SMS');
  }
}
