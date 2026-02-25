import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings } from '../types';
import { generateImage, analyzeImage, shouldGenerateImage, REFORM_PROMPTS } from '../lib/openai-images';

const images = new Hono<{ Bindings: Bindings }>();

// Proteger todas las rutas
images.use('*', authMiddleware);

// Generar imagen con DALL-E 3
images.post('/generate', async (c) => {
  const apiKey = c.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'Servicio de imágenes no configurado'
    }, 500);
  }
  
  try {
    const { prompt, type, size, quality, style } = await c.req.json();
    
    if (!prompt) {
      return c.json({
        success: false,
        error: 'Se requiere un prompt para generar la imagen'
      }, 400);
    }
    
    // Si hay un tipo predefinido, usar el prompt mejorado
    let finalPrompt = prompt;
    if (type && REFORM_PROMPTS[type as keyof typeof REFORM_PROMPTS]) {
      finalPrompt = REFORM_PROMPTS[type as keyof typeof REFORM_PROMPTS](prompt);
    }
    
    const result = await generateImage(apiKey, {
      prompt: finalPrompt,
      size: size || '1024x1024',
      quality: quality || 'standard',
      style: style || 'natural'
    });
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 500);
    }
    
    return c.json({
      success: true,
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt
    });
    
  } catch (error) {
    console.error('Error in /generate:', error);
    return c.json({
      success: false,
      error: 'Error al procesar la solicitud'
    }, 500);
  }
});

// Analizar imagen con GPT-4o Vision
images.post('/analyze', async (c) => {
  const apiKey = c.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'Servicio de análisis de imágenes no configurado'
    }, 500);
  }
  
  try {
    const { imageUrl, imageBase64, prompt } = await c.req.json();
    
    if (!imageUrl && !imageBase64) {
      return c.json({
        success: false,
        error: 'Se requiere una imagen (URL o base64)'
      }, 400);
    }
    
    const result = await analyzeImage(apiKey, {
      imageUrl,
      imageBase64,
      prompt: prompt || '¿Qué puedes decirme sobre esta imagen relacionada con mi vivienda?'
    });
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 500);
    }
    
    return c.json({
      success: true,
      analysis: result.analysis
    });
    
  } catch (error) {
    console.error('Error in /analyze:', error);
    return c.json({
      success: false,
      error: 'Error al procesar la imagen'
    }, 500);
  }
});

// Endpoint para verificar si un mensaje debería generar imagen
images.post('/should-generate', async (c) => {
  try {
    const { message } = await c.req.json();
    
    if (!message) {
      return c.json({
        success: true,
        should: false
      });
    }
    
    const result = shouldGenerateImage(message);
    
    return c.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error in /should-generate:', error);
    return c.json({
      success: false,
      should: false
    });
  }
});

// Endpoint combinado para Chari - analizar imagen y responder
images.post('/chari-analyze', async (c) => {
  const apiKey = c.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'Servicio de análisis no disponible'
    }, 500);
  }
  
  try {
    const { imageBase64, userMessage, conversationContext } = await c.req.json();
    
    if (!imageBase64) {
      return c.json({
        success: false,
        error: 'No se ha proporcionado imagen'
      }, 400);
    }
    
    // Construir prompt contextualizado
    let contextPrompt = userMessage || '¿Qué opinas de esta imagen?';
    
    if (conversationContext) {
      contextPrompt = `Contexto del usuario:
- Nombre: ${conversationContext.userName || 'Vecino'}
- Vivienda: ${conversationContext.propertyType || 'Chalet'} en ${conversationContext.urbanization || 'Valdemorillo'}
- Año construcción: ${conversationContext.yearBuilt || 'No especificado'}

Mensaje del usuario: ${userMessage || '¿Qué puedes decirme sobre esta imagen?'}

Analiza la imagen y responde de forma cercana y profesional como Chari.`;
    }
    
    const result = await analyzeImage(apiKey, {
      imageBase64,
      prompt: contextPrompt
    });
    
    return c.json({
      success: result.success,
      response: result.analysis,
      error: result.error
    });
    
  } catch (error) {
    console.error('Error in /chari-analyze:', error);
    return c.json({
      success: false,
      error: 'Error al analizar la imagen'
    }, 500);
  }
});

export default images;
