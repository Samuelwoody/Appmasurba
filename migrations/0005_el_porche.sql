-- =============================================
-- EL PORCHE - Muro social vecinal
-- =============================================

-- Tabla de posts
CREATE TABLE IF NOT EXISTS porche_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, recommendation, sale, alert, event
  images TEXT, -- JSON array de URLs base64
  is_pinned INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  likes_count INTEGER DEFAULT 0,
  hearts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS porche_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES porche_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de reacciones (likes y corazones)
CREATE TABLE IF NOT EXISTS porche_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL, -- 'like' o 'heart'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES porche_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(post_id, user_id, reaction_type) -- Un usuario solo puede dar un like y un corazón por post
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_porche_posts_user ON porche_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_porche_posts_category ON porche_posts(category);
CREATE INDEX IF NOT EXISTS idx_porche_posts_created ON porche_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_porche_comments_post ON porche_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_porche_reactions_post ON porche_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_porche_reactions_user ON porche_reactions(user_id);

-- Posts de ejemplo para demo
INSERT OR IGNORE INTO porche_posts (id, user_id, content, category, likes_count, hearts_count, comments_count) VALUES
(1, 2, '¡Hola vecinos! 👋 Acabo de instalar placas solares en mi chalet y estoy encantada. Si alguien está pensando en hacerlo, preguntadme lo que queráis. El ahorro en la factura es notable.', 'recommendation', 5, 3, 2),
(2, 2, '⚠️ AVISO: Mañana cortarán el agua en Cerro Alarcón de 10:00 a 14:00 por mantenimiento de la red. Aprovechad para llenar cubos por si acaso.', 'alert', 8, 0, 1),
(3, 2, '🌳 ¿Alguien conoce un buen servicio de poda de árboles? Tengo unos pinos que se han descontrolado y necesito que los recorten antes del verano.', 'general', 2, 1, 3);

-- Comentarios de ejemplo
INSERT OR IGNORE INTO porche_comments (id, post_id, user_id, content) VALUES
(1, 1, 2, '¿Cuánto te costó la instalación más o menos?'),
(2, 1, 2, 'Yo también estoy pensando en ponerlas. ¿Qué marca elegiste?'),
(3, 2, 2, 'Gracias por el aviso, ¡muy útil!'),
(4, 3, 2, 'Yo uso a Jardines del Valle, son muy profesionales.'),
(5, 3, 2, 'Te paso el contacto por privado'),
(6, 3, 2, '+1 a Jardines del Valle, hicieron un trabajo genial en mi casa');
