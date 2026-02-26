import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/cloudflare-pages';
import type { Bindings } from './types';

// Importar rutas
import auth from './routes/auth';
import dashboard from './routes/dashboard';
import properties from './routes/properties';
import maintenances from './routes/maintenances';
import estimates from './routes/estimates';
import strategic from './routes/strategic';
import chari from './routes/chari';
import contacts from './routes/contacts';
import admin from './routes/admin';
import images from './routes/images';
import media from './routes/media';
import porche from './routes/porche';
import inmourba from './routes/inmourba';
import mercadillo from './routes/mercadillo';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware global
app.use('*', logger());
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true
}));

// Archivos estáticos
app.use('/static/*', serveStatic());

// Montar rutas API
app.route('/api/auth', auth);
app.route('/api/dashboard', dashboard);
app.route('/api/properties', properties);
app.route('/api/maintenances', maintenances);
app.route('/api/estimates', estimates);
app.route('/api/strategic', strategic);
app.route('/api/chari', chari);
app.route('/api/contacts', contacts);
app.route('/api/admin', admin);
app.route('/api/images', images);
app.route('/api/media', media);
app.route('/api/porche', porche);
app.route('/api/inmourba', inmourba);
app.route('/api/mercadillo', mercadillo);

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Página principal - SPA
app.get('*', (c) => {
  return c.html(getMainHTML());
});

function getMainHTML(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Urbanizaciones de Valdemorillo - Control y estrategia en mantenimiento, reforma y compraventa de chalets. Por Más Urba Multiservicios.">
    <meta name="theme-color" content="#7dd3a8">
    <title>Urbanizaciones de Valdemorillo | Más Urba Multiservicios</title>
    
    <!-- PWA -->
    <link rel="manifest" href="/static/manifest.json">
    <link rel="icon" type="image/x-icon" href="/static/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png">
    
    <!-- Estilos -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'urba': {
                50: '#faf5f7',
                100: '#f5ebef',
                200: '#ebdae1',
                300: '#dcc2cd',
                400: '#c9a0b0',
                500: '#b47d94',
                600: '#9c6178',
                700: '#834d62',
                800: '#6d4152',
                900: '#5c3946',
              },
              'gradient': {
                pink: '#e88ba5',
                green: '#7dd3a8',
                cyan: '#7dd3d3',
                blue: '#a5d4e8'
              },
              'accent': {
                light: '#7dd3a8',
                DEFAULT: '#5bb88a',
                dark: '#4a9c74'
              }
            }
          }
        }
      }
    </script>
    
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        font-family: 'Inter', sans-serif;
      }
      
      .gradient-bg {
        background: linear-gradient(135deg, #e88ba5 0%, #7dd3a8 50%, #7dd3d3 100%);
      }
      
      .gradient-text {
        background: linear-gradient(135deg, #e88ba5 0%, #7dd3a8 50%, #7dd3d3 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .score-ring {
        transform: rotate(-90deg);
      }
      
      .chat-container {
        height: calc(100vh - 280px);
        min-height: 300px;
        max-height: 60vh;
      }
      
      /* Mobile optimizations */
      @media (max-width: 640px) {
        .chat-container {
          height: calc(100vh - 320px);
          min-height: 200px;
          max-height: 50vh;
        }
        
        /* Chat form mobile */
        .chat-form-mobile {
          padding: 12px !important;
        }
        
        .chat-form-mobile input {
          padding: 10px 12px !important;
          font-size: 16px !important; /* Evita zoom en iOS */
        }
        
        .chat-form-mobile button {
          padding: 10px 14px !important;
        }
        
        /* Navigation mobile */
        .nav-mobile-scroll {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        
        .nav-mobile-scroll::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar utility */
        .hide-scrollbar {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Header compacto en móvil */
        .header-mobile {
          padding-top: 8px !important;
          padding-bottom: 8px !important;
        }
        
        /* Botones de acción rápida más pequeños */
        .quick-action-mobile {
          padding: 8px !important;
          font-size: 12px !important;
        }
        
        /* Footer más compacto en móvil */
        footer {
          padding-top: 16px !important;
          padding-bottom: 16px !important;
          margin-top: 24px !important;
        }
      }
      
      .message-bubble {
        max-width: 85%;
      }
      
      @media (max-width: 640px) {
        .message-bubble {
          max-width: 90%;
        }
      }
      
      /* Scrollbar personalizado */
      ::-webkit-scrollbar {
        width: 6px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
      }
      
      /* Loading spinner */
      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #5bb88a;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Estado de carga */
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .header-gradient {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
      }
      
      /* Botón WhatsApp flotante */
      .whatsapp-btn {
        background: #25D366;
        transition: all 0.3s ease;
      }
      
      .whatsapp-btn:hover {
        background: #128C7E;
        transform: scale(1.05);
      }
      
      .whatsapp-popup {
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
</head>
<body class="bg-white min-h-screen">
    <div id="app">
        <!-- Loading inicial -->
        <div id="loading-screen" class="fixed inset-0 bg-white flex items-center justify-center z-50">
            <div class="text-center">
                <img src="/static/logo.png" alt="Más Urba Multiservicios" class="w-24 h-24 mx-auto mb-4 animate-pulse">
                <h1 class="text-xl font-semibold text-gray-800">Urbanizaciones de Valdemorillo</h1>
                <p class="text-gray-500 mt-2 text-sm">Cargando...</p>
            </div>
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    
    <!-- Registro del Service Worker -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/static/sw.js')
            .then(reg => console.log('SW registrado'))
            .catch(err => console.log('SW error:', err));
        });
      }
    </script>
</body>
</html>`;
}

export default app;
