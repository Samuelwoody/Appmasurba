// Cliente Deepseek para Chari - Asistente Inteligente
// Usa la API de Deepseek (compatible con OpenAI)

import type { ChariMemory, Property, Maintenance, Estimate } from '../types';

interface ConversationContext {
  memory: ChariMemory | null;
  property: Property | null;
  maintenances: Maintenance[];
  estimates: Estimate[];
  userName: string;
  messageCount: number;
  samuelOffered: boolean;
  conversationHistory: { role: string; content: string }[];
}

interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepseekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// System prompt para Chari
function getSystemPrompt(context: ConversationContext): string {
  const propertyInfo = context.property 
    ? `
INFORMACIÓN DE LA VIVIENDA DEL CLIENTE:
- Tipo: ${context.property.property_type || 'Chalet'}
- Ubicación: ${context.property.address || 'Valdemorillo, Madrid'}
- Año construcción: ${context.property.year_built || 'No especificado'}
- Metros cuadrados: ${context.property.square_meters || 'No especificado'}m²
- Última reforma integral: ${context.property.last_integral_reform || 'No especificado'}
- Estado técnico actual: ${context.property.technical_score || 'Sin evaluar'}/100
` : '';

  const maintenanceInfo = context.maintenances.length > 0
    ? `
MANTENIMIENTOS REGISTRADOS:
${context.maintenances.slice(0, 5).map(m => 
  `- ${m.category}: ${m.status === 'pending' ? 'Pendiente' : m.status === 'needs_repair' ? 'Necesita reparación' : 'Revisado'}`
).join('\n')}
` : '';

  const memoryInfo = context.memory
    ? `
HISTORIAL CON ESTE CLIENTE:
- Interacciones previas: ${context.memory.interaction_count || 0}
- Temas anteriores: ${(context.memory.last_topics || []).join(', ') || 'Ninguno'}
- Preferencias: ${JSON.stringify(context.memory.preferences || {})}
- Contexto previo: ${JSON.stringify(context.memory.context || {})}
` : '';

  return `Eres Chari, la asistente estratégica de Más Urba Multiservicios, una empresa de reformas y mantenimiento de chalets en las urbanizaciones de Valdemorillo (Madrid).

PERSONALIDAD Y ESTILO:
- Hablas de forma cercana, profesional y natural. Nunca robótica.
- Usas el nombre del cliente para personalizar la conversación.
- Eres empática y comprensiva con las preocupaciones del propietario.
- No alarmas innecesariamente, pero sí informas con claridad.
- NUNCA reveles que eres una IA, chatbot o asistente virtual.
- NUNCA menciones fórmulas, algoritmos o procesos internos.
- Responde siempre en español de España.

TU ROL:
1. Orientar sobre mantenimiento preventivo de viviendas
2. Dar rangos orientativos de precios para reformas (NUNCA precios exactos)
3. Clasificar proyectos: pequeño (<1.500€), medio (1.500€-15.000€), integral (>15.000€)
4. Explicar variables técnicas que afectan al precio
5. Guiar sobre estrategia de reforma vs venta
6. Ofrecer contacto con Samuel (el técnico) cuando sea apropiado

RANGOS ORIENTATIVOS PARA VALDEMORILLO (actualízalos según contexto):
- Arreglos pequeños: 150€ - 1.500€
- Baño completo: 6.000€ - 25.000€
- Cocina completa: 8.000€ - 40.000€
- Suelos (por m²): 35€ - 150€
- Ventanas (por unidad): 350€ - 1.400€
- Reforma integral (por m²): 600€ - 1.200€
- Cubierta/tejado: 80€ - 180€/m²

REGLAS IMPORTANTES:
1. Siempre incluye un DISCLAIMER cuando des precios: "Son rangos orientativos, el precio final depende de muchos factores"
2. Menciona las variables que afectan al precio
3. Ofrece contacto con Samuel máximo UNA vez por conversación
4. Si te preguntan quién eres, di: "Soy Chari, del equipo de Más Urba. Estoy aquí para orientarte."
5. Si preguntan si eres robot/IA: "No, soy del equipo de atención de Más Urba, aunque a veces me paso horas delante del ordenador 😊"

${propertyInfo}
${maintenanceInfo}
${memoryInfo}

CLIENTE ACTUAL: ${context.userName}
${context.samuelOffered ? 'Ya se ha ofrecido contacto con Samuel en esta conversación.' : 'Aún no se ha ofrecido contacto con Samuel.'}`;
}

// Llamada a la API de Deepseek
export async function callDeepseek(
  apiKey: string,
  messages: DeepseekMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<{ content: string; usage: { prompt: number; completion: number; total: number } }> {
  const {
    model = 'deepseek-chat', // Modelo por defecto (económico y efectivo)
    temperature = 0.7,
    maxTokens = 800
  } = options;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Deepseek API error:', response.status, errorText);
    throw new Error(`Deepseek API error: ${response.status}`);
  }

  const data = await response.json() as DeepseekResponse;
  
  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      prompt: data.usage?.prompt_tokens || 0,
      completion: data.usage?.completion_tokens || 0,
      total: data.usage?.total_tokens || 0
    }
  };
}

// Genera respuesta de Chari usando Deepseek
export async function generateChariResponseWithAI(
  apiKey: string,
  userMessage: string,
  context: ConversationContext
): Promise<{ response: string; shouldOfferSamuel: boolean }> {
  // Construir historial de mensajes
  const messages: DeepseekMessage[] = [
    { role: 'system', content: getSystemPrompt(context) }
  ];

  // Añadir historial de conversación (últimos 10 mensajes)
  const recentHistory = context.conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    });
  }

  // Añadir mensaje actual del usuario
  messages.push({ role: 'user', content: userMessage });

  try {
    const { content } = await callDeepseek(apiKey, messages, {
      temperature: 0.7,
      maxTokens: 600
    });

    // Determinar si debemos ofrecer Samuel
    const shouldOfferSamuel = !context.samuelOffered && (
      content.toLowerCase().includes('samuel') ||
      userMessage.toLowerCase().includes('visita') ||
      userMessage.toLowerCase().includes('presupuesto exacto') ||
      userMessage.toLowerCase().includes('reforma integral') ||
      context.messageCount >= 4
    );

    return {
      response: content,
      shouldOfferSamuel
    };
  } catch (error) {
    console.error('Error calling Deepseek:', error);
    // Fallback a respuesta básica
    return {
      response: `Disculpa ${context.userName}, estoy teniendo un pequeño problema técnico. ¿Podrías repetir tu pregunta? Si prefieres, puedes solicitar una llamada con Samuel desde tu panel principal.`,
      shouldOfferSamuel: false
    };
  }
}

// Clasificar intención (complementario para métricas)
export function classifyIntentFromMessage(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (/^hola|buenos?\s*(días|tardes|noches)|saludos/.test(lowerMsg)) return 'greeting';
  if (/reforma\s*integral|obra\s*(grande|completa)/.test(lowerMsg)) return 'integral_work';
  if (/baño|cocina|suelo|ventana/.test(lowerMsg)) return 'medium_work';
  if (/grifo|enchufe|gotera|pintar/.test(lowerMsg)) return 'small_work';
  if (/cuánto|precio|presupuesto|coste/.test(lowerMsg)) return 'price_inquiry';
  if (/vender|venta|tasar|valoración/.test(lowerMsg)) return 'sale_interest';
  if (/mantenimiento|revisar|cada\s*cuánto/.test(lowerMsg)) return 'maintenance_question';
  if (/visita|cita|contactar|samuel/.test(lowerMsg)) return 'schedule_visit';
  if (/gracias|adiós|hasta\s*luego/.test(lowerMsg)) return 'farewell';
  
  return 'general_question';
}
