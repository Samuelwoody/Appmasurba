import { Hono } from 'hono';
import { hashPassword, verifyPassword, createJWT } from '../lib/auth';
import type { Bindings, User } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ success: false, error: 'Email y contraseña requeridos' }, 400);
    }
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email.toLowerCase()).first<User>();
    
    if (!user) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401);
    }
    
    const validPassword = await verifyPassword(password, user.password_hash);
    
    if (!validPassword) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401);
    }
    
    // Actualizar último login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // Generar token
    const secret = c.env.JWT_SECRET || 'mas_urba_secret_key_2024';
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }, secret, 86400 * 7); // 7 días
    
    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Error en el servidor' }, 500);
  }
});

// Registro (solo admin puede crear usuarios)
auth.post('/register', async (c) => {
  try {
    const { email, password, name, phone, role = 'client' } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ success: false, error: 'Email, contraseña y nombre requeridos' }, 400);
    }
    
    // Verificar si existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();
    
    if (existing) {
      return c.json({ success: false, error: 'El email ya está registrado' }, 400);
    }
    
    // Crear hash de contraseña
    const passwordHash = await hashPassword(password);
    
    // Insertar usuario
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password_hash, name, phone, role) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(email.toLowerCase(), passwordHash, name, phone || null, role).run();
    
    const userId = result.meta.last_row_id;
    
    // Crear memoria de Chari para el usuario
    await c.env.DB.prepare(
      `INSERT INTO chari_memory (user_id, context, preferences, interaction_count, last_topics)
       VALUES (?, '{}', '{}', 0, '[]')`
    ).bind(userId).run();
    
    return c.json({
      success: true,
      data: {
        id: userId,
        email: email.toLowerCase(),
        name,
        role
      },
      message: 'Usuario creado correctamente'
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ success: false, error: 'Error en el servidor' }, 500);
  }
});

// Verificar token
auth.get('/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, valid: false });
  }
  
  const token = authHeader.substring(7);
  const secret = c.env.JWT_SECRET || 'mas_urba_secret_key_2024';
  
  const { verifyJWT } = await import('../lib/auth');
  const payload = await verifyJWT(token, secret);
  
  if (!payload) {
    return c.json({ success: false, valid: false });
  }
  
  // Obtener datos actualizados del usuario
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, phone, role FROM users WHERE id = ? AND is_active = 1'
  ).bind(payload.sub).first();
  
  return c.json({
    success: true,
    valid: true,
    user
  });
});

// Cambiar contraseña
auth.post('/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No autorizado' }, 401);
    }
    
    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET || 'mas_urba_secret_key_2024';
    const { verifyJWT } = await import('../lib/auth');
    const payload = await verifyJWT(token, secret);
    
    if (!payload) {
      return c.json({ success: false, error: 'Token inválido' }, 401);
    }
    
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ success: false, error: 'Contraseñas requeridas' }, 400);
    }
    
    // Verificar contraseña actual
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(payload.sub).first<{ password_hash: string }>();
    
    if (!user) {
      return c.json({ success: false, error: 'Usuario no encontrado' }, 404);
    }
    
    const validPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!validPassword) {
      return c.json({ success: false, error: 'Contraseña actual incorrecta' }, 400);
    }
    
    // Actualizar contraseña
    const newHash = await hashPassword(newPassword);
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newHash, payload.sub).run();
    
    return c.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ success: false, error: 'Error en el servidor' }, 500);
  }
});

export default auth;
