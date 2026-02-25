import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Bindings, User, Property, ClientTag, ContactRequest, Conversation, ChariMemory } from '../types';
import { hashPassword } from '../lib/auth';

const admin = new Hono<{ Bindings: Bindings }>();

// Aplicar auth y admin a todas las rutas
admin.use('*', authMiddleware);
admin.use('*', adminMiddleware);

// Dashboard de admin
admin.get('/dashboard', async (c) => {
  try {
    // Total de clientes
    const totalClients = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'client'"
    ).first<{ count: number }>();
    
    // Clientes por etiqueta
    const tagCounts = await c.env.DB.prepare(
      `SELECT tag_name, COUNT(*) as count FROM client_tags GROUP BY tag_name`
    ).all<{ tag_name: string; count: number }>();
    
    const clientsByTag: Record<string, number> = {};
    for (const row of tagCounts.results || []) {
      clientsByTag[row.tag_name] = row.count;
    }
    
    // Solicitudes pendientes
    const pendingRequests = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM contact_requests WHERE status = 'pending'"
    ).first<{ count: number }>();
    
    // Conversaciones recientes (última semana)
    const recentConversations = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM conversations 
       WHERE updated_at >= datetime('now', '-7 days')`
    ).first<{ count: number }>();
    
    // Clientes que necesitan atención (sin actividad en 30 días)
    const inactiveClients = await c.env.DB.prepare(
      `SELECT u.id, u.name, u.email, u.last_login
       FROM users u
       WHERE u.role = 'client' 
       AND (u.last_login IS NULL OR u.last_login < datetime('now', '-30 days'))
       LIMIT 10`
    ).all();
    
    // Últimas solicitudes
    const latestRequests = await c.env.DB.prepare(
      `SELECT cr.*, u.name as user_name, u.email as user_email
       FROM contact_requests cr
       JOIN users u ON cr.user_id = u.id
       ORDER BY cr.created_at DESC
       LIMIT 10`
    ).all();
    
    return c.json({
      success: true,
      data: {
        totalClients: totalClients?.count || 0,
        clientsByTag,
        pendingRequests: pendingRequests?.count || 0,
        recentConversations: recentConversations?.count || 0,
        inactiveClients: inactiveClients.results || [],
        latestRequests: latestRequests.results || []
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return c.json({ success: false, error: 'Error obteniendo dashboard' }, 500);
  }
});

// Listar todos los clientes
admin.get('/clients', async (c) => {
  try {
    const clients = await c.env.DB.prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.created_at, u.last_login,
              p.name as property_name, p.urbanization, p.technical_score,
              GROUP_CONCAT(ct.tag_name) as tags
       FROM users u
       LEFT JOIN properties p ON p.user_id = u.id
       LEFT JOIN client_tags ct ON ct.user_id = u.id
       WHERE u.role = 'client'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    ).all();
    
    // Procesar tags
    const processedClients = (clients.results || []).map((client: any) => ({
      ...client,
      tags: client.tags ? client.tags.split(',') : []
    }));
    
    return c.json({
      success: true,
      data: processedClients
    });
  } catch (error) {
    console.error('List clients error:', error);
    return c.json({ success: false, error: 'Error listando clientes' }, 500);
  }
});

// Ver detalle de un cliente
admin.get('/clients/:id', async (c) => {
  const clientId = c.req.param('id');
  
  try {
    // Datos del cliente
    const client = await c.env.DB.prepare(
      `SELECT id, email, name, phone, created_at, last_login
       FROM users WHERE id = ? AND role = 'client'`
    ).bind(clientId).first();
    
    if (!client) {
      return c.json({ success: false, error: 'Cliente no encontrado' }, 404);
    }
    
    // Vivienda
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE user_id = ?'
    ).bind(clientId).first<Property>();
    
    // Instalaciones
    const installations = property ? await c.env.DB.prepare(
      'SELECT * FROM installations WHERE property_id = ?'
    ).bind(property.id).all() : { results: [] };
    
    // Mantenimientos
    const maintenances = property ? await c.env.DB.prepare(
      'SELECT * FROM maintenances WHERE property_id = ?'
    ).bind(property.id).all() : { results: [] };
    
    // Etiquetas
    const tags = await c.env.DB.prepare(
      'SELECT * FROM client_tags WHERE user_id = ?'
    ).bind(clientId).all<ClientTag>();
    
    // Estimaciones
    const estimates = await c.env.DB.prepare(
      'SELECT * FROM estimates WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(clientId).all();
    
    // Solicitudes
    const requests = await c.env.DB.prepare(
      'SELECT * FROM contact_requests WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(clientId).all<ContactRequest>();
    
    // Memoria de Chari
    let memory = await c.env.DB.prepare(
      'SELECT * FROM chari_memory WHERE user_id = ?'
    ).bind(clientId).first<ChariMemory>();
    
    if (memory) {
      if (typeof memory.context === 'string') memory.context = JSON.parse(memory.context);
      if (typeof memory.preferences === 'string') memory.preferences = JSON.parse(memory.preferences);
      if (typeof memory.last_topics === 'string') memory.last_topics = JSON.parse(memory.last_topics);
    }
    
    // Últimas conversaciones
    const conversations = await c.env.DB.prepare(
      `SELECT id, title, intent_classification, samuel_contact_offered, created_at, updated_at
       FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5`
    ).bind(clientId).all();
    
    return c.json({
      success: true,
      data: {
        client,
        property: property ? {
          ...property,
          installations: installations.results || [],
          maintenances: maintenances.results || []
        } : null,
        tags: tags.results || [],
        estimates: estimates.results || [],
        requests: requests.results || [],
        chariMemory: memory,
        conversations: conversations.results || []
      }
    });
  } catch (error) {
    console.error('Get client detail error:', error);
    return c.json({ success: false, error: 'Error obteniendo cliente' }, 500);
  }
});

// Ver conversación de un cliente
admin.get('/clients/:id/conversations/:convId', async (c) => {
  const clientId = c.req.param('id');
  const convId = c.req.param('convId');
  
  try {
    const conversation = await c.env.DB.prepare(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
    ).bind(convId, clientId).first<Conversation>();
    
    if (!conversation) {
      return c.json({ success: false, error: 'Conversación no encontrada' }, 404);
    }
    
    if (typeof conversation.messages === 'string') {
      conversation.messages = JSON.parse(conversation.messages);
    }
    
    return c.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return c.json({ success: false, error: 'Error obteniendo conversación' }, 500);
  }
});

// Añadir etiqueta a cliente
admin.post('/clients/:id/tags', async (c) => {
  const user = c.get('user');
  const clientId = c.req.param('id');
  
  try {
    const { tag_name, notes } = await c.req.json();
    
    const validTags = ['partial_reform', 'integral_reform', 'potential_sale', 'premium_client', 'educable_client', 'urgent', 'vip'];
    if (!tag_name || !validTags.includes(tag_name)) {
      return c.json({ success: false, error: 'Etiqueta no válida' }, 400);
    }
    
    // Verificar que el cliente existe
    const client = await c.env.DB.prepare(
      "SELECT id FROM users WHERE id = ? AND role = 'client'"
    ).bind(clientId).first();
    
    if (!client) {
      return c.json({ success: false, error: 'Cliente no encontrado' }, 404);
    }
    
    // Verificar si ya tiene la etiqueta
    const existing = await c.env.DB.prepare(
      'SELECT id FROM client_tags WHERE user_id = ? AND tag_name = ?'
    ).bind(clientId, tag_name).first();
    
    if (existing) {
      return c.json({ success: false, error: 'El cliente ya tiene esta etiqueta' }, 400);
    }
    
    await c.env.DB.prepare(
      `INSERT INTO client_tags (user_id, tag_name, assigned_by, notes)
       VALUES (?, ?, ?, ?)`
    ).bind(clientId, tag_name, user.sub, notes || null).run();
    
    return c.json({ success: true, message: 'Etiqueta añadida' });
  } catch (error) {
    console.error('Add tag error:', error);
    return c.json({ success: false, error: 'Error añadiendo etiqueta' }, 500);
  }
});

// Eliminar etiqueta de cliente
admin.delete('/clients/:id/tags/:tagName', async (c) => {
  const clientId = c.req.param('id');
  const tagName = c.req.param('tagName');
  
  try {
    await c.env.DB.prepare(
      'DELETE FROM client_tags WHERE user_id = ? AND tag_name = ?'
    ).bind(clientId, tagName).run();
    
    return c.json({ success: true, message: 'Etiqueta eliminada' });
  } catch (error) {
    console.error('Remove tag error:', error);
    return c.json({ success: false, error: 'Error eliminando etiqueta' }, 500);
  }
});

// Actualizar estado de solicitud de contacto
admin.put('/requests/:id', async (c) => {
  const requestId = c.req.param('id');
  
  try {
    const { status, notes, scheduled_at } = await c.req.json();
    
    const validStatuses = ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return c.json({ success: false, error: 'Estado no válido' }, 400);
    }
    
    await c.env.DB.prepare(
      `UPDATE contact_requests SET 
       status = COALESCE(?, status),
       notes = COALESCE(?, notes),
       scheduled_at = COALESCE(?, scheduled_at),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(status || null, notes || null, scheduled_at || null, requestId).run();
    
    return c.json({ success: true, message: 'Solicitud actualizada' });
  } catch (error) {
    console.error('Update request error:', error);
    return c.json({ success: false, error: 'Error actualizando solicitud' }, 500);
  }
});

// Crear nuevo cliente
admin.post('/clients', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    
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
    
    const passwordHash = await hashPassword(password);
    
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES (?, ?, ?, ?, 'client')`
    ).bind(email.toLowerCase(), passwordHash, name, phone || null).run();
    
    const userId = result.meta.last_row_id;
    
    // Crear memoria de Chari
    await c.env.DB.prepare(
      `INSERT INTO chari_memory (user_id, context, preferences, interaction_count, last_topics)
       VALUES (?, '{}', '{}', 0, '[]')`
    ).bind(userId).run();
    
    return c.json({
      success: true,
      data: { id: userId, email: email.toLowerCase(), name },
      message: 'Cliente creado correctamente'
    });
  } catch (error) {
    console.error('Create client error:', error);
    return c.json({ success: false, error: 'Error creando cliente' }, 500);
  }
});

// Etiquetas disponibles
admin.get('/tags', async (c) => {
  return c.json({
    success: true,
    data: [
      { value: 'partial_reform', label: 'Reforma parcial', color: 'blue' },
      { value: 'integral_reform', label: 'Reforma integral', color: 'purple' },
      { value: 'potential_sale', label: 'Venta potencial', color: 'orange' },
      { value: 'premium_client', label: 'Cliente premium', color: 'gold' },
      { value: 'educable_client', label: 'Cliente educable', color: 'green' },
      { value: 'urgent', label: 'Urgente', color: 'red' },
      { value: 'vip', label: 'VIP', color: 'pink' }
    ]
  });
});

export default admin;
