# Urbanizaciones de Valdemorillo

**Control y estrategia en Mantenimiento, reforma y compraventa de chalets**

Por **Más Urba Multiservicios**

---

## 📱 Vista General

PWA (Progressive Web App) diseñada para propietarios de chalets en las urbanizaciones de Valdemorillo (Madrid). Permite control técnico básico de la vivienda, acceso al asistente IA "Chari", registro de mantenimientos, estimaciones de reforma y asesoramiento estratégico.

### 🔗 URLs

- **Producción**: https://urbanizaciones-valdemorillo.pages.dev
- **Sandbox/Demo**: https://3000-i4dn5f0sazre04l9uxj55-cc2fbc16.sandbox.novita.ai

### 👤 Credenciales Demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Cliente | cliente@demo.es | demo123 |
| Admin (Samuel Castellano) | samuel@masurba.es | admin123 |

---

## ✅ Funcionalidades Implementadas

### Panel Cliente (Dashboard)
- Estado técnico general de la vivienda (puntuación 0-100)
- Mantenimientos pendientes
- Acceso rápido a Chari
- Botón "Solicitar revisión con Samuel"

### Mi Vivienda
- Datos configurables: año construcción, urbanización, tipo, m², última reforma
- Estado de 6 instalaciones: electricidad, fontanería, calefacción, aislamiento, cubierta, fachada
- Indicador de salud técnica (no alarmista)
- **NUEVO: Subida de fotos/vídeos de la vivienda**

### Control de Mantenimiento
- Checklist de 8 categorías: cubierta, electricidad, fontanería, caldera, fachada, aislamiento, piscina, jardín
- Estados: Pendiente, Revisado, Necesita reparación, Reparado
- Historial de acciones
- Frecuencias de revisión recomendadas
- **NUEVO: Subida de fotos/vídeos por categoría**

### Estimaciones Orientativas
- 14 tipos de intervención
- 3 niveles de acabado: básico, medio, premium
- Rangos de precio consistentes con mercado de Valdemorillo
- Variables que afectan al precio
- Disclaimer (no es presupuesto final)

### Valoración Estratégica
- Inputs: intención de venta, horizonte temporal, nivel de reforma actual
- Outputs: recomendación estratégica (reformar antes, vender como está, reforma parcial)
- Sin valoración oficial

### Chari - Asistente IA 🤖
- **Integración con Deepseek** para respuestas naturales e inteligentes
- Memoria persistente por usuario
- Clasifica tipo de proyecto: pequeño/medio/integral
- Da rangos orientativos de precios
- Explica variables técnicas
- Ofrece contacto con Samuel (máximo 1 vez por conversación)
- **Nunca revela que es IA**
- Fallback a sistema de reglas si no hay API key
- **NUEVO: Análisis de imágenes con GPT-4o Vision**
- **NUEVO: Generación de imágenes con DALL-E 3** (visualización de reformas)

### Panel Admin (Samuel)
- Dashboard con métricas globales
- Lista de todos los clientes
- Vista detallada de cada cliente
- Etiquetas: reforma parcial/integral, venta potencial, premium, educable
- Gestión de solicitudes de contacto

### Sistema de Solicitudes de Contacto 🆕
- **Botón "Solicitar revisión con Samuel"** en dashboard cliente
- **WhatsApp automático a Samuel** con datos completos del cliente:
  - Nombre del usuario
  - Teléfono de contacto
  - Email
  - Vivienda (nombre, urbanización, dirección)
  - Tipo de solicitud (Diagnóstico 360º, Consulta, Post-obra, Otro)
  - Notas adicionales
- **Badge/Notificación en el icono de la app** (PWA Badge API)
- **Panel en admin dashboard** con solicitudes pendientes
- **Contador visual** en el logo para admin
- **Botón WhatsApp** para contactar al cliente desde admin
- **Botón "Atendido"** para marcar como completada
- **Recordatorio automático** creado en sistema para seguimiento

### El Porche - Muro Social Vecinal 🏡 (NUEVO)
- **Muro tipo Facebook** para comunicación entre vecinos
- **5 categorías de posts:**
  - 💬 General - Conversaciones generales
  - ⭐ Recomendación - Compartir proveedores/servicios
  - 🏷️ Venta/Compra - Compraventa entre vecinos
  - ⚠️ Aviso - Alertas e incidencias
  - 🎉 Evento - Organizar quedadas/actividades
- **Subida de hasta 4 imágenes** por publicación
- **Sistema de reacciones:** Like (👍) y Corazón (❤️)
- **Comentarios** en cada publicación
- **Filtrado por categoría**
- **Paginación infinita** con "Cargar más"
- **Visualizador de imágenes** a pantalla completa
- **Información del autor:** nombre y urbanización

---

## 🏗️ Arquitectura Técnica

### Stack
| Capa | Tecnología |
|------|------------|
| Frontend | HTML5 + TailwindCSS (CDN) + JavaScript vanilla |
| Backend | Hono (TypeScript) en Cloudflare Workers |
| Base de datos | Cloudflare D1 (SQLite distribuido) |
| Autenticación | JWT + hash SHA-256 |
| IA Chat | Deepseek API (deepseek-chat) |
| IA Imágenes | OpenAI (GPT-4o Vision + DALL-E 3) |
| PWA | Service Worker + Web App Manifest |
| Hosting | Cloudflare Pages |

### Estructura de Archivos
```
webapp/
├── src/
│   ├── index.tsx         # Entry point + HTML principal
│   ├── routes/           # API endpoints
│   │   ├── auth.ts       # Login/verificación
│   │   ├── dashboard.ts  # Panel cliente
│   │   ├── properties.ts # Mi vivienda
│   │   ├── maintenances.ts # Control mantenimiento
│   │   ├── estimates.ts  # Estimaciones
│   │   ├── strategic.ts  # Valoración estratégica
│   │   ├── chari.ts      # Asistente IA
│   │   ├── contacts.ts   # Solicitudes contacto
│   │   ├── admin.ts      # Panel administrador
│   │   ├── media.ts      # Gestión de fotos/vídeos
│   │   ├── images.ts     # Generación/análisis imágenes
│   │   └── porche.ts     # El Porche (muro social)
│   ├── lib/
│   │   ├── auth.ts       # Utilidades JWT
│   │   ├── chari.ts      # Lógica reglas (fallback)
│   │   ├── deepseek.ts   # Cliente API Deepseek
│   │   ├── openai-images.ts # Cliente OpenAI (imágenes)
│   │   ├── estimates.ts  # Cálculos estimaciones
│   │   └── strategic.ts  # Lógica estratégica
│   ├── middleware/
│   │   └── auth.ts       # Middleware autenticación
│   └── types/
│       └── index.ts      # TypeScript types
├── public/static/
│   ├── app.js            # Frontend JavaScript
│   ├── logo.png          # Logo Más Urba Multiservicios
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_seed_data.sql
│   ├── 0003_admin_features.sql
│   └── 0003_media_storage.sql
├── wrangler.jsonc        # Config Cloudflare
└── ecosystem.config.cjs  # PM2 config
```

### API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/login | Autenticación |
| GET | /api/auth/verify | Verificar token |
| GET | /api/dashboard | Panel cliente |
| GET/PUT | /api/properties | Datos vivienda |
| GET/PUT | /api/maintenances | Mantenimientos |
| POST | /api/estimates/calculate | Calcular estimación |
| POST | /api/strategic | Valoración estratégica |
| GET | /api/chari/conversation | Obtener/crear conversación |
| POST | /api/chari/message | Enviar mensaje a Chari |
| GET | /api/chari/status | Estado IA (Deepseek/reglas) |
| POST | /api/contacts | Solicitar contacto |
| GET | /api/contacts/pending-count | Contador para badge |
| GET | /api/admin/dashboard | [Admin] Dashboard con stats |
| GET | /api/admin/clients | [Admin] Lista clientes |
| GET | /api/admin/clients/:id | [Admin] Detalle cliente |
| PUT | /api/admin/contact-requests/:id | [Admin] Actualizar solicitud |
| GET | /api/admin/contact-requests | [Admin] Listar solicitudes |
| **NUEVO** | | |
| GET | /api/media/all | Todos los medios del usuario |
| GET | /api/media/property | Medios de vivienda |
| POST | /api/media/property | Subir foto/vídeo de vivienda |
| GET | /api/media/maintenance | Medios de mantenimiento |
| POST | /api/media/maintenance | Subir foto/vídeo de mantenimiento |
| DELETE | /api/media/property/:id | Eliminar medio de vivienda |
| DELETE | /api/media/maintenance/:id | Eliminar medio de mantenimiento |
| POST | /api/images/analyze | Analizar imagen con GPT-4o |
| POST | /api/images/generate | Generar imagen con DALL-E 3 |
| POST | /api/images/chari-analyze | Análisis de imagen para Chari |
| **EL PORCHE** | | |
| GET | /api/porche/posts | Obtener feed de posts |
| GET | /api/porche/posts/:id | Obtener post con comentarios |
| POST | /api/porche/posts | Crear nuevo post |
| PUT | /api/porche/posts/:id | Editar post |
| DELETE | /api/porche/posts/:id | Eliminar post |
| POST | /api/porche/posts/:id/react | Toggle like/heart |
| GET | /api/porche/posts/:id/comments | Obtener comentarios |
| POST | /api/porche/posts/:id/comments | Añadir comentario |
| DELETE | /api/porche/comments/:id | Eliminar comentario |
| GET | /api/porche/categories | Categorías disponibles |

---

## 🔐 Configuración APIs

### Deepseek (Chat IA)
```bash
# Producción
npx wrangler secret put DEEPSEEK_API_KEY --project-name urbanizaciones-valdemorillo

# Desarrollo local (.dev.vars)
DEEPSEEK_API_KEY=tu_api_key
```
- Coste: ~$0.14/M tokens input

### OpenAI (Imágenes)
```bash
# Producción
npx wrangler secret put OPENAI_API_KEY --project-name urbanizaciones-valdemorillo

# Desarrollo local (.dev.vars)
OPENAI_API_KEY=tu_api_key
```
- Análisis GPT-4o: ~$0.01/imagen
- Generación DALL-E 3: ~$0.04/imagen

---

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Compilar
npm run build

# Reset base de datos (si es necesario)
npm run db:reset

# Iniciar servidor (PM2)
pm2 start ecosystem.config.cjs

# Ver logs
pm2 logs --nostream
```

---

## 📦 Despliegue a Producción

```bash
# 1. Compilar
npm run build

# 2. Desplegar
npx wrangler pages deploy dist --project-name urbanizaciones-valdemorillo
```

---

## 📈 Próximas Funcionalidades

- [ ] Integración WhatsApp Business API (envío automático sin abrir navegador)
- [ ] Migración de almacenamiento a Cloudflare R2
- [ ] Notificaciones push nativas
- [ ] Exportar informes en PDF
- [ ] Calendario de mantenimientos
- [ ] Múltiples propiedades por usuario
- [x] ~~Subida de fotos a la vivienda~~ ✅
- [x] ~~Análisis de imágenes con IA~~ ✅
- [x] ~~Generación de visualizaciones con DALL-E~~ ✅
- [x] ~~WhatsApp automático al solicitar revisión~~ ✅
- [x] ~~Badge/notificación en icono de app~~ ✅
- [x] ~~Panel admin de solicitudes pendientes~~ ✅

---

## 📄 Licencia

Proyecto privado de **Más Urba Multiservicios**.

© 2024-2026 Más Urba Multiservicios - Urbanizaciones de Valdemorillo, Madrid
