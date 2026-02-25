import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Bindings, Service, Reminder, PropertyManagement, UserPublic, Property } from '../types';

const admin = new Hono<{ Bindings: Bindings }>();

admin.use('*', authMiddleware);
admin.use('*', adminMiddleware);

// =============================================
// DASHBOARD ADMIN - Resumen general
// =============================================
admin.get('/dashboard', async (c) => {
  try {
    // Total vecinos
    const totalNeighbors = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'client' AND is_active = 1"
    ).first<{ count: number }>();

    // Servicios pendientes
    const pendingServices = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM services WHERE status IN ('pending', 'scheduled', 'in_progress')"
    ).first<{ count: number }>();

    // Recordatorios próximos (7 días)
    const upcomingReminders = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM reminders WHERE status = 'pending' AND due_date <= date('now', '+7 days')"
    ).first<{ count: number }>();

    // Gestiones activas (arrendamientos/ventas)
    const activeManagements = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM property_management WHERE status = 'active'"
    ).first<{ count: number }>();

    // Servicios urgentes
    const urgentServices = await c.env.DB.prepare(
      `SELECT s.*, u.name as user_name, p.name as property_name, p.address
       FROM services s
       JOIN users u ON s.user_id = u.id
       JOIN properties p ON s.property_id = p.id
       WHERE s.priority = 'urgent' AND s.status != 'completed'
       ORDER BY s.created_at DESC
       LIMIT 5`
    ).all();

    // Recordatorios de hoy
    const todayReminders = await c.env.DB.prepare(
      `SELECT r.*, u.name as user_name, p.name as property_name
       FROM reminders r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN properties p ON r.property_id = p.id
       WHERE r.status = 'pending' AND date(r.due_date) <= date('now')
       ORDER BY r.due_date ASC
       LIMIT 10`
    ).all();

    // Últimos vecinos registrados
    const recentNeighbors = await c.env.DB.prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, p.name as property_name, p.address
       FROM users u
       LEFT JOIN properties p ON p.user_id = u.id
       WHERE u.role = 'client'
       ORDER BY u.created_at DESC
       LIMIT 5`
    ).all();

    return c.json({
      success: true,
      data: {
        stats: {
          totalNeighbors: totalNeighbors?.count || 0,
          pendingServices: pendingServices?.count || 0,
          upcomingReminders: upcomingReminders?.count || 0,
          activeManagements: activeManagements?.count || 0
        },
        urgentServices: urgentServices.results || [],
        todayReminders: todayReminders.results || [],
        recentNeighbors: recentNeighbors.results || []
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return c.json({ success: false, error: 'Error cargando dashboard' }, 500);
  }
});

// =============================================
// VECINOS - Listado y búsqueda
// =============================================
admin.get('/neighbors', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const filter = c.req.query('filter') || 'all'; // all, with_services, with_management
    
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.created_at, u.last_login,
             p.id as property_id, p.name as property_name, p.address, p.urbanization,
             p.technical_score, p.year_built, p.square_meters,
             (SELECT COUNT(*) FROM services WHERE user_id = u.id AND status != 'completed') as pending_services,
             (SELECT COUNT(*) FROM property_management WHERE property_id = p.id AND status = 'active') as active_managements
      FROM users u
      LEFT JOIN properties p ON p.user_id = u.id
      WHERE u.role = 'client' AND u.is_active = 1
    `;
    
    const params: string[] = [];
    
    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR p.address LIKE ? OR p.urbanization LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    query += ` ORDER BY u.name ASC`;
    
    const stmt = params.length > 0 
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);
    
    const result = await stmt.all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Get neighbors error:', error);
    return c.json({ success: false, error: 'Error obteniendo vecinos' }, 500);
  }
});

// =============================================
// VECINO DETALLE - Vista completa
// =============================================
admin.get('/neighbors/:id', async (c) => {
  const neighborId = parseInt(c.req.param('id'));
  
  try {
    // Datos del usuario
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, phone, created_at, last_login FROM users WHERE id = ?'
    ).bind(neighborId).first<UserPublic>();
    
    if (!user) {
      return c.json({ success: false, error: 'Vecino no encontrado' }, 404);
    }
    
    // Propiedad
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE user_id = ?'
    ).bind(neighborId).first<Property>();
    
    // Instalaciones
    const installations = await c.env.DB.prepare(
      'SELECT * FROM installations WHERE property_id = ?'
    ).bind(property?.id || 0).all();
    
    // Mantenimientos
    const maintenances = await c.env.DB.prepare(
      'SELECT * FROM maintenances WHERE property_id = ?'
    ).bind(property?.id || 0).all();
    
    // Servicios
    const services = await c.env.DB.prepare(
      'SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(neighborId).all();
    
    // Gestiones (arrendamiento/venta)
    const managements = await c.env.DB.prepare(
      'SELECT * FROM property_management WHERE property_id = ? ORDER BY created_at DESC'
    ).bind(property?.id || 0).all();
    
    // Recordatorios
    const reminders = await c.env.DB.prepare(
      'SELECT * FROM reminders WHERE user_id = ? OR property_id = ? ORDER BY due_date ASC'
    ).bind(neighborId, property?.id || 0).all();
    
    // Etiquetas
    const tags = await c.env.DB.prepare(
      'SELECT * FROM client_tags WHERE user_id = ?'
    ).bind(neighborId).all();
    
    // Últimas conversaciones con Chari
    const conversations = await c.env.DB.prepare(
      'SELECT id, title, intent_classification, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5'
    ).bind(neighborId).all();
    
    return c.json({
      success: true,
      data: {
        user,
        property,
        installations: installations.results || [],
        maintenances: maintenances.results || [],
        services: services.results || [],
        managements: managements.results || [],
        reminders: reminders.results || [],
        tags: tags.results || [],
        conversations: conversations.results || [],
        technicalScore: property?.technical_score || 0
      }
    });
  } catch (error) {
    console.error('Get neighbor detail error:', error);
    return c.json({ success: false, error: 'Error obteniendo detalle' }, 500);
  }
});

// =============================================
// SERVICIOS - CRUD
// =============================================
admin.get('/services', async (c) => {
  try {
    const status = c.req.query('status') || 'all';
    const type = c.req.query('type') || 'all';
    
    let query = `
      SELECT s.*, u.name as user_name, u.phone as user_phone,
             p.name as property_name, p.address
      FROM services s
      JOIN users u ON s.user_id = u.id
      JOIN properties p ON s.property_id = p.id
      WHERE 1=1
    `;
    
    if (status !== 'all') {
      query += ` AND s.status = '${status}'`;
    }
    if (type !== 'all') {
      query += ` AND s.service_type = '${type}'`;
    }
    
    query += ` ORDER BY 
      CASE s.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'normal' THEN 3 
        ELSE 4 
      END,
      s.scheduled_date ASC`;
    
    const result = await c.env.DB.prepare(query).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Get services error:', error);
    return c.json({ success: false, error: 'Error obteniendo servicios' }, 500);
  }
});

admin.post('/services', async (c) => {
  const adminUser = c.get('user');
  
  try {
    const body = await c.req.json();
    const { user_id, property_id, service_type, category, title, description, 
            priority, scheduled_date, estimated_cost, provider_name, provider_phone, notes } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO services (user_id, property_id, service_type, category, title, description,
                           priority, scheduled_date, estimated_cost, provider_name, provider_phone, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user_id, property_id, service_type, category || null, title, description || null,
      priority || 'normal', scheduled_date || null, estimated_cost || null,
      provider_name || null, provider_phone || null, notes || null, adminUser.sub
    ).run();
    
    return c.json({
      success: true,
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Create service error:', error);
    return c.json({ success: false, error: 'Error creando servicio' }, 500);
  }
});

admin.put('/services/:id', async (c) => {
  const serviceId = parseInt(c.req.param('id'));
  
  try {
    const body = await c.req.json();
    const { status, scheduled_date, completed_date, final_cost, notes } = body;
    
    await c.env.DB.prepare(`
      UPDATE services SET
        status = COALESCE(?, status),
        scheduled_date = COALESCE(?, scheduled_date),
        completed_date = COALESCE(?, completed_date),
        final_cost = COALESCE(?, final_cost),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, scheduled_date, completed_date, final_cost, notes, serviceId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update service error:', error);
    return c.json({ success: false, error: 'Error actualizando servicio' }, 500);
  }
});

// =============================================
// RECORDATORIOS - CRUD
// =============================================
admin.get('/reminders', async (c) => {
  try {
    const status = c.req.query('status') || 'pending';
    
    const result = await c.env.DB.prepare(`
      SELECT r.*, u.name as user_name, p.name as property_name, p.address
      FROM reminders r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN properties p ON r.property_id = p.id
      WHERE r.status = ?
      ORDER BY r.due_date ASC
    `).bind(status).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    return c.json({ success: false, error: 'Error obteniendo recordatorios' }, 500);
  }
});

admin.post('/reminders', async (c) => {
  const adminUser = c.get('user');
  
  try {
    const body = await c.req.json();
    const { user_id, property_id, service_id, title, description, 
            reminder_type, due_date, notify_admin, notify_user } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO reminders (user_id, property_id, service_id, title, description,
                            reminder_type, due_date, notify_admin, notify_user, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user_id || null, property_id || null, service_id || null, title, description || null,
      reminder_type || 'general', due_date, notify_admin ?? 1, notify_user ?? 1, adminUser.sub
    ).run();
    
    return c.json({
      success: true,
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    return c.json({ success: false, error: 'Error creando recordatorio' }, 500);
  }
});

admin.put('/reminders/:id', async (c) => {
  const reminderId = parseInt(c.req.param('id'));
  
  try {
    const body = await c.req.json();
    const { status } = body;
    
    await c.env.DB.prepare(
      'UPDATE reminders SET status = ? WHERE id = ?'
    ).bind(status, reminderId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update reminder error:', error);
    return c.json({ success: false, error: 'Error actualizando recordatorio' }, 500);
  }
});

// =============================================
// GESTIONES (Arrendamiento/Venta)
// =============================================
admin.get('/managements', async (c) => {
  try {
    const type = c.req.query('type') || 'all'; // rental, sale, all
    const status = c.req.query('status') || 'active';
    
    let query = `
      SELECT pm.*, p.name as property_name, p.address, p.square_meters,
             u.name as owner_name, u.phone as owner_phone
      FROM property_management pm
      JOIN properties p ON pm.property_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE pm.status = ?
    `;
    
    if (type !== 'all') {
      query += ` AND pm.management_type = '${type}'`;
    }
    
    query += ` ORDER BY pm.created_at DESC`;
    
    const result = await c.env.DB.prepare(query).bind(status).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Get managements error:', error);
    return c.json({ success: false, error: 'Error obteniendo gestiones' }, 500);
  }
});

admin.post('/managements', async (c) => {
  const adminUser = c.get('user');
  
  try {
    const body = await c.req.json();
    const { property_id, management_type, start_date, end_date, price, commission,
            tenant_name, tenant_phone, tenant_email, notes } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO property_management (property_id, management_type, start_date, end_date,
                                       price, commission, tenant_name, tenant_phone, tenant_email,
                                       notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      property_id, management_type, start_date || null, end_date || null,
      price || null, commission || null, tenant_name || null, tenant_phone || null,
      tenant_email || null, notes || null, adminUser.sub
    ).run();
    
    return c.json({
      success: true,
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Create management error:', error);
    return c.json({ success: false, error: 'Error creando gestión' }, 500);
  }
});

admin.put('/managements/:id', async (c) => {
  const managementId = parseInt(c.req.param('id'));
  
  try {
    const body = await c.req.json();
    const { status, end_date, price, notes } = body;
    
    await c.env.DB.prepare(`
      UPDATE property_management SET
        status = COALESCE(?, status),
        end_date = COALESCE(?, end_date),
        price = COALESCE(?, price),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, end_date, price, notes, managementId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update management error:', error);
    return c.json({ success: false, error: 'Error actualizando gestión' }, 500);
  }
});

// =============================================
// ETIQUETAS DE VECINOS
// =============================================
admin.post('/neighbors/:id/tags', async (c) => {
  const neighborId = parseInt(c.req.param('id'));
  const adminUser = c.get('user');
  
  try {
    const body = await c.req.json();
    const { tag_name, notes } = body;
    
    // Verificar si ya existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM client_tags WHERE user_id = ? AND tag_name = ?'
    ).bind(neighborId, tag_name).first();
    
    if (existing) {
      return c.json({ success: false, error: 'Etiqueta ya existe' }, 400);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO client_tags (user_id, tag_name, assigned_by, notes) VALUES (?, ?, ?, ?)'
    ).bind(neighborId, tag_name, adminUser.sub, notes || null).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Add tag error:', error);
    return c.json({ success: false, error: 'Error añadiendo etiqueta' }, 500);
  }
});

admin.delete('/neighbors/:id/tags/:tagName', async (c) => {
  const neighborId = parseInt(c.req.param('id'));
  const tagName = c.req.param('tagName');
  
  try {
    await c.env.DB.prepare(
      'DELETE FROM client_tags WHERE user_id = ? AND tag_name = ?'
    ).bind(neighborId, tagName).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Remove tag error:', error);
    return c.json({ success: false, error: 'Error eliminando etiqueta' }, 500);
  }
});

export default admin;
