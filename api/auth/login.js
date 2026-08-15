import { Hono } from 'hono';
import { generateToken, verifyPassword } from './index.js';

export const authRouter = new Hono();

// Credenciais (em produção, usar variáveis de ambiente)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'flavio@flaviolucas.dev';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// POST /api/auth/login
authRouter.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }
    
    if (email !== ADMIN_EMAIL) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Se não tem hash configurado, aceitar senha padrão (apenas dev)
    if (ADMIN_PASSWORD_HASH) {
      const valid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
      if (!valid) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
    } else if (password !== 'admin123') {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const token = generateToken({ email }, JWT_SECRET, 86400);
    
    return c.json({
      token,
      expiresIn: 86400,
      email,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// GET /api/auth/verify - Verificar token
authRouter.get('/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ valid: false }, 401);
  }
  
  const token = authHeader.slice(7);
  const { verifyToken } = await import('./index.js');
  const payload = verifyToken(token, JWT_SECRET);
  
  if (!payload) {
    return c.json({ valid: false }, 401);
  }
  
  return c.json({ valid: true, email: payload.email });
});
