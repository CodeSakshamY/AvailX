export async function signJWT(payload: Record<string, any>, expiresIn: string = '7d'): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseDuration(expiresIn);

  const jwtPayload = {
    ...payload,
    iat: now,
    exp,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(jwtPayload));
  const data = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureB64 = base64UrlEncode(signature);

  return `${data}.${signatureB64}`;
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;

  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    const binary = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join('');
    base64 = btoa(binary);
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const [, value, unit] = match;
  return parseInt(value, 10) * units[unit];
}
