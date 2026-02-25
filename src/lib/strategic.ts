// Lógica de valoración estratégica
// Orientación para decisión de venta/reforma

export type TimeHorizon = 'immediate' | 'short_term' | 'medium_term' | 'long_term';
export type ReformLevel = 'none' | 'partial' | 'integral' | 'recent';
export type StrategicRecommendation = 
  | 'sell_as_is' 
  | 'minimal_refresh'
  | 'partial_reform'
  | 'full_reform'
  | 'hold_and_maintain'
  | 'needs_assessment';

interface StrategicInput {
  wantsToSell: boolean;
  timeHorizon?: TimeHorizon;
  currentReformLevel?: ReformLevel;
  technicalScore: number;
  propertyAge: number;
  urbanization: string;
}

interface StrategicOutput {
  recommendation: StrategicRecommendation;
  title: string;
  description: string;
  reasoning: string[];
  considerations: string[];
  nextSteps: string[];
  disclaimer: string;
}

// Matriz de decisión estratégica
export function generateStrategicRecommendation(input: StrategicInput): StrategicOutput {
  const { wantsToSell, timeHorizon, currentReformLevel, technicalScore, propertyAge } = input;
  
  // Si no quiere vender, recomendar mantener
  if (!wantsToSell) {
    return {
      recommendation: 'hold_and_maintain',
      title: 'Mantener y conservar',
      description: 'Tu objetivo actual es mantener la vivienda en buen estado.',
      reasoning: [
        'No hay intención de venta inmediata',
        'El foco debe estar en mantenimiento preventivo',
        'Las reformas pueden planificarse según necesidad y presupuesto'
      ],
      considerations: [
        'Revisa periódicamente instalaciones críticas',
        'Considera mejoras de eficiencia energética para reducir costes',
        'Documenta cualquier reforma para futura valoración'
      ],
      nextSteps: [
        'Completar el checklist de mantenimiento',
        'Programar revisiones pendientes',
        'Valorar mejoras de aislamiento si hay alto consumo energético'
      ],
      disclaimer: getStandardDisclaimer()
    };
  }
  
  // Decisión basada en horizonte temporal y estado
  let recommendation: StrategicRecommendation;
  let title: string;
  let description: string;
  let reasoning: string[] = [];
  let considerations: string[] = [];
  let nextSteps: string[] = [];
  
  // Venta inmediata
  if (timeHorizon === 'immediate') {
    if (technicalScore >= 70) {
      recommendation = 'sell_as_is';
      title = 'Vender tal cual';
      description = 'Tu vivienda está en buen estado para salir al mercado.';
      reasoning = [
        'Necesitas vender rápido',
        'El estado técnico es aceptable',
        'Las reformas retrasarían la venta'
      ];
      considerations = [
        'Pequeños arreglos cosméticos pueden ayudar',
        'Home staging puede mejorar la percepción',
        'Precio ajustado a estado actual'
      ];
      nextSteps = [
        'Solicitar valoración de mercado',
        'Preparar documentación de la vivienda',
        'Considerar home staging básico'
      ];
    } else {
      recommendation = 'minimal_refresh';
      title = 'Puesta a punto mínima';
      description = 'Conviene hacer pequeños arreglos antes de vender.';
      reasoning = [
        'Urgencia de venta',
        'Estado técnico mejorable',
        'Pequeña inversión puede mejorar percepción'
      ];
      considerations = [
        'Pintura general puede mejorar mucho la imagen',
        'Reparar desperfectos visibles',
        'No embarcarse en reformas mayores'
      ];
      nextSteps = [
        'Identificar arreglos prioritarios',
        'Presupuestar puesta a punto básica',
        'Valorar coste vs beneficio'
      ];
    }
  }
  
  // Corto plazo (6-12 meses)
  else if (timeHorizon === 'short_term') {
    if (currentReformLevel === 'recent' || technicalScore >= 75) {
      recommendation = 'sell_as_is';
      title = 'Vender sin reformar';
      description = 'La vivienda está en condiciones competitivas.';
      reasoning = [
        'Estado actual competitivo',
        'Reforma reciente o buen mantenimiento',
        'El mercado valorará el estado actual'
      ];
    } else if (technicalScore >= 50) {
      recommendation = 'minimal_refresh';
      title = 'Actualización selectiva';
      description = 'Algunas mejoras puntuales pueden aumentar el atractivo.';
      reasoning = [
        'Tiempo suficiente para mejoras menores',
        'Estado general aceptable',
        'Mejoras cosméticas tienen buen retorno'
      ];
      considerations = [
        'Baños y cocina son lo que más valoran los compradores',
        'Pintura y suelos tienen buena relación coste/impacto',
        'No sobredimensionar la inversión'
      ];
      nextSteps = [
        'Solicitar valoración actual y potencial',
        'Identificar puntos débiles visibles',
        'Presupuestar mejoras prioritarias'
      ];
    } else {
      recommendation = 'needs_assessment';
      title = 'Requiere valoración técnica';
      description = 'Es necesario evaluar si compensa reformar antes de vender.';
      reasoning = [
        'Estado técnico bajo',
        'Decisión compleja que requiere análisis',
        'Depende del mercado local y tipo de comprador'
      ];
      nextSteps = [
        'Solicitar Diagnóstico 360º',
        'Analizar coste de reforma vs incremento de valor',
        'Estudiar perfil de compradores en la zona'
      ];
    }
  }
  
  // Medio plazo (1-3 años)
  else if (timeHorizon === 'medium_term') {
    if (technicalScore < 50 || currentReformLevel === 'none') {
      recommendation = 'partial_reform';
      title = 'Reforma parcial planificada';
      description = 'Tienes tiempo para reformar estratégicamente.';
      reasoning = [
        'Horizonte temporal permite planificar',
        'La vivienda necesita actualización',
        'Reforma parcial puede ser más rentable que integral'
      ];
      considerations = [
        'Priorizar baños y cocina si están obsoletos',
        'Mejoras de eficiencia energética muy valoradas',
        'Reformar por fases si el presupuesto es limitado'
      ];
      nextSteps = [
        'Solicitar Diagnóstico 360º',
        'Planificar fases de reforma',
        'Presupuestar con margen temporal'
      ];
    } else {
      recommendation = 'hold_and_maintain';
      title = 'Mantener y mejorar gradualmente';
      description = 'Buen estado actual, mantener y considerar mejoras puntuales.';
      reasoning = [
        'Estado técnico aceptable',
        'No hay urgencia',
        'Mejoras pueden hacerse según presupuesto'
      ];
      considerations = [
        'Eficiencia energética siempre suma',
        'Mantenimiento preventivo protege el valor',
        'Documentar mejoras realizadas'
      ];
      nextSteps = [
        'Completar mantenimientos pendientes',
        'Valorar mejoras de aislamiento',
        'Revisar el estado anualmente'
      ];
    }
  }
  
  // Largo plazo (3+ años)
  else if (timeHorizon === 'long_term') {
    if (technicalScore < 40 || propertyAge > 35) {
      recommendation = 'full_reform';
      title = 'Valorar reforma integral';
      description = 'Con tiempo suficiente, una reforma integral puede ser estratégica.';
      reasoning = [
        'Horizonte temporal amplio',
        'Vivienda antigua o con bajo score técnico',
        'Reforma integral maximiza valor futuro'
      ];
      considerations = [
        'Analizar coste total vs valor resultante',
        'Planificar reforma por fases si es necesario',
        'Considerar eficiencia energética desde el diseño'
      ];
      nextSteps = [
        'Solicitar Diagnóstico 360º completo',
        'Estudio de viabilidad económica',
        'Planificación a largo plazo'
      ];
    } else {
      recommendation = 'hold_and_maintain';
      title = 'Mantener valor a largo plazo';
      description = 'Con buen mantenimiento, la vivienda mantendrá su valor.';
      reasoning = [
        'Estado actual aceptable',
        'Largo plazo permite planificar',
        'Mantenimiento es la mejor inversión'
      ];
      nextSteps = [
        'Establecer rutina de mantenimiento',
        'Planificar mejoras graduales',
        'Revisar estrategia periódicamente'
      ];
    }
  }
  
  // Por defecto si no hay horizonte definido
  else {
    recommendation = 'needs_assessment';
    title = 'Análisis personalizado necesario';
    description = 'Para darte una orientación adecuada necesitamos más información.';
    reasoning = [
      'Cada vivienda y situación es única',
      'El mercado local influye en la decisión',
      'Tu situación personal es determinante'
    ];
    nextSteps = [
      'Definir tu horizonte temporal',
      'Solicitar Diagnóstico 360º',
      'Reunión con Samuel para estrategia personalizada'
    ];
  }
  
  return {
    recommendation: recommendation!,
    title: title!,
    description: description!,
    reasoning: reasoning.length ? reasoning : ['Valoración basada en datos proporcionados'],
    considerations: considerations.length ? considerations : ['Cada caso requiere análisis individualizado'],
    nextSteps: nextSteps.length ? nextSteps : ['Solicitar valoración personalizada'],
    disclaimer: getStandardDisclaimer()
  };
}

function getStandardDisclaimer(): string {
  return `Esta orientación es meramente informativa y no constituye una valoración oficial ni 
asesoramiento inmobiliario profesional. La decisión final debe basarse en una valoración 
técnica presencial y en el análisis del mercado local. Más Urba no realiza valoraciones 
oficiales ni intermediación inmobiliaria.`;
}

// Calcular score técnico basado en instalaciones y mantenimientos
export function calculateTechnicalScore(
  installations: Array<{ is_updated: number; perceived_state: string; type: string }>,
  maintenances: Array<{ status: string; category: string }>,
  propertyAge: number,
  lastIntegralReform?: number
): number {
  let score = 50; // Base
  
  // Ajuste por edad (máx -20 puntos)
  if (propertyAge > 40) score -= 20;
  else if (propertyAge > 30) score -= 15;
  else if (propertyAge > 20) score -= 10;
  else if (propertyAge > 10) score -= 5;
  
  // Ajuste por reforma integral reciente (máx +25 puntos)
  if (lastIntegralReform) {
    const yearsAgo = new Date().getFullYear() - lastIntegralReform;
    if (yearsAgo <= 5) score += 25;
    else if (yearsAgo <= 10) score += 15;
    else if (yearsAgo <= 15) score += 5;
  }
  
  // Ajuste por instalaciones (máx +/-25 puntos)
  for (const inst of installations) {
    if (inst.is_updated) score += 3;
    switch (inst.perceived_state) {
      case 'excellent': score += 3; break;
      case 'good': score += 1; break;
      case 'regular': break;
      case 'needs_attention': score -= 3; break;
    }
  }
  
  // Ajuste por mantenimientos (máx +/-15 puntos)
  for (const maint of maintenances) {
    switch (maint.status) {
      case 'checked': score += 1; break;
      case 'repaired': score += 2; break;
      case 'needs_repair': score -= 3; break;
      case 'pending': score -= 1; break;
    }
  }
  
  // Limitar entre 0 y 100
  return Math.max(0, Math.min(100, score));
}

// Obtener etiqueta de score
export function getScoreLabel(score: number): { label: string; color: string; description: string } {
  if (score >= 80) {
    return {
      label: 'Excelente',
      color: 'green',
      description: 'La vivienda está en muy buen estado técnico'
    };
  } else if (score >= 60) {
    return {
      label: 'Bueno',
      color: 'blue',
      description: 'Estado general satisfactorio, mantenimiento al día'
    };
  } else if (score >= 40) {
    return {
      label: 'Regular',
      color: 'yellow',
      description: 'Algunos aspectos podrían mejorarse'
    };
  } else {
    return {
      label: 'Requiere atención',
      color: 'red',
      description: 'Conviene revisar varios aspectos de la vivienda'
    };
  }
}
