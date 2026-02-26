import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, Maintenance, MaintenancePhoto } from '../types';

const maintenances = new Hono<{ Bindings: Bindings }>();

maintenances.use('*', authMiddleware);

// Categorías de mantenimiento con información
const MAINTENANCE_CATEGORIES = {
  roof: { label: 'Cubierta/Tejado', icon: '🏠', frequency: 'Cada 2-3 años', description: 'Revisión de tejas, canalones e impermeabilización' },
  electricity: { label: 'Electricidad', icon: '⚡', frequency: 'Cada 10 años', description: 'Cuadro eléctrico, cableado y protecciones' },
  plumbing: { label: 'Fontanería', icon: '🚰', frequency: 'Cada 5 años', description: 'Tuberías, llaves de paso y desagües' },
  boiler: { label: 'Caldera', icon: '🔥', frequency: 'Anual (obligatorio)', description: 'Revisión de caldera y conductos de gas' },
  facade: { label: 'Fachada', icon: '🧱', frequency: 'Cada 5-10 años', description: 'Estado de pintura, grietas y humedades' },
  insulation: { label: 'Aislamiento', icon: '🌡️', frequency: 'Según necesidad', description: 'Ventanas, puertas y cerramientos' },
  pool: { label: 'Piscina', icon: '🏊', frequency: 'Anual (pre-temporada)', description: 'Depuradora, liner y sistema de filtrado' },
  garden: { label: 'Jardín', icon: '🌳', frequency: 'Trimestral', description: 'Riego, poda y estado general' },
  other: { label: 'Otros', icon: '🔧', frequency: 'Variable', description: 'Otros elementos de la vivienda' }
};

// Obtener catálogo de mantenimientos
maintenances.get('/categories', async (c) => {
  return c.json({
    success: true,
    data: MAINTENANCE_CATEGORIES
  });
});

// Obtener todos los mantenimientos del usuario
maintenances.get('/', async (c) => {
  const user = c.get('user');
  
  try {
    // Obtener propiedad del usuario
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: true, data: [] });
    }
    
    const result = await c.env.DB.prepare(
      'SELECT * FROM maintenances WHERE property_id = ? ORDER BY category'
    ).bind(property.id).all<Maintenance>();
    
    // Enriquecer con información de categoría
    const enrichedMaintenances = (result.results || []).map(m => ({
      ...m,
      categoryInfo: MAINTENANCE_CATEGORIES[m.category as keyof typeof MAINTENANCE_CATEGORIES]
    }));
    
    return c.json({
      success: true,
      data: enrichedMaintenances
    });
  } catch (error) {
    console.error('Get maintenances error:', error);
    return c.json({ success: false, error: 'Error obteniendo mantenimientos' }, 500);
  }
});

// Obtener mantenimiento específico con fotos
maintenances.get('/:id', async (c) => {
  const user = c.get('user');
  const maintenanceId = c.req.param('id');
  
  try {
    const maintenance = await c.env.DB.prepare(
      `SELECT m.* FROM maintenances m
       JOIN properties p ON m.property_id = p.id
       WHERE m.id = ? AND p.user_id = ?`
    ).bind(maintenanceId, user.sub).first<Maintenance>();
    
    if (!maintenance) {
      return c.json({ success: false, error: 'Mantenimiento no encontrado' }, 404);
    }
    
    // Obtener fotos
    const photosResult = await c.env.DB.prepare(
      'SELECT * FROM maintenance_photos WHERE maintenance_id = ? ORDER BY created_at DESC'
    ).bind(maintenanceId).all<MaintenancePhoto>();
    
    // Obtener historial
    const historyResult = await c.env.DB.prepare(
      `SELECT h.*, u.name as performed_by_name 
       FROM maintenance_history h
       LEFT JOIN users u ON h.performed_by = u.id
       WHERE h.maintenance_id = ?
       ORDER BY h.performed_at DESC`
    ).bind(maintenanceId).all();
    
    return c.json({
      success: true,
      data: {
        ...maintenance,
        categoryInfo: MAINTENANCE_CATEGORIES[maintenance.category as keyof typeof MAINTENANCE_CATEGORIES],
        photos: photosResult.results || [],
        history: historyResult.results || []
      }
    });
  } catch (error) {
    console.error('Get maintenance error:', error);
    return c.json({ success: false, error: 'Error obteniendo mantenimiento' }, 500);
  }
});

// Crear o actualizar mantenimiento (upsert)
maintenances.post('/', async (c) => {
  const user = c.get('user');
  
  try {
    const body = await c.req.json();
    const { property_id, category, status, last_checked, notes } = body;
    
    if (!category) {
      return c.json({ success: false, error: 'Categoría requerida' }, 400);
    }
    
    // Verificar que la propiedad pertenece al usuario
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE id = ? AND user_id = ?'
    ).bind(property_id, user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: false, error: 'Propiedad no encontrada' }, 404);
    }
    
    // Verificar si ya existe un mantenimiento para esta categoría
    const existing = await c.env.DB.prepare(
      'SELECT id FROM maintenances WHERE property_id = ? AND category = ?'
    ).bind(property_id, category).first<{ id: number }>();
    
    if (existing) {
      // Actualizar existente
      await c.env.DB.prepare(
        `UPDATE maintenances SET 
         status = ?, last_checked = ?, notes = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(status || 'checked', last_checked || null, notes || null, existing.id).run();
      
      return c.json({ success: true, message: 'Mantenimiento actualizado', id: existing.id });
    } else {
      // Crear nuevo
      const result = await c.env.DB.prepare(
        `INSERT INTO maintenances (property_id, category, status, last_checked, notes)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(property_id, category, status || 'checked', last_checked || null, notes || null).run();
      
      return c.json({ 
        success: true, 
        message: 'Mantenimiento creado',
        id: result.meta.last_row_id 
      });
    }
  } catch (error) {
    console.error('Create/update maintenance error:', error);
    return c.json({ success: false, error: 'Error guardando mantenimiento' }, 500);
  }
});

// Actualizar mantenimiento
maintenances.put('/:id', async (c) => {
  const user = c.get('user');
  const maintenanceId = c.req.param('id');
  
  try {
    const body = await c.req.json();
    const { status, notes, next_recommended, last_checked } = body;
    
    // Verificar que pertenece al usuario
    const existing = await c.env.DB.prepare(
      `SELECT m.id, m.status as old_status FROM maintenances m
       JOIN properties p ON m.property_id = p.id
       WHERE m.id = ? AND p.user_id = ?`
    ).bind(maintenanceId, user.sub).first<{ id: number; old_status: string }>();
    
    if (!existing) {
      return c.json({ success: false, error: 'Mantenimiento no encontrado' }, 404);
    }
    
    // Actualizar - usar last_checked del body si se proporciona
    const newStatus = status || existing.old_status;
    const finalLastChecked = last_checked || (
      (newStatus === 'checked' || newStatus === 'repaired') 
        ? new Date().toISOString().split('T')[0]
        : null
    );
    
    await c.env.DB.prepare(
      `UPDATE maintenances SET 
       status = ?, notes = ?, next_recommended = ?,
       last_checked = COALESCE(?, last_checked),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(newStatus, notes || null, next_recommended || null, finalLastChecked, maintenanceId).run();
    
    // Registrar en historial si cambió el estado
    if (status && status !== existing.old_status) {
      await c.env.DB.prepare(
        `INSERT INTO maintenance_history (maintenance_id, action, notes, performed_by)
         VALUES (?, ?, ?, ?)`
      ).bind(
        maintenanceId,
        `Estado cambiado de "${existing.old_status}" a "${status}"`,
        notes || null,
        user.sub
      ).run();
    }
    
    return c.json({ success: true, message: 'Mantenimiento actualizado' });
  } catch (error) {
    console.error('Update maintenance error:', error);
    return c.json({ success: false, error: 'Error actualizando mantenimiento' }, 500);
  }
});

// Marcar como revisado
maintenances.post('/:id/check', async (c) => {
  const user = c.get('user');
  const maintenanceId = c.req.param('id');
  
  try {
    const body = await c.req.json();
    const { notes, next_recommended } = body;
    
    // Verificar que pertenece al usuario
    const existing = await c.env.DB.prepare(
      `SELECT m.id, m.category FROM maintenances m
       JOIN properties p ON m.property_id = p.id
       WHERE m.id = ? AND p.user_id = ?`
    ).bind(maintenanceId, user.sub).first<{ id: number; category: string }>();
    
    if (!existing) {
      return c.json({ success: false, error: 'Mantenimiento no encontrado' }, 404);
    }
    
    // Actualizar
    await c.env.DB.prepare(
      `UPDATE maintenances SET 
       status = 'checked', last_checked = CURRENT_TIMESTAMP,
       next_recommended = ?, notes = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(next_recommended || null, notes || null, maintenanceId).run();
    
    // Registrar en historial
    await c.env.DB.prepare(
      `INSERT INTO maintenance_history (maintenance_id, action, notes, performed_by)
       VALUES (?, 'Marcado como revisado', ?, ?)`
    ).bind(maintenanceId, notes || null, user.sub).run();
    
    return c.json({ success: true, message: 'Marcado como revisado' });
  } catch (error) {
    console.error('Check maintenance error:', error);
    return c.json({ success: false, error: 'Error marcando revisión' }, 500);
  }
});

// Añadir foto a mantenimiento
maintenances.post('/:id/photos', async (c) => {
  const user = c.get('user');
  const maintenanceId = c.req.param('id');
  
  try {
    const body = await c.req.json();
    const { photo_url, description } = body;
    
    if (!photo_url) {
      return c.json({ success: false, error: 'URL de foto requerida' }, 400);
    }
    
    // Verificar que pertenece al usuario
    const existing = await c.env.DB.prepare(
      `SELECT m.id FROM maintenances m
       JOIN properties p ON m.property_id = p.id
       WHERE m.id = ? AND p.user_id = ?`
    ).bind(maintenanceId, user.sub).first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Mantenimiento no encontrado' }, 404);
    }
    
    // Añadir foto
    const result = await c.env.DB.prepare(
      `INSERT INTO maintenance_photos (maintenance_id, photo_url, description)
       VALUES (?, ?, ?)`
    ).bind(maintenanceId, photo_url, description || null).run();
    
    return c.json({
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Foto añadida'
    });
  } catch (error) {
    console.error('Add photo error:', error);
    return c.json({ success: false, error: 'Error añadiendo foto' }, 500);
  }
});

// Eliminar foto
maintenances.delete('/photos/:photoId', async (c) => {
  const user = c.get('user');
  const photoId = c.req.param('photoId');
  
  try {
    // Verificar que la foto pertenece a una propiedad del usuario
    const photo = await c.env.DB.prepare(
      `SELECT mp.id FROM maintenance_photos mp
       JOIN maintenances m ON mp.maintenance_id = m.id
       JOIN properties p ON m.property_id = p.id
       WHERE mp.id = ? AND p.user_id = ?`
    ).bind(photoId, user.sub).first();
    
    if (!photo) {
      return c.json({ success: false, error: 'Foto no encontrada' }, 404);
    }
    
    await c.env.DB.prepare('DELETE FROM maintenance_photos WHERE id = ?').bind(photoId).run();
    
    return c.json({ success: true, message: 'Foto eliminada' });
  } catch (error) {
    console.error('Delete photo error:', error);
    return c.json({ success: false, error: 'Error eliminando foto' }, 500);
  }
});

export default maintenances;
