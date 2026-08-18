import { createHash } from 'crypto';

// Hash IP para não armazenar dados sensíveis
export function hashIP(ip, salt = process.env.IP_HASH_SALT || 'default-salt') {
  return createHash('sha256')
    .update(`${ip}${salt}`)
    .digest('hex')
    .substring(0, 16); // Usar apenas 16 chars para economizar espaço
}

// Sanitizar user agent (remover dados sensíveis)
export function sanitizeUserAgent(ua) {
  if (!ua) return null;

  // Manter apenas informações básicas
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
  const os = ['Windows', 'Mac OS', 'Linux', 'iOS', 'Android'];

  const browser = browsers.find(b => ua.includes(b)) || 'Unknown';
  const osName = os.find(o => ua.includes(o)) || 'Unknown';

  return `${browser} on ${osName}`;
}

// Extrair IP do request
export function getClientIP(c) {
  // Em produção (Vercel), usar X-Forwarded-For
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Fallback para X-Real-IP
  return c.req.header('x-real-ip') || 'unknown';
}

// Rate limiting simples em memória (para desenvolvimento)
const rateLimitMap = new Map();

export function checkRateLimit(ip, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Limpar entradas antigas
  const record = rateLimitMap.get(ip) || [];
  const validRecords = record.filter(time => time > windowStart);

  if (validRecords.length >= maxRequests) {
    return false; // Rate limit excedido
  }

  validRecords.push(now);
  rateLimitMap.set(ip, validRecords);

  return true; // OK
}
