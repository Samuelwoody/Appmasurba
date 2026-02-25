// Tipos para Cloudflare Bindings
export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

// Usuario
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  role: 'client' | 'admin';
  created_at: string;
  last_login?: string;
  is_active: number;
}

export interface UserPublic {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'client' | 'admin';
  created_at: string;
  last_login?: string;
}

// Vivienda
export interface Property {
  id: number;
  user_id: number;
  name: string;
  year_built?: number;
  urbanization?: string;
  property_type?: string;
  address?: string;
  square_meters?: number;
  last_integral_reform?: number;
  technical_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Instalación
export type InstallationType = 'electricity' | 'plumbing' | 'heating' | 'insulation' | 'roof' | 'facade';
export type PerceivedState = 'excellent' | 'good' | 'regular' | 'needs_attention';

export interface Installation {
  id: number;
  property_id: number;
  type: InstallationType;
  is_updated: number;
  year_updated?: number;
  perceived_state: PerceivedState;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Mantenimiento
export type MaintenanceCategory = 'roof' | 'electricity' | 'plumbing' | 'boiler' | 'facade' | 'insulation' | 'pool' | 'garden' | 'other';
export type MaintenanceStatus = 'pending' | 'checked' | 'needs_repair' | 'repaired';

export interface Maintenance {
  id: number;
  property_id: number;
  category: MaintenanceCategory;
  status: MaintenanceStatus;
  last_checked?: string;
  next_recommended?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePhoto {
  id: number;
  maintenance_id: number;
  photo_url: string;
  description?: string;
  created_at: string;
}

// Conversación
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  messages: Message[];
  intent_classification?: string;
  samuel_contact_offered: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Memoria de Chari
export interface ChariMemory {
  id: number;
  user_id: number;
  context: Record<string, any>;
  preferences: Record<string, any>;
  interaction_count: number;
  last_topics: string[];
  created_at: string;
  updated_at: string;
}

// Estimación
export type FinishLevel = 'basic' | 'medium' | 'premium';

export interface Estimate {
  id: number;
  user_id: number;
  property_id?: number;
  intervention_type: string;
  square_meters?: number;
  finish_level: FinishLevel;
  range_min?: number;
  range_max?: number;
  variables_json: Record<string, any>;
  notes?: string;
  created_at: string;
}

// Valoración Estratégica
export type TimeHorizon = 'immediate' | 'short_term' | 'medium_term' | 'long_term';
export type ReformLevel = 'none' | 'partial' | 'integral' | 'recent';

export interface StrategicAssessment {
  id: number;
  user_id: number;
  property_id?: number;
  wants_to_sell: number;
  time_horizon?: TimeHorizon;
  current_reform_level?: ReformLevel;
  recommendation?: string;
  notes?: string;
  created_at: string;
}

// Etiquetas
export type TagName = 'partial_reform' | 'integral_reform' | 'potential_sale' | 'premium_client' | 'educable_client' | 'urgent' | 'vip';

export interface ClientTag {
  id: number;
  user_id: number;
  tag_name: TagName;
  assigned_by?: number;
  notes?: string;
  created_at: string;
}

// Solicitud de contacto
export type RequestType = 'diagnosis_360' | 'consultation' | 'post_work' | 'other';
export type RequestStatus = 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';

export interface ContactRequest {
  id: number;
  user_id: number;
  request_type: RequestType;
  status: RequestStatus;
  notes?: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

// JWT Payload
export interface JWTPayload {
  sub: number;
  email: string;
  role: 'client' | 'admin';
  exp: number;
  iat: number;
}

// API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Stats
export interface DashboardStats {
  property: Property | null;
  installations: Installation[];
  maintenances: Maintenance[];
  pendingMaintenances: number;
  nextMaintenance?: Maintenance;
  technicalScore: number;
  recentEstimates: Estimate[];
  hasActiveConversation: boolean;
}

// Admin Stats
export interface AdminStats {
  totalClients: number;
  clientsByTag: Record<TagName, number>;
  pendingRequests: number;
  recentConversations: number;
  clientsNeedingAttention: UserPublic[];
}
