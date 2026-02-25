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

// Medios de la vivienda
export interface PropertyMedia {
  id: number;
  property_id: number;
  user_id: number;
  media_type: 'image' | 'video';
  media_url: string;
  media_base64?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  category: string;
  file_size?: number;
  created_at: string;
}

// Medios de mantenimiento
export interface MaintenanceMedia {
  id: number;
  maintenance_id?: number;
  property_id: number;
  user_id: number;
  category: string;
  media_type: 'image' | 'video';
  media_url: string;
  media_base64?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  file_size?: number;
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

// =============================================
// NUEVOS TIPOS PARA ADMINISTRACIÓN
// =============================================

// Gestión de propiedad (arrendamiento/venta)
export type ManagementType = 'rental' | 'sale';
export type ManagementStatus = 'active' | 'pending' | 'completed' | 'cancelled';

export interface PropertyManagement {
  id: number;
  property_id: number;
  management_type: ManagementType;
  status: ManagementStatus;
  start_date?: string;
  end_date?: string;
  price?: number;
  commission?: number;
  tenant_name?: string;
  tenant_phone?: string;
  tenant_email?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  // Joins
  property?: Property;
  user?: UserPublic;
}

// Servicios/Trabajos
export type ServiceType = 'maintenance' | 'repair' | 'renovation' | 'inspection' | 'cleaning' | 'other';
export type ServiceStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ServicePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Service {
  id: number;
  property_id: number;
  user_id: number;
  service_type: ServiceType;
  category?: string;
  title: string;
  description?: string;
  status: ServiceStatus;
  priority: ServicePriority;
  scheduled_date?: string;
  completed_date?: string;
  estimated_cost?: number;
  final_cost?: number;
  provider_name?: string;
  provider_phone?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  // Joins
  property?: Property;
  user?: UserPublic;
}

// Recordatorios
export type ReminderType = 'maintenance' | 'payment' | 'renewal' | 'inspection' | 'general';
export type ReminderStatus = 'pending' | 'sent' | 'completed' | 'cancelled';

export interface Reminder {
  id: number;
  user_id?: number;
  property_id?: number;
  service_id?: number;
  title: string;
  description?: string;
  reminder_type: ReminderType;
  due_date: string;
  status: ReminderStatus;
  notify_admin: number;
  notify_user: number;
  created_by?: number;
  created_at: string;
  // Joins
  user?: UserPublic;
  property?: Property;
}

// Actividad/Historial
export interface ActivityLog {
  id: number;
  user_id?: number;
  action_type: string;
  entity_type?: string;
  entity_id?: number;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: UserPublic;
}

// Vista completa de vecino para admin
export interface NeighborFullView {
  user: UserPublic;
  property: Property | null;
  installations: Installation[];
  maintenances: Maintenance[];
  services: Service[];
  managements: PropertyManagement[];
  reminders: Reminder[];
  tags: ClientTag[];
  conversations: Conversation[];
  technicalScore: number;
}
