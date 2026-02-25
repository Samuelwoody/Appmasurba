// Utilidades de autenticación para Cloudflare Workers
// Nota: Usamos Web Crypto API (compatible con Cloudflare Workers)

// Función para crear hash de contraseña simple (SHA-256)
// En producción se debería usar bcrypt via API externa o Argon2
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mas_urba_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// JWT simplificado usando Web Crypto API
export interface JWTPayload {
  sub: number;
  email: string;
  role: 'client' | 'admin';
  name: string;
  exp: number;
  iat: number;
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function createHmacSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return base64UrlEncode(String.fromCharCode(...signatureArray));
}

async function verifyHmacSignature(message: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createHmacSignature(message, secret);
  return signature === expectedSignature;
}

export async function createJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>, secret: string, expiresIn: number = 86400): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${headerB64}.${payloadB64}`;
  const signature = await createHmacSignature(message, secret);
  
  return `${message}.${signature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signature] = parts;
    const message = `${headerB64}.${payloadB64}`;
    
    const isValid = await verifyHmacSignature(message, signature, secret);
    if (!isValid) return null;
    
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    
    return payload;
  } catch {
    return null;
  }
}

// Generar contraseña aleatoria
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, x => chars[x % chars.length]).join('');
}
