# Más Urba - Control y Estrategia de Vivienda

## Descripción

Aplicación web progresiva (PWA) para propietarios de chalets en urbanizaciones de Valdemorillo (Madrid). 
Permite control técnico de vivienda, consulta con asistente estratégica (Chari), registro de mantenimientos 
y estimaciones orientativas de reformas.

## Funcionalidades Completadas

### Panel Cliente
- ✅ Dashboard con estado técnico de vivienda
- ✅ Score técnico calculado automáticamente
- ✅ Indicadores de mantenimientos pendientes
- ✅ Acceso rápido a Chari

### Mi Vivienda
- ✅ Configuración de datos de vivienda
- ✅ Selección de urbanización y tipo
- ✅ Estado de instalaciones (electricidad, fontanería, etc.)
- ✅ Indicador de estado percibido

### Control de Mantenimiento
- ✅ Checklist por categorías (cubierta, caldera, piscina, etc.)
- ✅ Marcar como revisado
- ✅ Historial de mantenimientos
- ✅ Próximos mantenimientos recomendados

### Estimaciones Orientativas
- ✅ Calculadora de rangos de precio
- ✅ Múltiples tipos de intervención
- ✅ Niveles de acabado (básico, medio, premium)
- ✅ Variables que afectan al precio
- ✅ Disclaimer de orientación

### Valoración Estratégica
- ✅ Análisis de intención de venta
- ✅ Horizonte temporal
- ✅ Recomendaciones personalizadas
- ✅ Próximos pasos sugeridos

### Chari - Asistente
- ✅ Chat conversacional
- ✅ Memoria persistente por usuario
- ✅ Clasificación de intenciones
- ✅ Respuestas contextualizadas
- ✅ Ofrecimiento de contacto con Samuel

### Panel Administrador (Samuel)
- ✅ Dashboard con métricas
- ✅ Lista de clientes
- ✅ Detalle de cliente con historial
- ✅ Etiquetas de clasificación
- ✅ Gestión de solicitudes de contacto

## URLs

- **Desarrollo local**: http://localhost:3000
- **Producción**: (pendiente despliegue)

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/verify` - Verificar token

### Dashboard
- `GET /api/dashboard` - Datos completos del dashboard
- `GET /api/dashboard/summary` - Resumen rápido

### Propiedades
- `GET /api/properties` - Obtener vivienda del usuario
- `POST /api/properties` - Crear/actualizar vivienda
- `PUT /api/properties/installations/:type` - Actualizar instalación

### Mantenimientos
- `GET /api/maintenances` - Listar mantenimientos
- `GET /api/maintenances/:id` - Detalle de mantenimiento
- `PUT /api/maintenances/:id` - Actualizar mantenimiento
- `POST /api/maintenances/:id/check` - Marcar como revisado

### Estimaciones
- `GET /api/estimates/types` - Tipos de intervención
- `POST /api/estimates/calculate` - Calcular estimación
- `GET /api/estimates` - Historial de estimaciones

### Valoración Estratégica
- `GET /api/strategic/options` - Opciones disponibles
- `POST /api/strategic/assess` - Generar valoración

### Chari
- `GET /api/chari/conversation` - Obtener conversación activa
- `POST /api/chari/message` - Enviar mensaje
- `POST /api/chari/new` - Nueva conversación

### Admin
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/clients` - Lista de clientes
- `GET /api/admin/clients/:id` - Detalle de cliente
- `POST /api/admin/clients/:id/tags` - Añadir etiqueta

## Tecnología

- **Frontend**: HTML5, TailwindCSS, JavaScript vanilla
- **Backend**: Hono (TypeScript)
- **Base de datos**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Pages
- **PWA**: Service Worker + Web App Manifest

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| cliente@demo.es | demo123 | Cliente |
| samuel@masurba.es | admin123 | Admin |

## Instalación Local

```bash
# Instalar dependencias
npm install

# Construir
npm run build

# Inicializar base de datos
npm run db:migrate:local
npm run db:seed:local

# Iniciar servidor de desarrollo
npm run dev:sandbox
```

## Despliegue

```bash
# Construir y desplegar a Cloudflare Pages
npm run deploy:prod
```

## Próximos Pasos

1. [ ] Integración con WhatsApp Business API
2. [ ] Sistema de notificaciones push
3. [ ] Subida de fotos a R2
4. [ ] Integración con OpenAI para Chari avanzada
5. [ ] Exportación de informes PDF
6. [ ] Sistema de recordatorios de mantenimiento

## Licencia

Privado - © 2025 Más Urba
