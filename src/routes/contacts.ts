import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, ContactRequest } from '../types';

const contacts = new Hono<{ Bindings: Bindings }>();

contacts.use('*', authMiddleware);

// Tipos de solicitud
const REQUEST_TYPES = {
  diagnosis_360: {
    label: 'Diagnóstico 360º',
    description: 'Análisis técnico completo de tu vivienda',
    icon: '🔍'
  },
  professional_study: {
    label: 'Estudio profesional para venta',
    description: 'Informe técnico documentado para respaldar tu precio de venta',
    icon: '📋'
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

// Número de Samuel para WhatsApp
const SAMUEL_PHONE = '34742094169';

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
    
    // Obtener datos completos del usuario
    const userData = await c.env.DB.prepare(
      'SELECT name, email, phone FROM users WHERE id = ?'
    ).bind(user.sub).first<{ name: string; email: string; phone: string }>();
    
    // Obtener datos de la propiedad del usuario
    const propertyData = await c.env.DB.prepare(
      'SELECT name, address, urbanization FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ name: string; address: string; urbanization: string }>();
    
    // Crear la solicitud
    const result = await c.env.DB.prepare(
      `INSERT INTO contact_requests (user_id, request_type, notes, status)
       VALUES (?, ?, ?, 'pending')`
    ).bind(user.sub, request_type, notes || null).run();
    
    // Crear recordatorio automático para Samuel (sin priority)
    try {
      await c.env.DB.prepare(
        `INSERT INTO reminders (user_id, property_id, title, description, due_date, status, reminder_type)
         SELECT ?, p.id, ?, ?, date('now'), 'pending', 'contact_request'
         FROM properties p WHERE p.user_id = ?`
      ).bind(
        user.sub,
        `📞 Solicitud: ${REQUEST_TYPES[request_type as keyof typeof REQUEST_TYPES].label}`,
        `${userData?.name || user.name} solicita contacto. Tel: ${userData?.phone || 'No disponible'}`,
        user.sub
      ).run();
    } catch (reminderError) {
      console.error('Error creating reminder:', reminderError);
      // No fallar si no se puede crear el recordatorio
    }
    
    // Preparar mensaje de WhatsApp para Samuel
    const typeInfo = REQUEST_TYPES[request_type as keyof typeof REQUEST_TYPES];
    const whatsappMessage = `🏠 *NUEVA SOLICITUD DE REVISIÓN*

👤 *Cliente:* ${userData?.name || user.name}
📱 *Teléfono:* ${userData?.phone || 'No disponible'}
📧 *Email:* ${userData?.email || user.email}

🏡 *Vivienda:* ${propertyData?.name || 'Sin registrar'}
📍 *Urbanización:* ${propertyData?.urbanization || 'No especificada'}
📮 *Dirección:* ${propertyData?.address || 'No especificada'}

📋 *Tipo:* ${typeInfo.icon} ${typeInfo.label}
${notes ? `📝 *Notas:* ${notes}` : ''}

⏰ Solicitud recibida: ${new Date().toLocaleString('es-ES')}`;

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        request_type,
        typeInfo,
        // Datos para el frontend - generar URL de WhatsApp
        whatsapp: {
          phone: SAMUEL_PHONE,
          message: whatsappMessage
        },
        user: {
          name: userData?.name || user.name,
          phone: userData?.phone
        }
      },
      message: 'Solicitud enviada. Se abrirá WhatsApp para confirmar.'
    });
  } catch (error) {
    console.error('Create contact request error:', error);
    return c.json({ success: false, error: 'Error creando solicitud' }, 500);
  }
});

// Obtener contador de solicitudes pendientes (para badge)
contacts.get('/pending-count', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM contact_requests WHERE status = 'pending'"
    ).first<{ count: number }>();
    
    return c.json({
      success: true,
      count: result?.count || 0
    });
  } catch (error) {
    return c.json({ success: false, count: 0 });
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
