import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings } from '../types';

const inmourba = new Hono<{ Bindings: Bindings }>();

inmourba.use('*', authMiddleware);

// ID del usuario Chari bot
const CHARI_USER_ID = 999;

// =============================================
// LISTADOS DE INMUEBLES
// =============================================

// Obtener todos los anuncios activos
inmourba.get('/listings', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const listingType = c.req.query('type'); // 'sale' o 'rent'
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        l.*,
        u.name as owner_name,
        u.phone as owner_phone,
        u.email as owner_email,
        (SELECT COUNT(*) FROM inmourba_comments WHERE listing_id = l.id AND is_active = 1) as comments_count
      FROM inmourba_listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.status IN ('active', 'reserved')
    `;
    
    const params: any[] = [];
    
    if (listingType && ['sale', 'rent'].includes(listingType)) {
      query += ` AND l.listing_type = ?`;
      params.push(listingType);
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const listings = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total
    let countQuery = `SELECT COUNT(*) as total FROM inmourba_listings WHERE status IN ('active', 'reserved')`;
    if (listingType && ['sale', 'rent'].includes(listingType)) {
      countQuery += ` AND listing_type = '${listingType}'`;
    }
    const totalResult = await c.env.DB.prepare(countQuery).first<{ total: number }>();

    // Parsear JSONs
    const listingsWithParsed = (listings.results || []).map((l: any) => ({
      ...l,
      property_data: l.property_data ? JSON.parse(l.property_data) : {},
      installations_data: l.installations_data ? JSON.parse(l.installations_data) : {},
      maintenances_data: l.maintenances_data ? JSON.parse(l.maintenances_data) : [],
      images: l.images ? JSON.parse(l.images) : []
    }));

    return c.json({
      success: true,
      data: {
        listings: listingsWithParsed,
        pagination: {
          page,
          limit,
          total: totalResult?.total || 0,
          totalPages: Math.ceil((totalResult?.total || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return c.json({ success: false, error: 'Error obteniendo anuncios' }, 500);
  }
});

// Obtener un anuncio específico
inmourba.get('/listings/:id', async (c) => {
  const listingId = parseInt(c.req.param('id'));

  try {
    const listing = await c.env.DB.prepare(`
      SELECT 
        l.*,
        u.name as owner_name,
        u.phone as owner_phone,
        u.email as owner_email
      FROM inmourba_listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ? AND l.status != 'deleted'
    `).bind(listingId).first();

    if (!listing) {
      return c.json({ success: false, error: 'Anuncio no encontrado' }, 404);
    }

    // Incrementar vistas
    await c.env.DB.prepare(
      'UPDATE inmourba_listings SET views_count = views_count + 1 WHERE id = ?'
    ).bind(listingId).run();

    // Obtener comentarios
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_chari
      FROM inmourba_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.listing_id = ? AND c.is_active = 1
      ORDER BY c.created_at ASC
    `).bind(CHARI_USER_ID, listingId).all();

    return c.json({
      success: true,
      data: {
        ...listing,
        property_data: listing.property_data ? JSON.parse(listing.property_data as string) : {},
        installations_data: listing.installations_data ? JSON.parse(listing.installations_data as string) : {},
        maintenances_data: listing.maintenances_data ? JSON.parse(listing.maintenances_data as string) : [],
        images: listing.images ? JSON.parse(listing.images as string) : [],
        comments: comments.results || []
      }
    });
  } catch (error) {
    console.error('Get listing error:', error);
    return c.json({ success: false, error: 'Error obteniendo anuncio' }, 500);
  }
});

// Publicar vivienda (desde Mi Vivienda)
inmourba.post('/publish', async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { listing_type = 'sale', price, price_type = 'to_consult', description } = body;

    // Verificar que no tenga ya un anuncio activo
    const existing = await c.env.DB.prepare(
      `SELECT id FROM inmourba_listings 
       WHERE user_id = ? AND status IN ('active', 'reserved')
       LIMIT 1`
    ).bind(user.sub).first();

    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Ya tienes un anuncio activo. Desactívalo primero para crear uno nuevo.' 
      }, 400);
    }

    // Obtener datos de la vivienda
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first();

    if (!property) {
      return c.json({ 
        success: false, 
        error: 'Primero debes configurar los datos de tu vivienda' 
      }, 400);
    }

    // Obtener estado de instalaciones
    const installations = await c.env.DB.prepare(
      'SELECT * FROM installations WHERE property_id = ?'
    ).bind((property as any).id).all();

    // Obtener mantenimientos
    const maintenances = await c.env.DB.prepare(
      'SELECT category, status, last_checked, notes FROM maintenances WHERE property_id = ?'
    ).bind((property as any).id).all();

    // Obtener imágenes de la vivienda y mantenimientos
    const propertyMedia = await c.env.DB.prepare(
      'SELECT media_base64, media_type FROM property_media WHERE property_id = ?'
    ).bind((property as any).id).all();

    const maintenanceMedia = await c.env.DB.prepare(
      `SELECT mm.media_base64, mm.media_type 
       FROM maintenance_media mm
       JOIN maintenances m ON mm.maintenance_id = m.id
       WHERE m.property_id = ?`
    ).bind((property as any).id).all();

    // Combinar imágenes (máximo 10)
    const allImages = [
      ...(propertyMedia.results || []).map((m: any) => `data:${m.media_type};base64,${m.media_base64}`),
      ...(maintenanceMedia.results || []).map((m: any) => `data:${m.media_type};base64,${m.media_base64}`)
    ].slice(0, 10);

    // Calcular puntuación técnica
    const installationScores = (installations.results || []).map((i: any) => {
      const statusScores: Record<string, number> = { good: 100, regular: 60, poor: 30, unknown: 50 };
      return statusScores[i.status] || 50;
    });
    const technicalScore = installationScores.length > 0 
      ? Math.round(installationScores.reduce((a: number, b: number) => a + b, 0) / installationScores.length)
      : 50;

    // Crear el anuncio
    const propertyData = {
      name: (property as any).name,
      address: (property as any).address,
      urbanization: (property as any).urbanization,
      property_type: (property as any).property_type,
      year_built: (property as any).year_built,
      square_meters: (property as any).square_meters,
      last_renovation: (property as any).last_renovation
    };

    const title = `${(property as any).property_type || 'Vivienda'} en ${(property as any).urbanization || 'Valdemorillo'}`;

    const result = await c.env.DB.prepare(`
      INSERT INTO inmourba_listings (
        user_id, property_id, listing_type, price, price_type, title, description,
        property_data, installations_data, maintenances_data, images, technical_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.sub,
      (property as any).id,
      listing_type,
      price || null,
      price_type,
      title,
      description || null,
      JSON.stringify(propertyData),
      JSON.stringify(installations.results || []),
      JSON.stringify(maintenances.results || []),
      JSON.stringify(allImages),
      technicalScore
    ).run();

    const listingId = result.meta.last_row_id;

    // Generar comentario automático de Chari
    await generateChariComment(c.env.DB, listingId, propertyData, technicalScore, installations.results || []);

    return c.json({
      success: true,
      data: {
        id: listingId,
        message: '¡Tu vivienda ya está publicada en InmoUrba!'
      }
    });
  } catch (error: any) {
    console.error('Publish listing error:', error?.message || error);
    console.error('Stack:', error?.stack);
    return c.json({ success: false, error: 'Error publicando vivienda', details: error?.message }, 500);
  }
});

// Función para generar comentario de Chari
async function generateChariComment(db: any, listingId: number, propertyData: any, score: number, installations: any[]) {
  let comment = `🏠 **Análisis de Chari**\n\n`;
  
  comment += `Esta vivienda tiene una **puntuación técnica de ${score}/100**. `;
  
  if (score >= 80) {
    comment += `¡Excelente estado general! `;
  } else if (score >= 60) {
    comment += `Buen estado general con algunos puntos a revisar. `;
  } else {
    comment += `Hay aspectos que necesitan atención. `;
  }

  // Destacar instalaciones buenas
  const goodInstallations = installations.filter((i: any) => i.status === 'good');
  if (goodInstallations.length > 0) {
    const names: Record<string, string> = {
      electricity: 'instalación eléctrica',
      plumbing: 'fontanería',
      heating: 'calefacción',
      insulation: 'aislamiento',
      roof: 'cubierta',
      facade: 'fachada'
    };
    const goodNames = goodInstallations.map((i: any) => names[i.installation_type] || i.installation_type).slice(0, 3);
    comment += `\n\n✅ Destacan: ${goodNames.join(', ')}.`;
  }

  // Información de la zona
  if (propertyData.urbanization) {
    comment += `\n\n📍 ${propertyData.urbanization} es una urbanización bien valorada en Valdemorillo.`;
  }

  comment += `\n\n💡 *Para una valoración profesional completa, contacta con Samuel de Más Urba.*`;

  try {
    await db.prepare(`
      INSERT INTO inmourba_comments (listing_id, user_id, content, is_from_chari)
      VALUES (?, ?, ?, 1)
    `).bind(listingId, CHARI_USER_ID, comment).run();
  } catch (error) {
    console.error('Error creating Chari comment:', error);
  }
}

// Actualizar estado del anuncio
inmourba.put('/listings/:id/status', async (c) => {
  const user = c.get('user');
  const listingId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json();
    const { status } = body;

    if (!['active', 'reserved', 'sold', 'rented', 'paused', 'deleted'].includes(status)) {
      return c.json({ success: false, error: 'Estado no válido' }, 400);
    }

    // Verificar propiedad
    const listing = await c.env.DB.prepare(
      'SELECT id, user_id FROM inmourba_listings WHERE id = ?'
    ).bind(listingId).first<{ id: number; user_id: number }>();

    if (!listing) {
      return c.json({ success: false, error: 'Anuncio no encontrado' }, 404);
    }

    if (listing.user_id !== user.sub && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso' }, 403);
    }

    const soldAt = ['sold', 'rented'].includes(status) ? 'CURRENT_TIMESTAMP' : 'NULL';
    
    await c.env.DB.prepare(`
      UPDATE inmourba_listings 
      SET status = ?, updated_at = CURRENT_TIMESTAMP, sold_at = ${soldAt}
      WHERE id = ?
    `).bind(status, listingId).run();

    return c.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    console.error('Update listing status error:', error);
    return c.json({ success: false, error: 'Error actualizando estado' }, 500);
  }
});

// Obtener mi anuncio activo
inmourba.get('/my-listing', async (c) => {
  const user = c.get('user');

  try {
    const listing = await c.env.DB.prepare(`
      SELECT * FROM inmourba_listings 
      WHERE user_id = ? AND status IN ('active', 'reserved', 'paused')
      ORDER BY created_at DESC LIMIT 1
    `).bind(user.sub).first();

    return c.json({
      success: true,
      data: listing ? {
        ...listing,
        property_data: listing.property_data ? JSON.parse(listing.property_data as string) : {},
        images: listing.images ? JSON.parse(listing.images as string) : []
      } : null
    });
  } catch (error) {
    console.error('Get my listing error:', error);
    return c.json({ success: false, error: 'Error obteniendo anuncio' }, 500);
  }
});

// =============================================
// COMENTARIOS
// =============================================

// Añadir comentario
inmourba.post('/listings/:id/comments', async (c) => {
  const user = c.get('user');
  const listingId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return c.json({ success: false, error: 'El comentario es obligatorio' }, 400);
    }

    if (content.length > 500) {
      return c.json({ success: false, error: 'Máximo 500 caracteres' }, 400);
    }

    // Verificar que el anuncio existe
    const listing = await c.env.DB.prepare(
      'SELECT id FROM inmourba_listings WHERE id = ? AND status != \'deleted\''
    ).bind(listingId).first();

    if (!listing) {
      return c.json({ success: false, error: 'Anuncio no encontrado' }, 404);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO inmourba_comments (listing_id, user_id, content)
      VALUES (?, ?, ?)
    `).bind(listingId, user.sub, content.trim()).run();

    // Actualizar contador
    await c.env.DB.prepare(
      'UPDATE inmourba_listings SET comments_count = comments_count + 1 WHERE id = ?'
    ).bind(listingId).run();

    // Obtener el comentario creado
    const newComment = await c.env.DB.prepare(`
      SELECT c.*, u.name as author_name
      FROM inmourba_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json({ success: true, data: newComment });
  } catch (error) {
    console.error('Add comment error:', error);
    return c.json({ success: false, error: 'Error añadiendo comentario' }, 500);
  }
});

// Obtener comentarios
inmourba.get('/listings/:id/comments', async (c) => {
  const listingId = parseInt(c.req.param('id'));

  try {
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        CASE WHEN c.user_id = ? THEN 1 ELSE 0 END as is_chari
      FROM inmourba_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.listing_id = ? AND c.is_active = 1
      ORDER BY c.created_at ASC
    `).bind(CHARI_USER_ID, listingId).all();

    return c.json({ success: true, data: comments.results || [] });
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({ success: false, error: 'Error obteniendo comentarios' }, 500);
  }
});

export default inmourba;
