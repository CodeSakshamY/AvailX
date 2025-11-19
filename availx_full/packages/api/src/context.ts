import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from '@localpro/database';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await getSessionFromRequest(opts.req);

  return {
    prisma,
    session,
    req: opts.req,
  };
}

async function getSessionFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await verifyJWT(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

async function verifyJWT(token: string): Promise<{ userId: string }> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const data = `${headerB64}.${payloadB64}`;
  const signature = base64UrlDecode(signatureB64);

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(data)
  );

  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(atob(payloadB64));

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('Token expired');
  }

  return { userId: payload.userId };
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export type Context = inferAsyncReturnType<typeof createContext>;
