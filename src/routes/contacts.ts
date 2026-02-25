import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, ContactRequest } from '../types';

const contacts = new Hono<{ Bindings: Bindings }>();

contacts.use('*', authMiddleware);

// Tipos de solicitud
const REQUEST_TYPES = {
  diagnosis_360: {
    label: 'Diagnóstico 360º',
    description: 'Valoración técnica completa de tu vivienda',
    icon: '🔍'
  },
  consultation: {
    label: 'Consulta con Samuel',
    description: 'Reunión para resolver dudas específicas',
    icon: '💬'
  },
  post_work: {
    label: 'Seguimiento post-obra',
    description: 'Revisión después de una reforma',
    icon: '✅'
  },
  other: {
    label: 'Otra consulta',
    description: 'Otro tipo de solicitud',
    icon: '📋'
  }
};

// Obtener tipos de solicitud
contacts.get('/types', async (c) => {
  return c.json({
    success: true,
    data: REQUEST_TYPES
  });
});

// Crear solicitud de contacto
contacts.post('/', async (c) => {
  const user = c.get('user');
  
  try {
    const body = await c.req.json();
    const { request_type, notes } = body;
    
    if (!request_type || !REQUEST_TYPES[request_type as keyof typeof REQUEST_TYPES]) {
      return c.json({ success: false, error: 'Tipo de solicitud no válido' }, 400);
    }
    
    // Verificar si ya tiene solicitud pendiente del mismo tipo
    const existing = await c.env.DB.prepare(
      `SELECT id FROM contact_requests 
       WHERE user_id = ? AND request_type = ? AND status IN ('pending', 'contacted')
       LIMIT 1`
    ).bind(user.sub, request_type).first();
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Ya tienes una solicitud pendiente de este tipo' 
      }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO contact_requests (user_id, request_type, notes, status)
       VALUES (?, ?, ?, 'pending')`
    ).bind(user.sub, request_type, notes || null).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        request_type,
        typeInfo: REQUEST_TYPES[request_type as keyof typeof REQUEST_TYPES]
      },
      message: 'Solicitud enviada. Samuel se pondrá en contacto contigo pronto.'
    });
  } catch (error) {
    console.error('Create contact request error:', error);
    return c.json({ success: false, error: 'Error creando solicitud' }, 500);
  }
});

// Obtener solicitudes del usuario
contacts.get('/', async (c) => {
  const user = c.get('user');
  
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM contact_requests WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.sub).all<ContactRequest>();
    
    const requests = (result.results || []).map(r => ({
      ...r,
      typeInfo: REQUEST_TYPES[r.request_type as keyof typeof REQUEST_TYPES]
    }));
    
    return c.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get contact requests error:', error);
    return c.json({ success: false, error: 'Error obteniendo solicitudes' }, 500);
  }
});

// Cancelar solicitud
contacts.delete('/:id', async (c) => {
  const user = c.get('user');
  const requestId = c.req.param('id');
  
  try {
    const existing = await c.env.DB.prepare(
      `SELECT id, status FROM contact_requests 
       WHERE id = ? AND user_id = ?`
    ).bind(requestId, user.sub).first<{ id: number; status: string }>();
    
    if (!existing) {
      return c.json({ success: false, error: 'Solicitud no encontrada' }, 404);
    }
    
    if (existing.status !== 'pending') {
      return c.json({ 
        success: false, 
        error: 'Solo puedes cancelar solicitudes pendientes' 
      }, 400);
    }
    
    await c.env.DB.prepare(
      `UPDATE contact_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(requestId).run();
    
    return c.json({ success: true, message: 'Solicitud cancelada' });
  } catch (error) {
    console.error('Cancel contact request error:', error);
    return c.json({ success: false, error: 'Error cancelando solicitud' }, 500);
  }
});

export default contacts;
