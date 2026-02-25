# Urbanizaciones de Valdemorillo

**Control y estrategia en Mantenimiento, reforma y compraventa de chalets**

Por **Más Urba Multiservicios**

---

## 📱 Vista General

PWA (Progressive Web App) diseñada para propietarios de chalets en las urbanizaciones de Valdemorillo (Madrid). Permite control técnico básico de la vivienda, acceso al asistente IA "Chari", registro de mantenimientos, estimaciones de reforma y asesoramiento estratégico.

### 🔗 URLs

- **Sandbox/Demo**: https://3000-i4dn5f0sazre04l9uxj55-cc2fbc16.sandbox.novita.ai
- **Producción** (pendiente despliegue): urbanizaciones-valdemorillo.pages.dev

### 👤 Credenciales Demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Cliente | cliente@demo.es | demo123 |
| Admin (Samuel) | samuel@masurba.es | admin123 |

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

### Control de Mantenimiento
- Checklist de 8 categorías: cubierta, electricidad, fontanería, caldera, fachada, aislamiento, piscina, jardín
- Estados: Pendiente, Revisado, Necesita reparación, Reparado
- Historial de acciones
- Frecuencias de revisión recomendadas

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

### Panel Admin (Samuel)
- Dashboard con métricas globales
- Lista de todos los clientes
- Vista detallada de cada cliente
- Etiquetas: reforma parcial/integral, venta potencial, premium, educable
- Gestión de solicitudes de contacto

---

## 🏗️ Arquitectura Técnica

### Stack
| Capa | Tecnología |
|------|------------|
| Frontend | HTML5 + TailwindCSS (CDN) + JavaScript vanilla |
| Backend | Hono (TypeScript) en Cloudflare Workers |
| Base de datos | Cloudflare D1 (SQLite distribuido) |
| Autenticación | JWT + hash SHA-256 |
| IA | Deepseek API (deepseek-chat) |
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
│   │   └── admin.ts      # Panel administrador
│   ├── lib/
│   │   ├── auth.ts       # Utilidades JWT
│   │   ├── chari.ts      # Lógica reglas (fallback)
│   │   ├── deepseek.ts   # Cliente API Deepseek
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
│   └── 0002_seed_data.sql
├── wrangler.jsonc        # Config Cloudflare
└── ecosystem.config.cjs  # PM2 config
```

### API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/login | Autenticación |
| GET | /api/auth/verify | Verificar token |
| GET | /api/dashboard | Panel cliente |
| GET/PUT | /api/properties/:id | Datos vivienda |
| GET/PUT | /api/maintenances | Mantenimientos |
| POST | /api/estimates | Calcular estimación |
| POST | /api/strategic | Valoración estratégica |
| GET | /api/chari/conversation | Obtener/crear conversación |
| POST | /api/chari/message | Enviar mensaje a Chari |
| GET | /api/chari/status | Estado IA (Deepseek/reglas) |
| POST | /api/contacts | Solicitar contacto |
| GET | /api/admin/clients | [Admin] Lista clientes |
| GET | /api/admin/clients/:id | [Admin] Detalle cliente |

---

## 🔐 Configuración Deepseek (IA para Chari)

### Obtener API Key
1. Registrarse en https://platform.deepseek.com/
2. Crear una API key en la sección "API Keys"
3. El modelo `deepseek-chat` es económico (~$0.14/M tokens input)

### Desarrollo Local
Editar `.dev.vars`:
```
DEEPSEEK_API_KEY=tu_api_key_real_aqui
```

### Producción (Cloudflare)
```bash
npx wrangler secret put DEEPSEEK_API_KEY --project-name urbanizaciones-valdemorillo
```

### Sin API Key
Si no hay API key configurada, Chari usa un sistema de reglas que:
- Detecta intenciones (saludo, precio, técnico, venta, etc.)
- Responde con rangos predefinidos
- Funciona offline

---

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Compilar
npm run build

# Iniciar servidor (PM2)
pm2 start ecosystem.config.cjs

# O directamente con wrangler
npm run dev:d1

# Ver logs
pm2 logs --nostream

# Reset base de datos
npm run db:reset
```

---

## 📦 Despliegue a Producción

```bash
# 1. Configurar Cloudflare API
# (desde panel Genspark → Deploy)

# 2. Crear base de datos D1
npx wrangler d1 create masurba-db

# 3. Actualizar database_id en wrangler.jsonc

# 4. Aplicar migraciones
npm run db:migrate:prod

# 5. Configurar secretos
npx wrangler secret put DEEPSEEK_API_KEY --project-name urbanizaciones-valdemorillo

# 6. Desplegar
npm run deploy:prod
```

---

## 📈 Próximas Funcionalidades

- [ ] Integración WhatsApp Business API
- [ ] Subida de fotos a Cloudflare R2
- [ ] Notificaciones push
- [ ] Exportar informes en PDF
- [ ] Calendario de mantenimientos
- [ ] Múltiples propiedades por usuario

---

## 📄 Licencia

Proyecto privado de **Más Urba Multiservicios**.

© 2024-2026 Más Urba Multiservicios - Urbanizaciones de Valdemorillo, Madrid
