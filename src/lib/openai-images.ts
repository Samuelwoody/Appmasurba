// Cliente OpenAI para generación y análisis de imágenes
// DALL-E 3 para generación, GPT-4o para visión

interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
}

interface ImageAnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
}

interface ImageAnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
}

// Generar imagen con DALL-E 3
export async function generateImage(
  apiKey: string,
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  try {
    // Mejorar el prompt para contexto de viviendas/reformas
    const enhancedPrompt = `${request.prompt}. 
    Estilo: fotografía profesional de arquitectura/interiorismo, iluminación natural, 
    alta calidad, realista, sin texto ni marcas de agua.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        style: request.style || 'natural',
        response_format: 'url'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DALL-E error:', error);
      return {
        success: false,
        error: error.error?.message || 'Error al generar la imagen'
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      imageUrl: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      success: false,
      error: 'Error de conexión al generar la imagen'
    };
  }
}

// Analizar imagen con GPT-4o Vision
export async function analyzeImage(
  apiKey: string,
  request: ImageAnalysisRequest
): Promise<ImageAnalysisResponse> {
  try {
    // Construir el contenido de la imagen
    let imageContent: { type: string; image_url: { url: string; detail: string } };
    
    if (request.imageBase64) {
      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${request.imageBase64}`,
          detail: 'high'
        }
      };
    } else if (request.imageUrl) {
      imageContent = {
        type: 'image_url',
        image_url: {
          url: request.imageUrl,
          detail: 'high'
        }
      };
    } else {
      return {
        success: false,
        error: 'Se requiere una imagen (URL o base64)'
      };
    }

    const systemPrompt = `Eres Chari, asesora experta de Más Urba Multiservicios para propietarios de chalets en Valdemorillo (Madrid).

Cuando analices imágenes de viviendas, reformas, o elementos del hogar:
- Identifica qué se muestra en la imagen
- Evalúa el estado actual si es relevante
- Da consejos prácticos y orientativos
- Si ves problemas potenciales, menciónalos con tacto
- Ofrece estimaciones orientativas si procede
- Habla de forma cercana y profesional

IMPORTANTE: 
- No inventes información que no puedas ver
- Si la imagen no es clara, pide más detalles
- Relaciona lo que ves con el contexto de chalets en urbanizaciones`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: request.prompt || '¿Qué puedes decirme sobre esta imagen?' },
              imageContent
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GPT-4o Vision error:', error);
      return {
        success: false,
        error: error.error?.message || 'Error al analizar la imagen'
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      analysis: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      success: false,
      error: 'Error de conexión al analizar la imagen'
    };
  }
}

// Prompts predefinidos para generación de imágenes de reformas
export const REFORM_PROMPTS = {
  kitchen_modern: (details: string) => 
    `Cocina moderna reformada en un chalet español, ${details}, con isla central, electrodomésticos integrados, acabados en blanco y madera natural, ventana grande con luz natural`,
  
  kitchen_rustic: (details: string) => 
    `Cocina rústica renovada en un chalet, ${details}, con vigas de madera, encimera de granito, muebles de madera maciza, azulejos artesanales`,
  
  bathroom_modern: (details: string) => 
    `Cuarto de baño moderno reformado, ${details}, con ducha de obra grande, mampara de cristal, lavabo suspendido, iluminación LED, tonos neutros`,
  
  bathroom_classic: (details: string) => 
    `Cuarto de baño clásico elegante, ${details}, con bañera exenta, grifería dorada, suelo de mármol, espejo con marco ornamentado`,
  
  living_room: (details: string) => 
    `Salón espacioso de chalet reformado, ${details}, con chimenea moderna, grandes ventanales, suelo de madera, techos altos`,
  
  garden: (details: string) => 
    `Jardín de chalet en urbanización de Madrid, ${details}, con césped bien cuidado, zona de barbacoa, iluminación exterior`,
  
  pool: (details: string) => 
    `Piscina privada de chalet, ${details}, con zona de tumbonas, pérgola de madera, jardín mediterráneo alrededor`,
  
  facade: (details: string) => 
    `Fachada de chalet reformado en urbanización, ${details}, con acabado moderno, ventanas de aluminio, jardín frontal`,
  
  terrace: (details: string) => 
    `Terraza cubierta de chalet, ${details}, con mobiliario de exterior, pérgola bioclimática, suelo de gres porcelánico`
};

// Detectar si un mensaje pide generar imagen
export function shouldGenerateImage(message: string): { should: boolean; type?: string; details?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Patrones que indican solicitud de imagen
  const imagePatterns = [
    /(?:cómo|como) (?:quedaría|quedaria|se vería|se veria|podría quedar)/,
    /(?:muéstrame|muestrame|enséñame|ensename) (?:cómo|como|una? imagen|un ejemplo)/,
    /(?:genera|crea|hazme|haz) (?:una? imagen|una? visualización|un render)/,
    /(?:visualiza|imagina|diseña) (?:cómo|como)?/,
    /(?:quiero ver|me gustaría ver|puedes mostrar)/
  ];
  
  const shouldGenerate = imagePatterns.some(pattern => pattern.test(lowerMessage));
  
  if (!shouldGenerate) {
    return { should: false };
  }
  
  // Detectar tipo de espacio
  let type = 'general';
  let details = message;
  
  if (/cocina/i.test(message)) {
    type = /moderna|actual|minimalista/i.test(message) ? 'kitchen_modern' : 'kitchen_rustic';
  } else if (/baño|cuarto de baño/i.test(message)) {
    type = /moderno|actual|minimalista/i.test(message) ? 'bathroom_modern' : 'bathroom_classic';
  } else if (/salón|salon|sala/i.test(message)) {
    type = 'living_room';
  } else if (/jardín|jardin/i.test(message)) {
    type = 'garden';
  } else if (/piscina/i.test(message)) {
    type = 'pool';
  } else if (/fachada|exterior/i.test(message)) {
    type = 'facade';
  } else if (/terraza|porche/i.test(message)) {
    type = 'terrace';
  }
  
  return { should: true, type, details };
}
