import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, Property, Installation, Maintenance, Estimate, Conversation } from '../types';
import { calculateTechnicalScore, getScoreLabel } from '../lib/strategic';

const dashboard = new Hono<{ Bindings: Bindings }>();

// Aplicar auth a todas las rutas
dashboard.use('*', authMiddleware);

// Obtener dashboard completo del cliente
dashboard.get('/', async (c) => {
  const user = c.get('user');
  
  try {
    // Obtener vivienda del usuario
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(user.sub).first<Property>();
    
    let installations: Installation[] = [];
    let maintenances: Maintenance[] = [];
    let technicalScore = 50;
    let scoreLabel = getScoreLabel(50);
    
    if (property) {
      // Obtener instalaciones
      const instResult = await c.env.DB.prepare(
        'SELECT * FROM installations WHERE property_id = ?'
      ).bind(property.id).all<Installation>();
      installations = instResult.results || [];
      
      // Obtener mantenimientos
      const maintResult = await c.env.DB.prepare(
        'SELECT * FROM maintenances WHERE property_id = ? ORDER BY next_recommended ASC'
      ).bind(property.id).all<Maintenance>();
      maintenances = maintResult.results || [];
      
      // Calcular score técnico
      const propertyAge = property.year_built 
        ? new Date().getFullYear() - property.year_built 
        : 20;
      
      technicalScore = calculateTechnicalScore(
        installations,
        maintenances,
        propertyAge,
        property.last_integral_reform || undefined
      );
      
      scoreLabel = getScoreLabel(technicalScore);
      
      // Actualizar score en DB si cambió
      if (technicalScore !== property.technical_score) {
        await c.env.DB.prepare(
          'UPDATE properties SET technical_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(technicalScore, property.id).run();
      }
    }
    
    // Obtener estimaciones recientes
    const estimatesResult = await c.env.DB.prepare(
      'SELECT * FROM estimates WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
    ).bind(user.sub).all<Estimate>();
    const recentEstimates = estimatesResult.results || [];
    
    // Verificar si hay conversación activa con Chari
    const activeConv = await c.env.DB.prepare(
      'SELECT id FROM conversations WHERE user_id = ? AND is_active = 1 LIMIT 1'
    ).bind(user.sub).first();
    
    // Mantenimientos pendientes y próximo
    const pendingMaintenances = maintenances.filter(
      m => m.status === 'pending' || m.status === 'needs_repair'
    );
    
    const nextMaintenance = maintenances.find(
      m => m.next_recommended && new Date(m.next_recommended) > new Date()
    );
    
    // Solicitudes de contacto pendientes
    const pendingRequests = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM contact_requests 
       WHERE user_id = ? AND status IN ('pending', 'contacted')`
    ).bind(user.sub).first<{ count: number }>();
    
    return c.json({
      success: true,
      data: {
        user: {
          id: user.sub,
          name: user.name,
          email: user.email,
          role: user.role
        },
        property,
        technicalScore,
        scoreLabel,
        installations,
        maintenances,
        pendingMaintenances: pendingMaintenances.length,
        nextMaintenance,
        recentEstimates,
        hasActiveConversation: !!activeConv,
        hasPendingRequests: (pendingRequests?.count || 0) > 0
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ success: false, error: 'Error obteniendo dashboard' }, 500);
  }
});

// Obtener resumen rápido (para widgets)
dashboard.get('/summary', async (c) => {
  const user = c.get('user');
  
  try {
    const property = await c.env.DB.prepare(
      'SELECT technical_score, name FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ technical_score: number; name: string }>();
    
    const pendingCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM maintenances m
       JOIN properties p ON m.property_id = p.id
       WHERE p.user_id = ? AND m.status IN ('pending', 'needs_repair')`
    ).bind(user.sub).first<{ count: number }>();
    
    const estimatesCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM estimates WHERE user_id = ?'
    ).bind(user.sub).first<{ count: number }>();
    
    return c.json({
      success: true,
      data: {
        propertyName: property?.name || 'Sin vivienda',
        technicalScore: property?.technical_score || 0,
        scoreLabel: getScoreLabel(property?.technical_score || 0),
        pendingMaintenances: pendingCount?.count || 0,
        totalEstimates: estimatesCount?.count || 0
      }
    });
  } catch (error) {
    console.error('Summary error:', error);
    return c.json({ success: false, error: 'Error obteniendo resumen' }, 500);
  }
});

export default dashboard;
