import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, Estimate } from '../types';
import { 
  calculateEstimate, 
  getInterventionTypes, 
  getInterventionData,
  formatCurrency,
  type InterventionType,
  type FinishLevel
} from '../lib/estimates';

const estimates = new Hono<{ Bindings: Bindings }>();

estimates.use('*', authMiddleware);

// Obtener tipos de intervención
estimates.get('/types', async (c) => {
  return c.json({
    success: true,
    data: {
      interventions: getInterventionTypes(),
      finishLevels: [
        { value: 'basic', label: 'Básico', description: 'Materiales estándar, funcional' },
        { value: 'medium', label: 'Medio', description: 'Buenas calidades, equilibrado' },
        { value: 'premium', label: 'Premium', description: 'Alta gama, diseño cuidado' }
      ]
    }
  });
});

// Obtener información de una intervención
estimates.get('/types/:type', async (c) => {
  const type = c.req.param('type') as InterventionType;
  
  try {
    const data = getInterventionData(type);
    if (!data) {
      return c.json({ success: false, error: 'Tipo de intervención no encontrado' }, 404);
    }
    
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    return c.json({ success: false, error: 'Tipo de intervención no válido' }, 400);
  }
});

// Calcular estimación
estimates.post('/calculate', async (c) => {
  const user = c.get('user');
  
  try {
    const body = await c.req.json();
    const { intervention_type, square_meters, finish_level, save = false } = body;
    
    if (!intervention_type) {
      return c.json({ success: false, error: 'Tipo de intervención requerido' }, 400);
    }
    
    const sqm = parseFloat(square_meters) || 1;
    const level = (finish_level || 'medium') as FinishLevel;
    
    const result = calculateEstimate(
      intervention_type as InterventionType,
      sqm,
      level
    );
    
    // Guardar si se solicita
    let savedId = null;
    if (save) {
      // Obtener propiedad del usuario
      const property = await c.env.DB.prepare(
        'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
      ).bind(user.sub).first<{ id: number }>();
      
      const insertResult = await c.env.DB.prepare(
        `INSERT INTO estimates 
         (user_id, property_id, intervention_type, square_meters, finish_level, range_min, range_max, variables_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        user.sub,
        property?.id || null,
        intervention_type,
        sqm,
        level,
        result.rangeMin,
        result.rangeMax,
        JSON.stringify({ variables: result.variables })
      ).run();
      
      savedId = insertResult.meta.last_row_id;
    }
    
    return c.json({
      success: true,
      data: {
        id: savedId,
        interventionType: intervention_type,
        interventionName: result.intervention.name,
        description: result.intervention.description,
        squareMeters: sqm,
        finishLevel: level,
        rangeMin: result.rangeMin,
        rangeMax: result.rangeMax,
        rangeFormatted: {
          min: formatCurrency(result.rangeMin),
          max: formatCurrency(result.rangeMax)
        },
        variables: result.variables,
        notes: result.intervention.notes,
        disclaimer: result.disclaimer
      }
    });
  } catch (error) {
    console.error('Calculate estimate error:', error);
    return c.json({ success: false, error: 'Error calculando estimación' }, 500);
  }
});

// Obtener estimaciones guardadas
estimates.get('/', async (c) => {
  const user = c.get('user');
  
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM estimates WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.sub).all<Estimate>();
    
    const estimates = (result.results || []).map(e => {
      const interventionData = getInterventionData(e.intervention_type as InterventionType);
      return {
        ...e,
        interventionName: interventionData?.name || e.intervention_type,
        rangeFormatted: {
          min: formatCurrency(e.range_min || 0),
          max: formatCurrency(e.range_max || 0)
        }
      };
    });
    
    return c.json({
      success: true,
      data: estimates
    });
  } catch (error) {
    console.error('Get estimates error:', error);
    return c.json({ success: false, error: 'Error obteniendo estimaciones' }, 500);
  }
});

// Eliminar estimación
estimates.delete('/:id', async (c) => {
  const user = c.get('user');
  const estimateId = c.req.param('id');
  
  try {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM estimates WHERE id = ? AND user_id = ?'
    ).bind(estimateId, user.sub).first();
    
    if (!existing) {
      return c.json({ success: false, error: 'Estimación no encontrada' }, 404);
    }
    
    await c.env.DB.prepare('DELETE FROM estimates WHERE id = ?').bind(estimateId).run();
    
    return c.json({ success: true, message: 'Estimación eliminada' });
  } catch (error) {
    console.error('Delete estimate error:', error);
    return c.json({ success: false, error: 'Error eliminando estimación' }, 500);
  }
});

export default estimates;
