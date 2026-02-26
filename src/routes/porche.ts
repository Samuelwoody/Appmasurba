import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings } from '../types';

const porche = new Hono<{ Bindings: Bindings }>();

porche.use('*', authMiddleware);

// Categorías de posts
const CATEGORIES = {
  general: { label: 'General', icon: '💬', color: 'gray' },
  recommendation: { label: 'Recomendación', icon: '⭐', color: 'yellow' },
  alert: { label: 'Aviso', icon: '⚠️', color: 'red' },
  event: { label: 'Evento', icon: '🎉', color: 'purple' }
};

// =============================================
// POSTS
// =============================================

// Obtener feed de posts
porche.get('/posts', async (c) => {
  const user = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const category = c.req.query('category');
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        p.*,
        u.name as author_name,
        u.email as author_email,
        prop.urbanization as author_urbanization,
        (SELECT COUNT(*) FROM porche_reactions WHERE post_id = p.id AND reaction_type = 'like') as likes_count,
        (SELECT COUNT(*) FROM porche_reactions WHERE post_id = p.id AND reaction_type = 'heart') as hearts_count,
        (SELECT COUNT(*) FROM porche_comments WHERE post_id = p.id AND is_active = 1) as comments_count,
        (SELECT reaction_type FROM porche_reactions WHERE post_id = p.id AND user_id = ? AND reaction_type = 'like') as user_liked,
        (SELECT reaction_type FROM porche_reactions WHERE post_id = p.id AND user_id = ? AND reaction_type = 'heart') as user_hearted
      FROM porche_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN properties prop ON prop.user_id = u.id
      WHERE p.is_active = 1
    `;
    
    const params: any[] = [user.sub, user.sub];
    
    if (category && category !== 'all') {
      query += ` AND p.category = ?`;
      params.push(category);
    }
    
    query += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const posts = await c.env.DB.prepare(query).bind(...params).all();

    // Obtener total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM porche_posts WHERE is_active = 1`;
    if (category && category !== 'all') {
      countQuery += ` AND category = '${category}'`;
    }
    const totalResult = await c.env.DB.prepare(countQuery).first<{ total: number }>();

    // Parsear imágenes JSON
    const postsWithParsedImages = (posts.results || []).map((post: any) => ({
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      categoryInfo: CATEGORIES[post.category as keyof typeof CATEGORIES] || CATEGORIES.general
    }));

    return c.json({
      success: true,
      data: {
        posts: postsWithParsedImages,
        pagination: {
          page,
          limit,
          total: totalResult?.total || 0,
          totalPages: Math.ceil((totalResult?.total || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return c.json({ success: false, error: 'Error obteniendo posts' }, 500);
  }
});

// Obtener un post con sus comentarios
porche.get('/posts/:id', async (c) => {
  const user = c.get('user');
  const postId = parseInt(c.req.param('id'));

  try {
    // Obtener post
    const post = await c.env.DB.prepare(`
      SELECT 
        p.*,
        u.name as author_name,
        u.email as author_email,
        prop.urbanization as author_urbanization,
        (SELECT COUNT(*) FROM porche_reactions WHERE post_id = p.id AND reaction_type = 'like') as likes_count,
        (SELECT COUNT(*) FROM porche_reactions WHERE post_id = p.id AND reaction_type = 'heart') as hearts_count,
        (SELECT reaction_type FROM porche_reactions WHERE post_id = p.id AND user_id = ? AND reaction_type = 'like') as user_liked,
        (SELECT reaction_type FROM porche_reactions WHERE post_id = p.id AND user_id = ? AND reaction_type = 'heart') as user_hearted
      FROM porche_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN properties prop ON prop.user_id = u.id
      WHERE p.id = ? AND p.is_active = 1
    `).bind(user.sub, user.sub, postId).first();

    if (!post) {
      return c.json({ success: false, error: 'Post no encontrado' }, 404);
    }

    // Obtener comentarios
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        prop.urbanization as author_urbanization
      FROM porche_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN properties prop ON prop.user_id = u.id
      WHERE c.post_id = ? AND c.is_active = 1
      ORDER BY c.created_at ASC
    `).bind(postId).all();

    return c.json({
      success: true,
      data: {
        ...post,
        images: post.images ? JSON.parse(post.images as string) : [],
        categoryInfo: CATEGORIES[(post as any).category as keyof typeof CATEGORIES] || CATEGORIES.general,
        comments: comments.results || []
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    return c.json({ success: false, error: 'Error obteniendo post' }, 500);
  }
});

// Crear nuevo post
porche.post('/posts', async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { content, category = 'general', images = [] } = body;

    if (!content || content.trim().length === 0) {
      return c.json({ success: false, error: 'El contenido es obligatorio' }, 400);
    }

    if (content.length > 2000) {
      return c.json({ success: false, error: 'El contenido no puede exceder 2000 caracteres' }, 400);
    }

    if (!CATEGORIES[category as keyof typeof CATEGORIES]) {
      return c.json({ success: false, error: 'Categoría no válida' }, 400);
    }

    if (images.length > 4) {
      return c.json({ success: false, error: 'Máximo 4 imágenes por post' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO porche_posts (user_id, content, category, images)
      VALUES (?, ?, ?, ?)
    `).bind(
      user.sub,
      content.trim(),
      category,
      images.length > 0 ? JSON.stringify(images) : null
    ).run();

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        message: '¡Post publicado!'
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    return c.json({ success: false, error: 'Error creando post' }, 500);
  }
});

// Editar post (solo el autor)
porche.put('/posts/:id', async (c) => {
  const user = c.get('user');
  const postId = parseInt(c.req.param('id'));

  try {
    // Verificar que el post pertenece al usuario
    const existing = await c.env.DB.prepare(
      'SELECT id, user_id FROM porche_posts WHERE id = ? AND is_active = 1'
    ).bind(postId).first<{ id: number; user_id: number }>();

    if (!existing) {
      return c.json({ success: false, error: 'Post no encontrado' }, 404);
    }

    if (existing.user_id !== user.sub && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso para editar este post' }, 403);
    }

    const body = await c.req.json();
    const { content, category } = body;

    if (content && content.length > 2000) {
      return c.json({ success: false, error: 'El contenido no puede exceder 2000 caracteres' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE porche_posts 
      SET content = COALESCE(?, content),
          category = COALESCE(?, category),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(content || null, category || null, postId).run();

    return c.json({ success: true, message: 'Post actualizado' });
  } catch (error) {
    console.error('Update post error:', error);
    return c.json({ success: false, error: 'Error actualizando post' }, 500);
  }
});

// Eliminar post (solo el autor o admin)
porche.delete('/posts/:id', async (c) => {
  const user = c.get('user');
  const postId = parseInt(c.req.param('id'));

  try {
    const existing = await c.env.DB.prepare(
      'SELECT id, user_id FROM porche_posts WHERE id = ? AND is_active = 1'
    ).bind(postId).first<{ id: number; user_id: number }>();

    if (!existing) {
      return c.json({ success: false, error: 'Post no encontrado' }, 404);
    }

    if (existing.user_id !== user.sub && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso para eliminar este post' }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE porche_posts SET is_active = 0 WHERE id = ?'
    ).bind(postId).run();

    return c.json({ success: true, message: 'Post eliminado' });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json({ success: false, error: 'Error eliminando post' }, 500);
  }
});

// =============================================
// REACCIONES (Like / Heart)
// =============================================

// Toggle reacción
porche.post('/posts/:id/react', async (c) => {
  const user = c.get('user');
  const postId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json();
    const { reaction_type } = body;

    if (!['like', 'heart'].includes(reaction_type)) {
      return c.json({ success: false, error: 'Tipo de reacción no válido' }, 400);
    }

    // Verificar que el post existe
    const post = await c.env.DB.prepare(
      'SELECT id FROM porche_posts WHERE id = ? AND is_active = 1'
    ).bind(postId).first();

    if (!post) {
      return c.json({ success: false, error: 'Post no encontrado' }, 404);
    }

    // Verificar si ya existe la reacción
    const existing = await c.env.DB.prepare(
      'SELECT id FROM porche_reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?'
    ).bind(postId, user.sub, reaction_type).first();

    let action: 'added' | 'removed';

    if (existing) {
      // Quitar reacción
      await c.env.DB.prepare(
        'DELETE FROM porche_reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?'
      ).bind(postId, user.sub, reaction_type).run();
      action = 'removed';
    } else {
      // Añadir reacción
      await c.env.DB.prepare(
        'INSERT INTO porche_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)'
      ).bind(postId, user.sub, reaction_type).run();
      action = 'added';
    }

    // Obtener contadores actualizados
    const counts = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM porche_reactions WHERE post_id = ? AND reaction_type = 'like') as likes_count,
        (SELECT COUNT(*) FROM porche_reactions WHERE post_id = ? AND reaction_type = 'heart') as hearts_count
    `).bind(postId, postId).first<{ likes_count: number; hearts_count: number }>();

    return c.json({
      success: true,
      data: {
        action,
        reaction_type,
        likes_count: counts?.likes_count || 0,
        hearts_count: counts?.hearts_count || 0
      }
    });
  } catch (error) {
    console.error('React error:', error);
    return c.json({ success: false, error: 'Error procesando reacción' }, 500);
  }
});

// =============================================
// COMENTARIOS
// =============================================

// Obtener comentarios de un post
porche.get('/posts/:id/comments', async (c) => {
  const postId = parseInt(c.req.param('id'));

  try {
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        prop.urbanization as author_urbanization
      FROM porche_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN properties prop ON prop.user_id = u.id
      WHERE c.post_id = ? AND c.is_active = 1
      ORDER BY c.created_at ASC
    `).bind(postId).all();

    return c.json({
      success: true,
      data: comments.results || []
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({ success: false, error: 'Error obteniendo comentarios' }, 500);
  }
});

// Crear comentario
porche.post('/posts/:id/comments', async (c) => {
  const user = c.get('user');
  const postId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return c.json({ success: false, error: 'El comentario es obligatorio' }, 400);
    }

    if (content.length > 500) {
      return c.json({ success: false, error: 'El comentario no puede exceder 500 caracteres' }, 400);
    }

    // Verificar que el post existe
    const post = await c.env.DB.prepare(
      'SELECT id FROM porche_posts WHERE id = ? AND is_active = 1'
    ).bind(postId).first();

    if (!post) {
      return c.json({ success: false, error: 'Post no encontrado' }, 404);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO porche_comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `).bind(postId, user.sub, content.trim()).run();

    // Obtener el comentario creado con datos del autor
    const newComment = await c.env.DB.prepare(`
      SELECT 
        c.*,
        u.name as author_name,
        prop.urbanization as author_urbanization
      FROM porche_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN properties prop ON prop.user_id = u.id
      WHERE c.id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return c.json({ success: false, error: 'Error creando comentario' }, 500);
  }
});

// Eliminar comentario (solo el autor o admin)
porche.delete('/comments/:id', async (c) => {
  const user = c.get('user');
  const commentId = parseInt(c.req.param('id'));

  try {
    const existing = await c.env.DB.prepare(
      'SELECT id, user_id FROM porche_comments WHERE id = ? AND is_active = 1'
    ).bind(commentId).first<{ id: number; user_id: number }>();

    if (!existing) {
      return c.json({ success: false, error: 'Comentario no encontrado' }, 404);
    }

    if (existing.user_id !== user.sub && user.role !== 'admin') {
      return c.json({ success: false, error: 'No tienes permiso para eliminar este comentario' }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE porche_comments SET is_active = 0 WHERE id = ?'
    ).bind(commentId).run();

    return c.json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return c.json({ success: false, error: 'Error eliminando comentario' }, 500);
  }
});

// =============================================
// UTILIDADES
// =============================================

// Obtener categorías disponibles
porche.get('/categories', async (c) => {
  return c.json({
    success: true,
    data: CATEGORIES
  });
});

// Obtener estadísticas del porche (para admin)
porche.get('/stats', async (c) => {
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'No autorizado' }, 403);
  }

  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM porche_posts WHERE is_active = 1) as total_posts,
        (SELECT COUNT(*) FROM porche_comments WHERE is_active = 1) as total_comments,
        (SELECT COUNT(*) FROM porche_reactions) as total_reactions,
        (SELECT COUNT(DISTINCT user_id) FROM porche_posts) as active_users
    `).first();

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ success: false, error: 'Error obteniendo estadísticas' }, 500);
  }
});

export default porche;
