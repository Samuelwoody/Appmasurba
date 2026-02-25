import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, Property, Installation, Maintenance } from '../types';
import { 
  generateStrategicRecommendation, 
  calculateTechnicalScore, 
  getScoreLabel,
  type TimeHorizon,
  type ReformLevel
} from '../lib/strategic';

const strategic = new Hono<{ Bindings: Bindings }>();

strategic.use('*', authMiddleware);

// Obtener opciones para valoración estratégica
strategic.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      timeHorizons: [
        { value: 'immediate', label: 'Inmediato', description: 'Necesito vender cuanto antes' },
        { value: 'short_term', label: 'Corto plazo', description: '6-12 meses' },
        { value: 'medium_term', label: 'Medio plazo', description: '1-3 años' },
        { value: 'long_term', label: 'Largo plazo', description: 'Más de 3 años' }
      ],
      reformLevels: [
        { value: 'none', label: 'Sin reformar', description: 'Estado original o muy antiguo' },
        { value: 'partial', label: 'Reforma parcial', description: 'Algunas zonas reformadas' },
        { value: 'integral', label: 'Reforma integral', description: 'Reformada completamente hace más de 10 años' },
        { value: 'recent', label: 'Reforma reciente', description: 'Reformada en los últimos 10 años' }
      ]
    }
  });
});

// Generar valoración estratégica
strategic.post('/assess', async (c) => {
  const user = c.get('user');
  
  try {
    const body = await c.req.json();
    const { wants_to_sell, time_horizon, current_reform_level, save = false } = body;
    
    // Obtener datos de la vivienda
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<Property>();
    
    if (!property) {
      return c.json({ 
        success: false, 
        error: 'Necesitas registrar tu vivienda primero' 
      }, 400);
    }
    
    // Obtener instalaciones y mantenimientos
    const installationsResult = await c.env.DB.prepare(
      'SELECT * FROM installations WHERE property_id = ?'
    ).bind(property.id).all<Installation>();
    
    const maintenancesResult = await c.env.DB.prepare(
      'SELECT * FROM maintenances WHERE property_id = ?'
    ).bind(property.id).all<Maintenance>();
    
    // Calcular score técnico actualizado
    const propertyAge = property.year_built 
      ? new Date().getFullYear() - property.year_built 
      : 25;
    
    const technicalScore = calculateTechnicalScore(
      installationsResult.results || [],
      maintenancesResult.results || [],
      propertyAge,
      property.last_integral_reform || undefined
    );
    
    // Generar recomendación
    const result = generateStrategicRecommendation({
      wantsToSell: wants_to_sell === true || wants_to_sell === 'true',
      timeHorizon: time_horizon as TimeHorizon,
      currentReformLevel: current_reform_level as ReformLevel,
      technicalScore,
      propertyAge,
      urbanization: property.urbanization || ''
    });
    
    // Guardar si se solicita
    let savedId = null;
    if (save) {
      const insertResult = await c.env.DB.prepare(
        `INSERT INTO strategic_assessments 
         (user_id, property_id, wants_to_sell, time_horizon, current_reform_level, recommendation, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        user.sub,
        property.id,
        wants_to_sell ? 1 : 0,
        time_horizon || null,
        current_reform_level || null,
        result.recommendation,
        JSON.stringify({ reasoning: result.reasoning, considerations: result.considerations })
      ).run();
      
      savedId = insertResult.meta.last_row_id;
    }
    
    return c.json({
      success: true,
      data: {
        id: savedId,
        property: {
          name: property.name,
          yearBuilt: property.year_built,
          urbanization: property.urbanization,
          squareMeters: property.square_meters
        },
        technicalScore,
        scoreLabel: getScoreLabel(technicalScore),
        input: {
          wantsToSell: wants_to_sell,
          timeHorizon: time_horizon,
          currentReformLevel: current_reform_level
        },
        recommendation: result
      }
    });
  } catch (error) {
    console.error('Strategic assess error:', error);
    return c.json({ success: false, error: 'Error generando valoración' }, 500);
  }
});

// Obtener valoraciones estratégicas guardadas
strategic.get('/history', async (c) => {
  const user = c.get('user');
  
  try {
    const result = await c.env.DB.prepare(
      `SELECT * FROM strategic_assessments 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`
    ).bind(user.sub).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Get strategic history error:', error);
    return c.json({ success: false, error: 'Error obteniendo historial' }, 500);
  }
});

export default strategic;
