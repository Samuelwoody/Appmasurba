import { Context, Next } from 'hono';
import { verifyJWT, JWTPayload } from '../lib/auth';
import type { Bindings } from '../types';

// Extender Context para incluir usuario autenticado
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

// Middleware de autenticación
export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Token no proporcionado' }, 401);
  }
  
  const token = authHeader.substring(7);
  const secret = c.env.JWT_SECRET || 'mas_urba_secret_key_2024';
  
  const payload = await verifyJWT(token, secret);
  
  if (!payload) {
    return c.json({ success: false, error: 'Token inválido o expirado' }, 401);
  }
  
  c.set('user', payload);
  await next();
}

// Middleware solo admin
export async function adminMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user');
  
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: 'Acceso no autorizado' }, 403);
  }
  
  await next();
}

// Middleware opcional de auth (no falla si no hay token)
export async function optionalAuthMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET || 'mas_urba_secret_key_2024';
    const payload = await verifyJWT(token, secret);
    
    if (payload) {
      c.set('user', payload);
    }
  }
  
  await next();
}
