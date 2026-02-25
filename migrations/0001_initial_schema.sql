-- =============================================
-- MÁS URBA - Schema Inicial
-- Base de datos para control de viviendas
-- =============================================

-- USUARIOS
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'client' CHECK(role IN ('client', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active INTEGER DEFAULT 1
);

-- VIVIENDAS
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT DEFAULT 'Mi Vivienda',
    year_built INTEGER,
    urbanization TEXT,
    property_type TEXT,
    address TEXT,
    square_meters INTEGER,
    last_integral_reform INTEGER,
    technical_score INTEGER DEFAULT 50,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- INSTALACIONES DE LA VIVIENDA
CREATE TABLE IF NOT EXISTS installations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('electricity', 'plumbing', 'heating', 'insulation', 'roof', 'facade')),
    is_updated INTEGER DEFAULT 0,
    year_updated INTEGER,
    perceived_state TEXT DEFAULT 'regular' CHECK(perceived_state IN ('excellent', 'good', 'regular', 'needs_attention')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- MANTENIMIENTOS
CREATE TABLE IF NOT EXISTS maintenances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('roof', 'electricity', 'plumbing', 'boiler', 'facade', 'insulation', 'pool', 'garden', 'other')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'checked', 'needs_repair', 'repaired')),
    last_checked DATETIME,
    next_recommended DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- FOTOS DE MANTENIMIENTO
CREATE TABLE IF NOT EXISTS maintenance_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maintenance_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_id) REFERENCES maintenances(id) ON DELETE CASCADE
);

-- HISTORIAL DE MANTENIMIENTO
CREATE TABLE IF NOT EXISTS maintenance_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maintenance_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    notes TEXT,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    performed_by INTEGER,
    FOREIGN KEY (maintenance_id) REFERENCES maintenances(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- CONVERSACIONES CON CHARI
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT DEFAULT 'Conversación',
    messages TEXT DEFAULT '[]',
    intent_classification TEXT,
    samuel_contact_offered INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MEMORIA DE CHARI POR USUARIO
CREATE TABLE IF NOT EXISTS chari_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    context TEXT DEFAULT '{}',
    preferences TEXT DEFAULT '{}',
    interaction_count INTEGER DEFAULT 0,
    last_topics TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ESTIMACIONES GUARDADAS
CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_id INTEGER,
    intervention_type TEXT NOT NULL,
    square_meters REAL,
    finish_level TEXT DEFAULT 'medium' CHECK(finish_level IN ('basic', 'medium', 'premium')),
    range_min REAL,
    range_max REAL,
    variables_json TEXT DEFAULT '{}',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- VALORACIÓN ESTRATÉGICA
CREATE TABLE IF NOT EXISTS strategic_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_id INTEGER,
    wants_to_sell INTEGER DEFAULT 0,
    time_horizon TEXT CHECK(time_horizon IN ('immediate', 'short_term', 'medium_term', 'long_term')),
    current_reform_level TEXT CHECK(current_reform_level IN ('none', 'partial', 'integral', 'recent')),
    recommendation TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- ETIQUETAS DE CLIENTE (Para Admin)
CREATE TABLE IF NOT EXISTS client_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL CHECK(tag_name IN ('partial_reform', 'integral_reform', 'potential_sale', 'premium_client', 'educable_client', 'urgent', 'vip')),
    assigned_by INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- SOLICITUDES DE CONTACTO
CREATE TABLE IF NOT EXISTS contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    request_type TEXT NOT NULL CHECK(request_type IN ('diagnosis_360', 'consultation', 'post_work', 'other')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
    notes TEXT,
    scheduled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SESIONES (para JWT refresh)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_property ON maintenances(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_category ON maintenances(category);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_user ON client_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_user ON contact_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
