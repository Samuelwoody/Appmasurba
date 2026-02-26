-- Añadir nuevo tipo de solicitud: professional_study
-- SQLite no permite ALTER TABLE para modificar CHECK constraints
-- Por lo que necesitamos recrear la tabla

-- Paso 1: Crear tabla temporal sin constraint
CREATE TABLE contact_requests_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('diagnosis_360', 'consultation', 'post_work', 'other', 'professional_study')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  notes TEXT,
  scheduled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  admin_notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Paso 2: Copiar datos existentes
INSERT INTO contact_requests_new SELECT * FROM contact_requests;

-- Paso 3: Eliminar tabla original
DROP TABLE contact_requests;

-- Paso 4: Renombrar nueva tabla
ALTER TABLE contact_requests_new RENAME TO contact_requests;

-- Paso 5: Recrear índice
CREATE INDEX IF NOT EXISTS idx_contact_requests_user ON contact_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
