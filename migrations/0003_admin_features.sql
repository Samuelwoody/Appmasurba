-- =============================================
-- MIGRACIÓN 003: Funcionalidades de Administración
-- Gestión de arrendamientos, ventas y recordatorios
-- =============================================

-- Gestiones de propiedad (arrendamiento/venta)
CREATE TABLE IF NOT EXISTS property_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  management_type TEXT NOT NULL CHECK(management_type IN ('rental', 'sale')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  price DECIMAL(10,2),
  commission DECIMAL(5,2),
  tenant_name TEXT,
  tenant_phone TEXT,
  tenant_email TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Servicios/Trabajos programados
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  service_type TEXT NOT NULL CHECK(service_type IN ('maintenance', 'repair', 'renovation', 'inspection', 'cleaning', 'other')),
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_date DATE,
  completed_date DATE,
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  provider_name TEXT,
  provider_phone TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Recordatorios centralizados
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  property_id INTEGER,
  service_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT DEFAULT 'general' CHECK(reminder_type IN ('maintenance', 'payment', 'renewal', 'inspection', 'general')),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'completed', 'cancelled')),
  notify_admin INTEGER DEFAULT 1,
  notify_user INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Historial de actividades (para auditoría)
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  description TEXT,
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_property_management_property ON property_management(property_id);
CREATE INDEX IF NOT EXISTS idx_property_management_type ON property_management(management_type);
CREATE INDEX IF NOT EXISTS idx_services_property ON services(property_id);
CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
