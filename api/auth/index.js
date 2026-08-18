import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// Hash da senha (em produção, usar bcrypt)
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(`${salt}:${password}`)
    .digest('hex');
  return `${salt}:${hash}`;
}

// Verificar senha
export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = createHash('sha256')
    .update(`${salt}:${password}`)
    .digest('hex');
  return hash === verifyHash;
}

// Gerar JWT simple (sem biblioteca externa)
export function generateToken(payload, secret, expiresIn = 86400) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + expiresIn,
  })).toString('base64url');
  
  const signature = createHash('sha256')
    .update(`${header}.${body}.${secret}`)
    .digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

// Verificar JWT
export function verifyToken(token, secret) {
  try {
    const [header, body, signature] = token.split('.');
    
    const expectedSignature = createHash('sha256')
      .update(`${header}.${body}.${secret}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Middleware de autenticação
export function authMiddleware(secret) {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.slice(7);
    const payload = verifyToken(token, secret);
    
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    c.set('user', payload);
    await next();
  };
}
