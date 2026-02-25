import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, Conversation, ChariMemory, Property, Maintenance, Estimate, Message } from '../types';
import { 
  generateChariResponse, 
  updateChariMemory, 
  classifyIntent 
} from '../lib/chari';

const chari = new Hono<{ Bindings: Bindings }>();

chari.use('*', authMiddleware);

// Obtener o crear conversación activa
chari.get('/conversation', async (c) => {
  const user = c.get('user');
  
  try {
    // Buscar conversación activa
    let conversation = await c.env.DB.prepare(
      'SELECT * FROM conversations WHERE user_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1'
    ).bind(user.sub).first<Conversation>();
    
    // Si no hay, crear una nueva
    if (!conversation) {
      const result = await c.env.DB.prepare(
        `INSERT INTO conversations (user_id, title, messages, is_active)
         VALUES (?, 'Nueva conversación', '[]', 1)`
      ).bind(user.sub).run();
      
      conversation = {
        id: result.meta.last_row_id as number,
        user_id: user.sub,
        title: 'Nueva conversación',
        messages: [],
        intent_classification: null,
        samuel_contact_offered: 0,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Conversation;
    } else {
      // Parsear mensajes si es string
      if (typeof conversation.messages === 'string') {
        conversation.messages = JSON.parse(conversation.messages);
      }
    }
    
    // Obtener memoria de Chari
    let memory = await c.env.DB.prepare(
      'SELECT * FROM chari_memory WHERE user_id = ?'
    ).bind(user.sub).first<ChariMemory>();
    
    if (memory) {
      if (typeof memory.context === 'string') {
        memory.context = JSON.parse(memory.context);
      }
      if (typeof memory.preferences === 'string') {
        memory.preferences = JSON.parse(memory.preferences);
      }
      if (typeof memory.last_topics === 'string') {
        memory.last_topics = JSON.parse(memory.last_topics);
      }
    }
    
    return c.json({
      success: true,
      data: {
        conversation,
        memory: memory ? {
          interactionCount: memory.interaction_count,
          lastTopics: memory.last_topics
        } : null,
        greeting: memory?.interaction_count === 0 
          ? `¡Hola ${user.name}! Soy Chari, tu asistente en Más Urba. Estoy aquí para ayudarte con cualquier duda sobre tu vivienda. ¿En qué puedo orientarte?`
          : `¡Hola de nuevo, ${user.name}! ¿En qué puedo ayudarte hoy?`
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return c.json({ success: false, error: 'Error obteniendo conversación' }, 500);
  }
});

// Enviar mensaje a Chari
chari.post('/message', async (c) => {
  const user = c.get('user');
  
  try {
    const body = await c.req.json();
    const { message, conversation_id } = body;
    
    if (!message || !message.trim()) {
      return c.json({ success: false, error: 'Mensaje requerido' }, 400);
    }
    
    // Obtener conversación
    let conversation = await c.env.DB.prepare(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
    ).bind(conversation_id, user.sub).first<Conversation>();
    
    if (!conversation) {
      return c.json({ success: false, error: 'Conversación no encontrada' }, 404);
    }
    
    // Parsear mensajes existentes
    let messages: Message[] = [];
    if (typeof conversation.messages === 'string') {
      messages = JSON.parse(conversation.messages);
    } else {
      messages = conversation.messages || [];
    }
    
    // Obtener memoria de Chari
    let memory = await c.env.DB.prepare(
      'SELECT * FROM chari_memory WHERE user_id = ?'
    ).bind(user.sub).first<ChariMemory>();
    
    if (memory) {
      if (typeof memory.context === 'string') {
        memory.context = JSON.parse(memory.context);
      }
      if (typeof memory.preferences === 'string') {
        memory.preferences = JSON.parse(memory.preferences);
      }
      if (typeof memory.last_topics === 'string') {
        memory.last_topics = JSON.parse(memory.last_topics);
      }
    }
    
    // Obtener datos de contexto
    const property = await c.env.DB.prepare(
      'SELECT * FROM properties WHERE user_id = ? LIMIT 1'
    ).bind(user.sub).first<Property>();
    
    const maintenancesResult = await c.env.DB.prepare(
      `SELECT m.* FROM maintenances m
       JOIN properties p ON m.property_id = p.id
       WHERE p.user_id = ?`
    ).bind(user.sub).all<Maintenance>();
    
    const estimatesResult = await c.env.DB.prepare(
      'SELECT * FROM estimates WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
    ).bind(user.sub).all<Estimate>();
    
    // Generar respuesta de Chari
    const { response, intent, shouldOfferSamuel } = generateChariResponse(
      message,
      {
        memory: memory || null,
        property: property || null,
        maintenances: maintenancesResult.results || [],
        estimates: estimatesResult.results || [],
        userName: user.name,
        messageCount: messages.length,
        samuelOffered: conversation.samuel_contact_offered === 1
      }
    );
    
    // Añadir mensaje del usuario
    const userMessage: Message = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    messages.push(userMessage);
    
    // Añadir respuesta de Chari
    let assistantContent = response;
    if (shouldOfferSamuel && conversation.samuel_contact_offered === 0) {
      assistantContent += '\n\n¿Te gustaría que Samuel revisara tu vivienda personalmente? Puedes solicitar una visita desde tu panel principal.';
    }
    
    const assistantMessage: Message = {
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString()
    };
    messages.push(assistantMessage);
    
    // Actualizar conversación
    await c.env.DB.prepare(
      `UPDATE conversations SET 
       messages = ?, intent_classification = ?,
       samuel_contact_offered = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      JSON.stringify(messages),
      intent,
      shouldOfferSamuel ? 1 : conversation.samuel_contact_offered,
      conversation.id
    ).run();
    
    // Actualizar memoria de Chari
    const memoryUpdate = updateChariMemory(memory || null, message, intent);
    
    if (memory) {
      await c.env.DB.prepare(
        `UPDATE chari_memory SET 
         context = ?, last_topics = ?, interaction_count = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`
      ).bind(
        JSON.stringify(memoryUpdate.context),
        JSON.stringify(memoryUpdate.last_topics),
        memoryUpdate.interaction_count,
        user.sub
      ).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO chari_memory (user_id, context, preferences, interaction_count, last_topics)
         VALUES (?, ?, '{}', ?, ?)`
      ).bind(
        user.sub,
        JSON.stringify(memoryUpdate.context),
        memoryUpdate.interaction_count,
        JSON.stringify(memoryUpdate.last_topics)
      ).run();
    }
    
    return c.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        intent,
        samuelOffered: shouldOfferSamuel
      }
    });
  } catch (error) {
    console.error('Chari message error:', error);
    return c.json({ success: false, error: 'Error procesando mensaje' }, 500);
  }
});

// Obtener historial de conversaciones
chari.get('/history', async (c) => {
  const user = c.get('user');
  
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, title, intent_classification, created_at, updated_at
       FROM conversations 
       WHERE user_id = ? 
       ORDER BY updated_at DESC
       LIMIT 20`
    ).bind(user.sub).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Get history error:', error);
    return c.json({ success: false, error: 'Error obteniendo historial' }, 500);
  }
});

// Nueva conversación
chari.post('/new', async (c) => {
  const user = c.get('user');
  
  try {
    // Cerrar conversaciones activas anteriores
    await c.env.DB.prepare(
      'UPDATE conversations SET is_active = 0 WHERE user_id = ? AND is_active = 1'
    ).bind(user.sub).run();
    
    // Crear nueva
    const result = await c.env.DB.prepare(
      `INSERT INTO conversations (user_id, title, messages, is_active)
       VALUES (?, 'Nueva conversación', '[]', 1)`
    ).bind(user.sub).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        title: 'Nueva conversación',
        messages: []
      }
    });
  } catch (error) {
    console.error('New conversation error:', error);
    return c.json({ success: false, error: 'Error creando conversación' }, 500);
  }
});

export default chari;
