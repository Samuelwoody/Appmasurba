// Lógica de Chari - Asistente Estratégica Más Urba
// Sistema de respuestas inteligentes con memoria persistente

import type { ChariMemory, Property, Maintenance, Estimate } from '../types';

export type IntentClassification = 
  | 'greeting'
  | 'small_work'
  | 'medium_work'
  | 'integral_work'
  | 'price_inquiry'
  | 'technical_question'
  | 'sale_interest'
  | 'maintenance_question'
  | 'schedule_visit'
  | 'general_question'
  | 'farewell';

interface ConversationContext {
  memory: ChariMemory | null;
  property: Property | null;
  maintenances: Maintenance[];
  estimates: Estimate[];
  userName: string;
  messageCount: number;
  samuelOffered: boolean;
}

// Patrones de intención
const INTENT_PATTERNS: Record<IntentClassification, RegExp[]> = {
  greeting: [
    /^hola/i, /^buenos?\s*(días|tardes|noches)/i, /^saludos/i, /^qué tal/i, /^hey/i
  ],
  small_work: [
    /arreglo\s*(pequeño|menor)/i, /reparación\s*(pequeña|menor)/i, /grifo/i, /enchufe/i,
    /gotera\s*(pequeña)?/i, /pintar\s*(una\s*)?(pared|habitación)/i, /persiana/i
  ],
  medium_work: [
    /baño/i, /cocina/i, /suelo/i, /ventana/i, /caldera/i, /calefacción/i,
    /cambiar\s*(el\s*)?(suelo|baño|cocina)/i, /reformar\s*(el\s*)?(baño|cocina)/i
  ],
  integral_work: [
    /reforma\s*integral/i, /reformar\s*(toda|completa|entera)/i, /obra\s*(grande|completa|integral)/i,
    /rehabilitación/i, /vaciar\s*(y|para)\s*reformar/i
  ],
  price_inquiry: [
    /cuánto\s*(cuesta|costaría|vale|saldría)/i, /precio/i, /presupuesto/i,
    /coste/i, /inversión/i, /qué\s*precio/i, /cuánto\s*me\s*costaría/i
  ],
  technical_question: [
    /cubierta/i, /tejado/i, /fachada/i, /aislamiento/i, /instalación\s*eléctrica/i,
    /fontanería/i, /humedad/i, /grieta/i, /estructura/i, /cimientos/i
  ],
  sale_interest: [
    /vender/i, /venta/i, /poner\s*(en\s*)?venta/i, /valoración/i, /tasar/i,
    /cuánto\s*vale\s*mi\s*(casa|vivienda|chalet)/i, /mercado\s*inmobiliario/i
  ],
  maintenance_question: [
    /mantenimiento/i, /revisar/i, /revisión/i, /cada\s*cuánto/i, /frecuencia/i,
    /cuándo\s*(debo|tengo\s*que)/i, /programar/i
  ],
  schedule_visit: [
    /visita/i, /ver\s*(la\s*)?(casa|vivienda)/i, /quedar/i, /cita/i,
    /hablar\s*con\s*samuel/i, /contactar/i, /llamar/i
  ],
  general_question: [
    /qué\s*(es|significa|quiere\s*decir)/i, /cómo\s*funciona/i, /explica/i,
    /información/i, /ayuda/i, /consejo/i
  ],
  farewell: [
    /gracias/i, /adiós/i, /hasta\s*(luego|pronto|otra)/i, /nos\s*vemos/i, /chao/i
  ]
};

// Clasificar intención del mensaje
export function classifyIntent(message: string): IntentClassification {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(message))) {
      return intent as IntentClassification;
    }
  }
  return 'general_question';
}

// Determinar tipo de obra según intención
export function getWorkType(intent: IntentClassification): 'small' | 'medium' | 'integral' | null {
  switch (intent) {
    case 'small_work':
      return 'small';
    case 'medium_work':
    case 'maintenance_question':
      return 'medium';
    case 'integral_work':
      return 'integral';
    default:
      return null;
  }
}

// Generar respuesta de Chari
export function generateChariResponse(
  message: string,
  context: ConversationContext
): { response: string; intent: IntentClassification; shouldOfferSamuel: boolean } {
  const intent = classifyIntent(message);
  const workType = getWorkType(intent);
  
  let response = '';
  let shouldOfferSamuel = false;
  
  // Personalización con nombre
  const greeting = context.memory?.interaction_count === 0 
    ? `¡Hola ${context.userName}! Encantada de conocerte. ` 
    : `Hola ${context.userName}, `;
  
  switch (intent) {
    case 'greeting':
      response = `${greeting}¿En qué puedo ayudarte hoy con tu vivienda?`;
      break;
      
    case 'small_work':
      response = `Entiendo, ${context.userName}. Para trabajos pequeños como ese, el rango habitual en la zona está entre 150€ y 800€ dependiendo de la complejidad. ` +
        `Factores como accesibilidad, materiales necesarios y tiempo pueden variar el precio. ` +
        `¿Quieres que te dé más detalles sobre algún aspecto concreto?`;
      break;
      
    case 'medium_work':
      response = generateMediumWorkResponse(message, context);
      break;
      
    case 'integral_work':
      response = `Una reforma integral es una decisión importante, ${context.userName}. ` +
        `En chalets de la zona de Valdemorillo, los rangos orientativos suelen estar entre 600€/m² y 1.200€/m² dependiendo del nivel de acabados. ` +
        `Para una vivienda de ${context.property?.square_meters || 200}m², estaríamos hablando de un rango muy amplio: ` +
        `desde ${formatRange(context.property?.square_meters || 200, 600, 1200)}. ` +
        `\n\nHay muchas variables que afectan: estado actual de instalaciones, cambios de distribución, calidades elegidas... ` +
        `Para darte una orientación más precisa, lo ideal sería que Samuel echara un vistazo.`;
      shouldOfferSamuel = !context.samuelOffered;
      break;
      
    case 'price_inquiry':
      response = `Para darte un rango orientativo necesitaría saber qué tipo de trabajo estás considerando, ${context.userName}. ` +
        `¿Se trata de algo puntual como un baño o cocina, o estás pensando en algo más amplio? ` +
        `También ayuda saber el nivel de acabados que te gustaría: básico, medio o premium.`;
      break;
      
    case 'technical_question':
      response = generateTechnicalResponse(message, context);
      break;
      
    case 'sale_interest':
      response = generateSaleResponse(context);
      shouldOfferSamuel = !context.samuelOffered;
      break;
      
    case 'maintenance_question':
      response = generateMaintenanceResponse(context);
      break;
      
    case 'schedule_visit':
      response = `Por supuesto, ${context.userName}. Samuel estará encantado de revisar tu vivienda y darte un análisis profesional. ` +
        `Puedes solicitar una visita desde el botón "Solicitar revisión con Samuel" en tu panel principal. ` +
        `Normalmente puede cuadrar una visita en menos de una semana.`;
      break;
      
    case 'general_question':
      response = `Claro ${context.userName}, cuéntame. ¿Sobre qué aspecto de tu vivienda necesitas orientación? ` +
        `Puedo ayudarte con temas de mantenimiento, estimaciones de reforma, o estrategia si estás pensando en vender.`;
      break;
      
    case 'farewell':
      response = `¡Gracias a ti, ${context.userName}! Ha sido un placer ayudarte. ` +
        `Recuerda que puedes volver cuando quieras, y si necesitas un análisis más detallado, Samuel está disponible para visitarte. ` +
        `¡Que vaya muy bien!`;
      if (!context.samuelOffered && context.messageCount > 2) {
        shouldOfferSamuel = true;
      }
      break;
      
    default:
      response = `${context.userName}, disculpa, no estoy segura de entender exactamente lo que necesitas. ` +
        `¿Podrías darme más detalles? Puedo ayudarte con mantenimiento, estimaciones de obras, o estrategia de venta.`;
  }
  
  return { response, intent, shouldOfferSamuel };
}

function generateMediumWorkResponse(message: string, context: ConversationContext): string {
  const lowerMsg = message.toLowerCase();
  let response = '';
  
  if (lowerMsg.includes('baño')) {
    response = `Para reformar un baño en Valdemorillo, ${context.userName}, los rangos orientativos son:\n\n` +
      `• **Reforma parcial** (cambio sanitarios y grifería): 3.500€ - 8.500€\n` +
      `• **Reforma completa** (todo nuevo): 6.000€ - 14.000€\n` +
      `• **Alta gama** (materiales premium): 14.000€ - 25.000€\n\n` +
      `Esto depende mucho del tamaño, si hay que mover instalaciones, y las calidades que elijas.`;
  } else if (lowerMsg.includes('cocina')) {
    response = `La cocina es una de las reformas que más varían en precio, ${context.userName}:\n\n` +
      `• **Básica** (muebles estándar): 8.000€ - 12.000€\n` +
      `• **Media** (buenas calidades): 12.000€ - 20.000€\n` +
      `• **Alta gama** (diseño + electrodomésticos top): 20.000€ - 40.000€\n\n` +
      `Los electrodomésticos y la encimera son lo que más peso tienen en el presupuesto.`;
  } else if (lowerMsg.includes('suelo') || lowerMsg.includes('pavimento')) {
    const m2 = context.property?.square_meters || 150;
    response = `Para cambiar los suelos, ${context.userName}, en una vivienda de unos ${m2}m²:\n\n` +
      `• **Laminado**: ${formatRange(m2, 35, 55)}\n` +
      `• **Porcelánico**: ${formatRange(m2, 55, 85)}\n` +
      `• **Madera natural**: ${formatRange(m2, 85, 150)}\n\n` +
      `Incluye material y mano de obra. Si hay que levantar el suelo existente, puede subir un poco.`;
  } else if (lowerMsg.includes('ventana')) {
    response = `Las ventanas son una inversión muy rentable para el confort, ${context.userName}:\n\n` +
      `• **PVC estándar**: 350€ - 500€ por ventana\n` +
      `• **Aluminio RPT**: 500€ - 800€ por ventana\n` +
      `• **Alta gama** (triple vidrio): 800€ - 1.400€ por ventana\n\n` +
      `Una vivienda típica tiene entre 10-15 ventanas. El ahorro en calefacción se nota bastante.`;
  } else {
    response = `Para ese tipo de reforma, ${context.userName}, necesitaría más detalles para darte un rango orientativo. ` +
      `¿Podrías contarme más sobre qué zona de la casa o qué trabajo concreto estás valorando?`;
  }
  
  return response;
}

function generateTechnicalResponse(message: string, context: ConversationContext): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('cubierta') || lowerMsg.includes('tejado')) {
    return `La cubierta es fundamental, ${context.userName}. En chalets de los 90, como muchos de Valdemorillo, ` +
      `es habitual que necesiten revisión de impermeabilización cada 15-20 años. ` +
      `Una reparación puntual puede costar 2.000€-5.000€, mientras que una sustitución completa ` +
      `ronda los 80€-180€/m² de cubierta. ¿Notas algún problema concreto como goteras o humedades?`;
  }
  
  if (lowerMsg.includes('aislamiento')) {
    return `El aislamiento es clave para el confort y el ahorro energético, ${context.userName}. ` +
      `En viviendas de los 80-90, las ventanas suelen ser el punto débil. ` +
      `Cambiarlas por unas de PVC con rotura de puente térmico puede reducir la factura de calefacción un 25-30%. ` +
      `También se puede mejorar con SATE en fachada (80€-130€/m²) si el problema es más general.`;
  }
  
  if (lowerMsg.includes('humedad') || lowerMsg.includes('grieta')) {
    return `Las humedades y grietas hay que valorarlas con cuidado, ${context.userName}. ` +
      `Las humedades pueden ser de capilaridad, filtración o condensación, y cada una tiene su solución. ` +
      `Las grietas, si son estructurales, requieren estudio técnico. ` +
      `Te recomendaría que Samuel le echara un vistazo para descartar problemas mayores.`;
  }
  
  return `Es un tema técnico importante, ${context.userName}. ` +
    `Cada vivienda tiene sus particularidades según año de construcción, materiales y mantenimiento previo. ` +
    `¿Quieres que te oriente sobre algún aspecto concreto?`;
}

function generateSaleResponse(context: ConversationContext): string {
  return `Entiendo que estés valorando opciones, ${context.userName}. ` +
    `La decisión de reformar antes de vender depende de varios factores:\n\n` +
    `• **Estado actual** de la vivienda\n` +
    `• **Mercado local** en tu urbanización\n` +
    `• **Horizonte temporal** (¿urgencia o puedes esperar?)\n` +
    `• **Inversión disponible** para reforma\n\n` +
    `Como orientación general, las cocinas y baños reformados sí aumentan el valor percibido. ` +
    `Reformas integrales solo compensan si el precio de venta actual está muy por debajo del mercado. ` +
    `Para una estrategia más concreta, lo ideal sería que Samuel valorara la situación de tu vivienda.`;
}

function generateMaintenanceResponse(context: ConversationContext): string {
  const pending = context.maintenances.filter(m => m.status === 'pending' || m.status === 'needs_repair');
  
  let response = `El mantenimiento preventivo es clave para evitar sorpresas, ${context.userName}. ` +
    `Como referencia general:\n\n` +
    `• **Caldera**: revisión anual obligatoria\n` +
    `• **Cubierta**: revisión cada 2-3 años\n` +
    `• **Electricidad**: revisión cada 10 años\n` +
    `• **Piscina**: revisión pre-temporada\n\n`;
  
  if (pending.length > 0) {
    response += `Por cierto, veo que tienes ${pending.length} elemento(s) pendiente(s) de revisar en tu panel de mantenimiento. ` +
      `¿Quieres que te cuente más sobre alguno?`;
  }
  
  return response;
}

function formatRange(m2: number, minPerM2: number, maxPerM2: number): string {
  const min = Math.round(m2 * minPerM2);
  const max = Math.round(m2 * maxPerM2);
  return `${min.toLocaleString('es-ES')}€ - ${max.toLocaleString('es-ES')}€`;
}

// Actualizar memoria de Chari
export function updateChariMemory(
  currentMemory: ChariMemory | null,
  message: string,
  intent: IntentClassification
): Partial<ChariMemory> {
  const topics = extractTopics(message);
  const lastTopics = currentMemory?.last_topics || [];
  
  // Añadir nuevos temas sin duplicados
  const updatedTopics = [...new Set([...topics, ...lastTopics])].slice(0, 10);
  
  // Actualizar contexto según intención
  const context = currentMemory?.context || {};
  if (intent === 'sale_interest') {
    context.interested_in_selling = true;
  }
  if (intent === 'integral_work') {
    context.considering_integral_reform = true;
  }
  
  return {
    context,
    last_topics: updatedTopics,
    interaction_count: (currentMemory?.interaction_count || 0) + 1,
    updated_at: new Date().toISOString()
  };
}

function extractTopics(message: string): string[] {
  const topics: string[] = [];
  const keywords = ['baño', 'cocina', 'suelo', 'ventana', 'cubierta', 'tejado', 'fachada', 
    'calefacción', 'electricidad', 'fontanería', 'piscina', 'jardín', 'aislamiento',
    'reforma', 'venta', 'presupuesto', 'mantenimiento'];
  
  const lowerMsg = message.toLowerCase();
  for (const keyword of keywords) {
    if (lowerMsg.includes(keyword)) {
      topics.push(keyword);
    }
  }
  
  return topics;
}
