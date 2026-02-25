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

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
    <meta name="description" content="Más Urba - Control y Estrategia de Vivienda para propietarios de chalets en Valdemorillo">
    <meta name="theme-color" content="#1e3a5f">
    <title>Más Urba - Control y Estrategia de Vivienda</title>
    
    <!-- PWA -->
    <link rel="manifest" href="/static/manifest.json">
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
    <link rel="apple-touch-icon" href="/static/icon-192.png">
    
    <!-- Estilos -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'urba': {
                50: '#f0f4f8',
                100: '#d9e2ec',
                200: '#bcccdc',
                300: '#9fb3c8',
                400: '#829ab1',
                500: '#627d98',
                600: '#486581',
                700: '#334e68',
                800: '#243b53',
                900: '#1e3a5f',
              },
              'accent': {
                light: '#c9a227',
                DEFAULT: '#b8860b',
                dark: '#8b6914'
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
        min-height: 400px;
      }
      
      .message-bubble {
        max-width: 85%;
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
        border-top: 3px solid #1e3a5f;
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
    </style>
</head>
<body class="bg-urba-50 min-h-screen">
    <div id="app">
        <!-- Loading inicial -->
        <div id="loading-screen" class="fixed inset-0 bg-urba-900 flex items-center justify-center z-50">
            <div class="text-center">
                <div class="w-16 h-16 border-4 border-urba-100 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <h1 class="text-2xl font-semibold text-white">Más Urba</h1>
                <p class="text-urba-300 mt-2">Cargando...</p>
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
