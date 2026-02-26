// Lógica de estimaciones orientativas para reformas
// Basado en precios de mercado zona Valdemorillo 2024-2025

export type InterventionType = 
  | 'bathroom_small'
  | 'bathroom_complete'
  | 'kitchen'
  | 'flooring'
  | 'roof'
  | 'facade'
  | 'insulation_windows'
  | 'insulation_walls'
  | 'electricity'
  | 'plumbing'
  | 'heating'
  | 'pool'
  | 'integral_partial'
  | 'integral_complete';

export type FinishLevel = 'basic' | 'medium' | 'premium';

interface PriceRange {
  min: number;
  max: number;
  unit: 'total' | 'm2' | 'unit';
}

interface InterventionData {
  name: string;
  description: string;
  prices: Record<FinishLevel, PriceRange>;
  variables: string[];
  notes: string;
}

// Precios orientativos de mercado (€)
const INTERVENTIONS: Record<InterventionType, InterventionData> = {
  bathroom_small: {
    name: 'Baño pequeño (reforma parcial)',
    description: 'Cambio de sanitarios, grifería y alicatado parcial',
    prices: {
      basic: { min: 3500, max: 5500, unit: 'total' },
      medium: { min: 5500, max: 8500, unit: 'total' },
      premium: { min: 8500, max: 14000, unit: 'total' }
    },
    variables: ['Estado actual', 'Accesibilidad', 'Fontanería existente'],
    notes: 'Precio para baño de hasta 5m². Incluye mano de obra e IVA orientativo.'
  },
  bathroom_complete: {
    name: 'Baño completo (reforma integral)',
    description: 'Demolición, nueva distribución, instalaciones completas',
    prices: {
      basic: { min: 6000, max: 9000, unit: 'total' },
      medium: { min: 9000, max: 14000, unit: 'total' },
      premium: { min: 14000, max: 25000, unit: 'total' }
    },
    variables: ['Tamaño', 'Cambio de distribución', 'Calidades elegidas', 'Plato ducha vs bañera'],
    notes: 'Precio para baño estándar 6-8m². Reforma integral con cambio de instalaciones.'
  },
  kitchen: {
    name: 'Cocina',
    description: 'Reforma de cocina con mobiliario y electrodomésticos',
    prices: {
      basic: { min: 8000, max: 12000, unit: 'total' },
      medium: { min: 12000, max: 20000, unit: 'total' },
      premium: { min: 20000, max: 40000, unit: 'total' }
    },
    variables: ['Metros lineales', 'Electrodomésticos', 'Encimera', 'Cambio distribución'],
    notes: 'Cocina de 8-12m². El precio varía mucho según electrodomésticos y encimera elegidos.'
  },
  flooring: {
    name: 'Suelos',
    description: 'Cambio de pavimento',
    prices: {
      basic: { min: 35, max: 55, unit: 'm2' },
      medium: { min: 55, max: 85, unit: 'm2' },
      premium: { min: 85, max: 150, unit: 'm2' }
    },
    variables: ['Tipo material', 'Necesidad de nivelación', 'Retirada suelo existente'],
    notes: 'Incluye material y mano de obra. Básico: laminado. Medio: porcelánico. Premium: madera natural.'
  },
  roof: {
    name: 'Cubierta/Tejado',
    description: 'Reparación o sustitución de cubierta',
    prices: {
      basic: { min: 80, max: 120, unit: 'm2' },
      medium: { min: 120, max: 180, unit: 'm2' },
      premium: { min: 180, max: 280, unit: 'm2' }
    },
    variables: ['Estado actual', 'Tipo de teja', 'Aislamiento', 'Accesibilidad andamio'],
    notes: 'Reparación parcial más económica. Sustitución completa en rango alto.'
  },
  facade: {
    name: 'Fachada',
    description: 'Rehabilitación de fachada',
    prices: {
      basic: { min: 40, max: 70, unit: 'm2' },
      medium: { min: 70, max: 110, unit: 'm2' },
      premium: { min: 110, max: 180, unit: 'm2' }
    },
    variables: ['Estado actual', 'SATE', 'Revestimiento', 'Altura/andamio'],
    notes: 'Básico: limpieza y pintura. Medio: reparaciones + pintura. Premium: SATE completo.'
  },
  insulation_windows: {
    name: 'Aislamiento - Ventanas',
    description: 'Cambio de ventanas por eficiencia energética',
    prices: {
      basic: { min: 350, max: 500, unit: 'unit' },
      medium: { min: 500, max: 800, unit: 'unit' },
      premium: { min: 800, max: 1400, unit: 'unit' }
    },
    variables: ['Tamaño', 'Material (PVC/Aluminio)', 'Tipo vidrio', 'Persiana integrada'],
    notes: 'Precio por ventana estándar 120x120cm. Incluye instalación.'
  },
  insulation_walls: {
    name: 'Aislamiento - Paredes',
    description: 'Aislamiento térmico de muros',
    prices: {
      basic: { min: 30, max: 50, unit: 'm2' },
      medium: { min: 50, max: 80, unit: 'm2' },
      premium: { min: 80, max: 130, unit: 'm2' }
    },
    variables: ['Interior vs exterior', 'Material aislante', 'Espesor'],
    notes: 'Interior más económico pero pierde espacio. Exterior (SATE) más eficaz.'
  },
  electricity: {
    name: 'Instalación eléctrica',
    description: 'Actualización de instalación eléctrica',
    prices: {
      basic: { min: 50, max: 70, unit: 'm2' },
      medium: { min: 70, max: 100, unit: 'm2' },
      premium: { min: 100, max: 150, unit: 'm2' }
    },
    variables: ['Estado actual', 'Puntos de luz', 'Domótica', 'Cuadro eléctrico'],
    notes: 'Por m² de vivienda. Básico: actualización cuadro. Completo: cableado nuevo.'
  },
  plumbing: {
    name: 'Fontanería',
    description: 'Renovación de instalación de agua',
    prices: {
      basic: { min: 40, max: 60, unit: 'm2' },
      medium: { min: 60, max: 90, unit: 'm2' },
      premium: { min: 90, max: 130, unit: 'm2' }
    },
    variables: ['Material (cobre/multicapa)', 'Puntos de agua', 'Estado actual'],
    notes: 'Por m² de vivienda. Incluye agua fría, caliente y desagües principales.'
  },
  heating: {
    name: 'Calefacción',
    description: 'Sistema de calefacción',
    prices: {
      basic: { min: 4000, max: 7000, unit: 'total' },
      medium: { min: 7000, max: 12000, unit: 'total' },
      premium: { min: 12000, max: 25000, unit: 'total' }
    },
    variables: ['Tipo sistema', 'Radiadores/suelo radiante', 'Caldera/aerotermia'],
    notes: 'Vivienda 150-200m². Básico: caldera gas. Premium: aerotermia + suelo radiante.'
  },
  pool: {
    name: 'Piscina',
    description: 'Reforma o construcción de piscina',
    prices: {
      basic: { min: 15000, max: 25000, unit: 'total' },
      medium: { min: 25000, max: 40000, unit: 'total' },
      premium: { min: 40000, max: 80000, unit: 'total' }
    },
    variables: ['Tamaño', 'Reforma vs nueva', 'Equipamiento', 'Acabados'],
    notes: 'Piscina 8x4m aprox. Básico: reforma gresite. Premium: nueva con climatización.'
  },
  integral_partial: {
    name: 'Reforma integral parcial',
    description: 'Reforma de zonas específicas (baños, cocina, suelos)',
    prices: {
      basic: { min: 400, max: 600, unit: 'm2' },
      medium: { min: 600, max: 900, unit: 'm2' },
      premium: { min: 900, max: 1300, unit: 'm2' }
    },
    variables: ['Zonas a reformar', 'Instalaciones', 'Distribución', 'Calidades'],
    notes: 'Por m² reformado. Típicamente 40-60% de la vivienda.'
  },
  integral_complete: {
    name: 'Reforma integral completa',
    description: 'Reforma completa de la vivienda',
    prices: {
      basic: { min: 600, max: 850, unit: 'm2' },
      medium: { min: 850, max: 1200, unit: 'm2' },
      premium: { min: 1200, max: 1800, unit: 'm2' }
    },
    variables: ['Cambio distribución', 'Instalaciones nuevas', 'Calidades', 'Licencias'],
    notes: 'Por m² de vivienda. Incluye todas las instalaciones y acabados.'
  }
};

export interface EstimateResult {
  intervention: InterventionData;
  squareMeters: number;
  finishLevel: FinishLevel;
  rangeMin: number;
  rangeMax: number;
  variables: string[];
  disclaimer: string;
}

export function calculateEstimate(
  interventionType: InterventionType,
  squareMeters: number,
  finishLevel: FinishLevel
): EstimateResult {
  const intervention = INTERVENTIONS[interventionType];
  const priceRange = intervention.prices[finishLevel];
  
  let rangeMin: number;
  let rangeMax: number;
  
  if (priceRange.unit === 'm2') {
    rangeMin = Math.round(priceRange.min * squareMeters);
    rangeMax = Math.round(priceRange.max * squareMeters);
  } else if (priceRange.unit === 'unit') {
    // Para unidades, squareMeters representa cantidad
    rangeMin = Math.round(priceRange.min * squareMeters);
    rangeMax = Math.round(priceRange.max * squareMeters);
  } else {
    rangeMin = priceRange.min;
    rangeMax = priceRange.max;
  }
  
  return {
    intervention,
    squareMeters,
    finishLevel,
    rangeMin,
    rangeMax,
    variables: intervention.variables,
    disclaimer: `Esta estimación es meramente orientativa y no constituye presupuesto. 
El precio final dependerá de una visita técnica presencial que analice las 
condiciones específicas de su vivienda. Los rangos mostrados corresponden a 
precios de mercado en la zona de Valdemorillo para el año 2024-2025.`
  };
}

export function getInterventionTypes(): { value: InterventionType; label: string }[] {
  return Object.entries(INTERVENTIONS).map(([key, data]) => ({
    value: key as InterventionType,
    label: data.name
  }));
}

export function getInterventionData(type: InterventionType): InterventionData {
  return INTERVENTIONS[type];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
