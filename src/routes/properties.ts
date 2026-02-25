import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, Property, Installation } from '../types';

const properties = new Hono<{ Bindings: Bindings }>();

properties.use('*', authMiddleware);

// Tipos de vivienda en Valdemorillo
const PROPERTY_TYPES = [
  'Chalet independiente',
  'Chalet pareado',
  'Chalet adosado',
  'Casa de campo',
  'Villa',
  'Bungalow',
  'Casa tradicional',
  'Otro'
];

// Urbanizaciones de Valdemorillo
const URBANIZATIONS = [
  'Cerro Alarcón',
  'Cerro Alarcón Ampliación',
  'El Paraíso',
  'Puentelasierra',
  'Mirador del Romero',
  'La Esperanza',
  'La Pizarrera',
  'Mojadillas',
  'Montemorillo',
  'Los Pinos',
  'Otra'
];

// Obtener catálogos
properties.get('/catalogs', async (c) => {
  return c.json({
    success: true,
    data: {
      propertyTypes: PROPERTY_TYPES,
      urbanizations: URBANIZATIONS,
      installationTypes: [
        { value: 'electricity', label: 'Electricidad' },
        { value: 'plumbing', label: 'Fontanería' },
        { value: 'heating', label: 'Calefacción' },
        { value: 'insulation', label: 'Aislamiento' },
        { value: 'roof', label: 'Cubierta' },
        { value: 'facade', label: 'Fachada' }
      ],
      perceivedStates: [
        { value: 'excellent', label: 'Excelente' },
        { value: 'good', label: 'Bueno' },
        { value: 'regular', label: 'Regular' },
        { value: 'needs_attention', label: 'Necesita atención' }
      ]
    }
  });
});

// Obtener vivienda del usuario
properties.get('/', async (c) => {
  const user = c.get('user');
  
  try {
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(user.sub).first<Property>();
    
    if (!property) {
      return c.json({ success: true, data: null });
    }
    
    // Obtener instalaciones
    const installationsResult = await c.env.DB.prepare(
      'SELECT * FROM installations WHERE property_id = ?'
    ).bind(property.id).all<Installation>();
    
    return c.json({
      success: true,
      data: {
        ...property,
        installations: installationsResult.results || []
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    return c.json({ success: false, error: 'Error obteniendo vivienda' }, 500);
  }
});

// Crear o actualizar vivienda
properties.post('/', async (c) => {
  const user = c.get('user');
  
  try {
    const body = await c.req.json();
    const {
      name,
      year_built,
      urbanization,
      property_type,
      address,
      square_meters,
      last_integral_reform,
      notes,
      installations
    } = body;
    
    // Verificar si ya tiene vivienda
    const existing = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    let propertyId: number;
    
    if (existing) {
      // Actualizar
      await c.env.DB.prepare(
        `UPDATE properties SET 
         name = ?, year_built = ?, urbanization = ?, property_type = ?,
         address = ?, square_meters = ?, last_integral_reform = ?, notes = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(
        name || 'Mi Vivienda',
        year_built || null,
        urbanization || null,
        property_type || null,
        address || null,
        square_meters || null,
        last_integral_reform || null,
        notes || null,
        existing.id
      ).run();
      
      propertyId = existing.id;
    } else {
      // Crear nueva
      const result = await c.env.DB.prepare(
        `INSERT INTO properties (user_id, name, year_built, urbanization, property_type, 
         address, square_meters, last_integral_reform, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        user.sub,
        name || 'Mi Vivienda',
        year_built || null,
        urbanization || null,
        property_type || null,
        address || null,
        square_meters || null,
        last_integral_reform || null,
        notes || null
      ).run();
      
      propertyId = result.meta.last_row_id as number;
      
      // Crear instalaciones por defecto
      const defaultInstallations = ['electricity', 'plumbing', 'heating', 'insulation', 'roof', 'facade'];
      for (const type of defaultInstallations) {
        await c.env.DB.prepare(
          `INSERT INTO installations (property_id, type, is_updated, perceived_state)
           VALUES (?, ?, 0, 'regular')`
        ).bind(propertyId, type).run();
      }
      
      // Crear mantenimientos por defecto
      const defaultMaintenances = ['roof', 'electricity', 'plumbing', 'boiler', 'facade', 'insulation', 'pool', 'garden'];
      for (const category of defaultMaintenances) {
        await c.env.DB.prepare(
          `INSERT INTO maintenances (property_id, category, status)
           VALUES (?, ?, 'pending')`
        ).bind(propertyId, category).run();
      }
    }
    
    // Actualizar instalaciones si se proporcionan
    if (installations && Array.isArray(installations)) {
      for (const inst of installations) {
        await c.env.DB.prepare(
          `UPDATE installations SET 
           is_updated = ?, year_updated = ?, perceived_state = ?, notes = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE property_id = ? AND type = ?`
        ).bind(
          inst.is_updated ? 1 : 0,
          inst.year_updated || null,
          inst.perceived_state || 'regular',
          inst.notes || null,
          propertyId,
          inst.type
        ).run();
      }
    }
    
    // Obtener vivienda actualizada
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE id = ?'
    ).bind(propertyId).first<Property>();
    
    const installationsResult = await c.env.DB.prepare(
      'SELECT * FROM installations WHERE property_id = ?'
    ).bind(propertyId).all<Installation>();
    
    return c.json({
      success: true,
      data: {
        ...property,
        installations: installationsResult.results || []
      },
      message: existing ? 'Vivienda actualizada' : 'Vivienda creada'
    });
  } catch (error) {
    console.error('Save property error:', error);
    return c.json({ success: false, error: 'Error guardando vivienda' }, 500);
  }
});

// Actualizar instalación específica
properties.put('/installations/:type', async (c) => {
  const user = c.get('user');
  const installationType = c.req.param('type');
  
  try {
    const body = await c.req.json();
    const { is_updated, year_updated, perceived_state, notes } = body;
    
    // Obtener propiedad del usuario
    const property = await c.env.DB.prepare(
      'SELECT id FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<{ id: number }>();
    
    if (!property) {
      return c.json({ success: false, error: 'No tienes vivienda registrada' }, 404);
    }
    
    await c.env.DB.prepare(
      `UPDATE installations SET 
       is_updated = ?, year_updated = ?, perceived_state = ?, notes = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE property_id = ? AND type = ?`
    ).bind(
      is_updated ? 1 : 0,
      year_updated || null,
      perceived_state || 'regular',
      notes || null,
      property.id,
      installationType
    ).run();
    
    return c.json({ success: true, message: 'Instalación actualizada' });
  } catch (error) {
    console.error('Update installation error:', error);
    return c.json({ success: false, error: 'Error actualizando instalación' }, 500);
  }
});

export default properties;
