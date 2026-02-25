import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings } from '../types';

interface PropertyMedia {
  id: number;
  property_id: number;
  user_id: number;
  media_type: 'image' | 'video';
  media_url: string;
  media_base64?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  category: string;
  file_size?: number;
  created_at: string;
}

interface MaintenanceMedia {
  id: number;
  maintenance_id?: number;
  property_id: number;
  user_id: number;
  category: string;
  media_type: 'image' | 'video';
  media_url: string;
  media_base64?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  file_size?: number;
  created_at: string;
}

const media = new Hono<{ Bindings: Bindings }>();

// Proteger todas las rutas
media.use('*', authMiddleware);

// Subir medio a la vivienda (general)
media.post('/property', async (c) => {
  const user = c.get('user');
  
  try {
    const { media_base64, media_type, title, description, category } = await c.req.json();
    
    if (!media_base64) {
      return c.json({ success: false, error: 'Se requiere el archivo en base64' }, 400);
    }
    
    if (!media_type || !['image', 'video'].includes(media_type)) {
      return c.json({ success: false, error: 'Tipo de medio inválido (image/video)' }, 400);
    }
    
    // Obtener propiedad del usuario
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: false, error: 'Primero debes crear tu vivienda' }, 400);
    }
    
    // Generar URL única (en producción usaríamos R2 o similar)
    const mediaUrl = `data:${media_type === 'image' ? 'image/jpeg' : 'video/mp4'};base64,${media_base64.substring(0, 100)}...`;
    const fileSize = Math.round(media_base64.length * 0.75); // Aproximación del tamaño
    
    // Guardar en BD
    const result = await c.env.DB.prepare(
      `INSERT INTO property_media (property_id, user_id, media_type, media_url, media_base64, title, description, category, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      property.id,
      user.sub,
      media_type,
      mediaUrl,
      media_base64,
      title || null,
      description || null,
      category || 'general',
      fileSize
    ).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        message: 'Archivo subido correctamente'
      }
    });
    
  } catch (error) {
    console.error('Error uploading property media:', error);
    return c.json({ success: false, error: 'Error al subir el archivo' }, 500);
  }
});

// Obtener medios de la vivienda
media.get('/property', async (c) => {
  const user = c.get('user');
  
  try {
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: true, data: [] });
    }
    
    const results = await c.env.DB.prepare(
      `SELECT id, media_type, title, description, category, file_size, created_at 
       FROM property_media WHERE property_id = ? ORDER BY created_at DESC`
    ).bind(property.id).all<PropertyMedia>();
    
    return c.json({
      success: true,
      data: results.results
    });
    
  } catch (error) {
    console.error('Error getting property media:', error);
    return c.json({ success: false, error: 'Error al obtener archivos' }, 500);
  }
});

// Obtener un medio específico (con base64)
media.get('/property/:id', async (c) => {
  const user = c.get('user');
  const mediaId = c.req.param('id');
  
  try {
    const mediaItem = await c.env.DB.prepare(
      `SELECT pm.* FROM property_media pm
       JOIN properties p ON pm.property_id = p.id
       WHERE pm.id = ? AND p.user_id = ?`
    ).bind(mediaId, user.sub).first<PropertyMedia>();
    
    if (!mediaItem) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    return c.json({
      success: true,
      data: mediaItem
    });
    
  } catch (error) {
    console.error('Error getting media item:', error);
    return c.json({ success: false, error: 'Error al obtener archivo' }, 500);
  }
});

// Eliminar medio de propiedad
media.delete('/property/:id', async (c) => {
  const user = c.get('user');
  const mediaId = c.req.param('id');
  
  try {
    // Verificar que pertenece al usuario
    const mediaItem = await c.env.DB.prepare(
      `SELECT pm.id FROM property_media pm
       JOIN properties p ON pm.property_id = p.id
       WHERE pm.id = ? AND p.user_id = ?`
    ).bind(mediaId, user.sub).first();
    
    if (!mediaItem) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    await c.env.DB.prepare('DELETE FROM property_media WHERE id = ?').bind(mediaId).run();
    
    return c.json({ success: true, message: 'Archivo eliminado' });
    
  } catch (error) {
    console.error('Error deleting media:', error);
    return c.json({ success: false, error: 'Error al eliminar archivo' }, 500);
  }
});

// Subir medio de mantenimiento
media.post('/maintenance', async (c) => {
  const user = c.get('user');
  
  try {
    const { media_base64, media_type, category, title, description, maintenance_id } = await c.req.json();
    
    if (!media_base64) {
      return c.json({ success: false, error: 'Se requiere el archivo en base64' }, 400);
    }
    
    if (!media_type || !['image', 'video'].includes(media_type)) {
      return c.json({ success: false, error: 'Tipo de medio inválido (image/video)' }, 400);
    }
    
    if (!category) {
      return c.json({ success: false, error: 'Se requiere la categoría de mantenimiento' }, 400);
    }
    
    // Obtener propiedad del usuario
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: false, error: 'Primero debes crear tu vivienda' }, 400);
    }
    
    const mediaUrl = `data:${media_type === 'image' ? 'image/jpeg' : 'video/mp4'};base64,${media_base64.substring(0, 100)}...`;
    const fileSize = Math.round(media_base64.length * 0.75);
    
    // Guardar en BD
    const result = await c.env.DB.prepare(
      `INSERT INTO maintenance_media (maintenance_id, property_id, user_id, category, media_type, media_url, media_base64, title, description, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      maintenance_id || null,
      property.id,
      user.sub,
      category,
      media_type,
      mediaUrl,
      media_base64,
      title || null,
      description || null,
      fileSize
    ).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        message: 'Archivo subido correctamente'
      }
    });
    
  } catch (error) {
    console.error('Error uploading maintenance media:', error);
    return c.json({ success: false, error: 'Error al subir el archivo' }, 500);
  }
});

// Obtener medios de mantenimiento (por categoría o todos)
media.get('/maintenance', async (c) => {
  const user = c.get('user');
  const category = c.req.query('category');
  
  try {
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: true, data: [] });
    }
    
    let query = `SELECT id, category, media_type, title, description, file_size, created_at 
                 FROM maintenance_media WHERE property_id = ?`;
    const params: any[] = [property.id];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = c.env.DB.prepare(query);
    const results = await stmt.bind(...params).all<MaintenanceMedia>();
    
    return c.json({
      success: true,
      data: results.results
    });
    
  } catch (error) {
    console.error('Error getting maintenance media:', error);
    return c.json({ success: false, error: 'Error al obtener archivos' }, 500);
  }
});

// Obtener un medio de mantenimiento específico (con base64)
media.get('/maintenance/:id', async (c) => {
  const user = c.get('user');
  const mediaId = c.req.param('id');
  
  try {
    const mediaItem = await c.env.DB.prepare(
      `SELECT mm.* FROM maintenance_media mm
       JOIN properties p ON mm.property_id = p.id
       WHERE mm.id = ? AND p.user_id = ?`
    ).bind(mediaId, user.sub).first<MaintenanceMedia>();
    
    if (!mediaItem) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    return c.json({
      success: true,
      data: mediaItem
    });
    
  } catch (error) {
    console.error('Error getting maintenance media item:', error);
    return c.json({ success: false, error: 'Error al obtener archivo' }, 500);
  }
});

// Eliminar medio de mantenimiento
media.delete('/maintenance/:id', async (c) => {
  const user = c.get('user');
  const mediaId = c.req.param('id');
  
  try {
    const mediaItem = await c.env.DB.prepare(
      `SELECT mm.id FROM maintenance_media mm
       JOIN properties p ON mm.property_id = p.id
       WHERE mm.id = ? AND p.user_id = ?`
    ).bind(mediaId, user.sub).first();
    
    if (!mediaItem) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    await c.env.DB.prepare('DELETE FROM maintenance_media WHERE id = ?').bind(mediaId).run();
    
    return c.json({ success: true, message: 'Archivo eliminado' });
    
  } catch (error) {
    console.error('Error deleting maintenance media:', error);
    return c.json({ success: false, error: 'Error al eliminar archivo' }, 500);
  }
});

// Endpoint para Chari - obtener todos los medios del usuario
media.get('/all', async (c) => {
  const user = c.get('user');
  
  try {
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: true, data: { property: [], maintenance: [] } });
    }
    
    // Obtener medios de propiedad
    const propertyMedia = await c.env.DB.prepare(
      `SELECT id, media_type, title, description, category, created_at 
       FROM property_media WHERE property_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(property.id).all<PropertyMedia>();
    
    // Obtener medios de mantenimiento
    const maintenanceMedia = await c.env.DB.prepare(
      `SELECT id, category, media_type, title, description, created_at 
       FROM maintenance_media WHERE property_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(property.id).all<MaintenanceMedia>();
    
    return c.json({
      success: true,
      data: {
        property: propertyMedia.results,
        maintenance: maintenanceMedia.results,
        total: (propertyMedia.results?.length || 0) + (maintenanceMedia.results?.length || 0)
      }
    });
    
  } catch (error) {
    console.error('Error getting all media:', error);
    return c.json({ success: false, error: 'Error al obtener archivos' }, 500);
  }
});

// Endpoint para Chari - obtener base64 de un medio específico para análisis
media.get('/for-analysis/:type/:id', async (c) => {
  const user = c.get('user');
  const mediaType = c.req.param('type'); // 'property' o 'maintenance'
  const mediaId = c.req.param('id');
  
  try {
    let mediaItem;
    
    if (mediaType === 'property') {
      mediaItem = await c.env.DB.prepare(
        `SELECT pm.media_base64, pm.media_type, pm.title, pm.description, pm.category
         FROM property_media pm
         JOIN properties p ON pm.property_id = p.id
         WHERE pm.id = ? AND p.user_id = ?`
      ).bind(mediaId, user.sub).first();
    } else if (mediaType === 'maintenance') {
      mediaItem = await c.env.DB.prepare(
        `SELECT mm.media_base64, mm.media_type, mm.title, mm.description, mm.category
         FROM maintenance_media mm
         JOIN properties p ON mm.property_id = p.id
         WHERE mm.id = ? AND p.user_id = ?`
      ).bind(mediaId, user.sub).first();
    } else {
      return c.json({ success: false, error: 'Tipo inválido' }, 400);
    }
    
    if (!mediaItem) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    return c.json({
      success: true,
      data: mediaItem
    });
    
  } catch (error) {
    console.error('Error getting media for analysis:', error);
    return c.json({ success: false, error: 'Error al obtener archivo' }, 500);
  }
});

export default media;
