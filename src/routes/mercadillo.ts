import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings } from '../types';

const mercadillo = new Hono<{ Bindings: Bindings }>();

mercadillo.use('*', authMiddleware);

// ID del usuario Chari bot
const CHARI_USER_ID = 999;

// Categorías disponibles
const CATEGORIES = {
  muebles: { label: 'Muebles', icon: '🪑' },
  electronica: { label: 'Electrónica', icon: '📱' },
  jardin: { label: 'Jardín', icon: '🌳' },
  hogar: { label: 'Hogar', icon: '🏠' },
  motor: { label: 'Motor', icon: '🚗' },
  deportes: { label: 'Deportes', icon: '⚽' },
  otros: { label: 'Otros', icon: '📦' }
};

const CONDITIONS = {
  new: { label: 'Nuevo', color: 'green' },
  like_new: { label: 'Como nuevo', color: 'blue' },
  good: { label: 'Buen estado', color: 'yellow' },
  fair: { label: 'Aceptable', color: 'gray' }
};

// =============================================
// ARTÍCULOS
// =============================================

// Obtener todos los artículos
mercadillo.get('/items', async (c) => {
  const user = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '12');
  const category = c.req.query('category');
  const urbanization = c.req.query('urbanization');
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        i.*,
        u.name as seller_name,
        u.phone as seller_phone,
        p.urbanization as seller_urbanization,
        (SELECT COUNT(*) FROM mercadillo_comments WHERE item_id = i.id AND is_active = 1) as comments_count
      FROM mercadillo_items i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN properties p ON p.user_id = u.id
      WHERE i.status IN ('available', 'reserved')
    `;
    
    const params: any[] = [];
    
    if (category && category !== 'all' && CATEGORIES[category as keyof typeof CATEGORIES]) {
      query += ` AND i.category = ?`;
      params.push(category);
    }

    if (urbanization) {
      query += ` AND (i.urbanization = ? OR p.urbanization = ?)`;
      params.push(urbanization, urbanization);
    }
    
    query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const items = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total
    let countQuery = `SELECT COUNT(*) as total FROM mercadillo_items WHERE status IN ('available', 'reserved')`;
    if (category && category !== 'all') {
      countQuery += ` AND category = '${category}'`;
    }
    const totalResult = await c.env.DB.prepare(countQuery).first<{ total: number }>();

    // Parsear imágenes
    const itemsWithParsed = (items.results || []).map((item: any) => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
      categoryInfo: CATEGORIES[item.category as keyof typeof CATEGORIES] || CATEGORIES.otros,
      conditionInfo: CONDITIONS[item.condition as keyof typeof CONDITIONS] || CONDITIONS.good
    }));

    return c.json({
      success: true,
      data: {
        items: itemsWithParsed,
        pagination: {
          page,
          limit,
          total: totalResult?.total || 0,
          totalPages: Math.ceil((totalResult?.total || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    return c.json({ success: false, error: 'Error obteniendo artículos' }, 500);
  }
});

// Obtener un artículo
mercadillo.get('/items/:id', async (c) => {
  const itemId = parseInt(c.req.param('id'));

  try {
    const item = await c.env.DB.prepare(`
      SELECT 
        i.*,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email,
        p.urbanization as seller_urbanization
      FROM mercadillo_items i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN properties p ON p.user_id = u.id
      WHERE i.id = ? AND i.status != 'deleted'
    `).bind(itemId).first();

    if (!item) {
      return c.json({ success: false, error: 'Artículo no encontrado' }, 404);
    }

    // Incrementar vistas
    await c.env.DB.prepare(
      'UPDATE mercadillo_items SET views_count = views_count + 1 WHERE id = ?'
    ).bind(itemId).run();

    // Obtener comentarios
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_chari
      FROM mercadillo_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.item_id = ? AND c.is_active = 1
      ORDER BY c.created_at ASC
    `).bind(CHARI_USER_ID, itemId).all();

    return c.json({
      success: true,
      data: {
        ...item,
        images: item.images ? JSON.parse(item.images as string) : [],
        categoryInfo: CATEGORIES[(item as any).category as keyof typeof CATEGORIES] || CATEGORIES.otros,
        conditionInfo: CONDITIONS[(item as any).condition as keyof typeof CONDITIONS] || CONDITIONS.good,
        comments: comments.results || []
      }
    });
  } catch (error) {
    console.error('Get item error:', error);
    return c.json({ success: false, error: 'Error obteniendo artículo' }, 500);
  }
});

// Crear artículo
mercadillo.post('/items', async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { 
      title, 
      description, 
      price, 
      price_negotiable = true,
      category = 'otros', 
      condition = 'good',
      images = [] 
    } = body;

    if (!title || title.trim().length === 0) {
      return c.json({ success: false, error: 'El título es obligatorio' }, 400);
    }

    if (title.length > 100) {
      return c.json({ success: false, error: 'El título no puede exceder 100 caracteres' }, 400);
    }

    if (price === undefined || price < 0) {
      return c.json({ success: false, error: 'El precio es obligatorio' }, 400);
    }

    if (images.length > 6) {
      return c.json({ success: false, error: 'Máximo 6 imágenes' }, 400);
    }

    // Obtener urbanización del usuario
    const userProperty = await c.env.DB.prepare(
      'SELECT urbanization FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ urbanization: string }>();

    const result = await c.env.DB.prepare(`
      INSERT INTO mercadillo_items (
        user_id, title, description, price, price_negotiable, 
        category, condition, images, urbanization
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.sub,
      title.trim(),
      description?.trim() || null,
      price,
      price_negotiable ? 1 : 0,
      category,
      condition,
      images.length > 0 ? JSON.stringify(images) : null,
      userProperty?.urbanization || null
    ).run();

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        message: '¡Artículo publicado en el Mercadillo!'
      }
    });
  } catch (error) {
    console.error('Create item error:', error);
    return c.json({ success: false, error: 'Error creando artículo' }, 500);
  }
});

// Actualizar artículo
mercadillo.put('/items/:id', async (c) => {
  const user = c.get('user');
  const itemId = parseInt(c.req.param('id'));

  try {
    const existing = await c.env.DB.prepare(
      'SELECT id, user_id FROM mercadillo_items WHERE id = ? AND status != \'deleted\''
    ).bind(itemId).first<{ id: number; user_id: number }>();

    if (!existing) {
      return c.json({ success: false, error: 'Artículo no encontrado' }, 404);
    }

    if (existing.user_id !== user.sub && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso' }, 403);
    }

    const body = await c.req.json();
    const { title, description, price, price_negotiable, category, condition } = body;

    await c.env.DB.prepare(`
      UPDATE mercadillo_items 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          price_negotiable = COALESCE(?, price_negotiable),
          category = COALESCE(?, category),
          condition = COALESCE(?, condition),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title || null, 
      description || null, 
      price ?? null, 
      price_negotiable !== undefined ? (price_negotiable ? 1 : 0) : null,
      category || null, 
      condition || null, 
      itemId
    ).run();

    return c.json({ success: true, message: 'Artículo actualizado' });
  } catch (error) {
    console.error('Update item error:', error);
    return c.json({ success: false, error: 'Error actualizando artículo' }, 500);
  }
});

// Cambiar estado del artículo
mercadillo.put('/items/:id/status', async (c) => {
  const user = c.get('user');
  const itemId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json();
    const { status } = body;

    if (!['available', 'reserved', 'sold', 'deleted'].includes(status)) {
      return c.json({ success: false, error: 'Estado no válido' }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT id, user_id FROM mercadillo_items WHERE id = ?'
    ).bind(itemId).first<{ id: number; user_id: number }>();

    if (!existing) {
      return c.json({ success: false, error: 'Artículo no encontrado' }, 404);
    }

    if (existing.user_id !== user.sub && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso' }, 403);
    }

    const soldAt = status === 'sold' ? 'CURRENT_TIMESTAMP' : 'NULL';
    const reservedBy = status === 'reserved' ? user.sub : 'NULL';
    const reservedAt = status === 'reserved' ? 'CURRENT_TIMESTAMP' : 'NULL';

    await c.env.DB.prepare(`
      UPDATE mercadillo_items 
      SET status = ?, 
          sold_at = ${soldAt},
          reserved_by = ${reservedBy},
          reserved_at = ${reservedAt},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, itemId).run();

    return c.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    console.error('Update item status error:', error);
    return c.json({ success: false, error: 'Error actualizando estado' }, 500);
  }
});

// Mis artículos
mercadillo.get('/my-items', async (c) => {
  const user = c.get('user');

  try {
    const items = await c.env.DB.prepare(`
      SELECT * FROM mercadillo_items 
      WHERE user_id = ? AND status != 'deleted'
      ORDER BY created_at DESC
    `).bind(user.sub).all();

    const itemsWithParsed = (items.results || []).map((item: any) => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
      categoryInfo: CATEGORIES[item.category as keyof typeof CATEGORIES] || CATEGORIES.otros,
      conditionInfo: CONDITIONS[item.condition as keyof typeof CONDITIONS] || CONDITIONS.good
    }));

    return c.json({ success: true, data: itemsWithParsed });
  } catch (error) {
    console.error('Get my items error:', error);
    return c.json({ success: false, error: 'Error obteniendo artículos' }, 500);
  }
});

// =============================================
// COMENTARIOS
// =============================================

mercadillo.post('/items/:id/comments', async (c) => {
  const user = c.get('user');
  const itemId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return c.json({ success: false, error: 'El comentario es obligatorio' }, 400);
    }

    if (content.length > 500) {
      return c.json({ success: false, error: 'Máximo 500 caracteres' }, 400);
    }

    const item = await c.env.DB.prepare(
      'SELECT id FROM mercadillo_items WHERE id = ? AND status != \'deleted\''
    ).bind(itemId).first();

    if (!item) {
      return c.json({ success: false, error: 'Artículo no encontrado' }, 404);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO mercadillo_comments (item_id, user_id, content)
      VALUES (?, ?, ?)
    `).bind(itemId, user.sub, content.trim()).run();

    await c.env.DB.prepare(
      'UPDATE mercadillo_items SET comments_count = comments_count + 1 WHERE id = ?'
    ).bind(itemId).run();

    const newComment = await c.env.DB.prepare(`
      SELECT c.*, u.name as author_name
      FROM mercadillo_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json({ success: true, data: newComment });
  } catch (error) {
    console.error('Add comment error:', error);
    return c.json({ success: false, error: 'Error añadiendo comentario' }, 500);
  }
});

mercadillo.get('/items/:id/comments', async (c) => {
  const itemId = parseInt(c.req.param('id'));

  try {
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_chari
      FROM mercadillo_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.item_id = ? AND c.is_active = 1
      ORDER BY c.created_at ASC
    `).bind(CHARI_USER_ID, itemId).all();

    return c.json({ success: true, data: comments.results || [] });
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({ success: false, error: 'Error obteniendo comentarios' }, 500);
  }
});

// =============================================
// UTILIDADES
// =============================================

mercadillo.get('/categories', async (c) => {
  return c.json({ success: true, data: CATEGORIES });
});

mercadillo.get('/conditions', async (c) => {
  return c.json({ success: true, data: CONDITIONS });
});

export default mercadillo;
