# 🔒 Sistema de Backup y Recuperación

## Resumen del Sistema

Este documento describe el sistema de backup para proteger los datos de los vecinos de las Urbanizaciones de Valdemorillo.

## 📁 Estructura de Backups

```
webapp/
├── scripts/
│   ├── backup-d1.sh           # Backup rápido (SQL)
│   ├── export-full-backup.sh  # Backup completo (JSON por tabla)
│   └── restore-backup.sh      # Restauración
├── backups/
│   └── YYYYMMDD_HHMMSS/       # Carpeta por backup
│       ├── manifest.json      # Resumen del backup
│       ├── schema.json        # Estructura de tablas
│       ├── users.json         # Datos de usuarios
│       ├── properties.json    # Propiedades
│       └── ...                # Una por cada tabla
```

## 🚀 Cómo Hacer un Backup

### Backup Rápido (recomendado para backups frecuentes)
```bash
export CLOUDFLARE_API_TOKEN="tu_token"
cd /home/user/webapp
./scripts/export-full-backup.sh
```

### Verificar el Backup
```bash
cat backups/YYYYMMDD_HHMMSS/manifest.json
```

## 🔄 Cómo Restaurar

### Restauración Completa
```bash
export CLOUDFLARE_API_TOKEN="tu_token"
./scripts/restore-backup.sh ./backups/20260226_135003
```

### Restauración de una Tabla Específica
```bash
# Ejemplo: restaurar usuarios desde el backup
npx wrangler d1 execute masurba-production --remote --file=backups/YYYYMMDD/users.sql
```

## 📅 Política de Backups Recomendada

| Frecuencia | Tipo | Retención |
|------------|------|-----------|
| Diario | Export completo | 7 días |
| Semanal | Export completo | 4 semanas |
| Mensual | Export completo | 12 meses |
| Pre-deploy | Export completo | Permanente |

## ⚠️ Antes de Cada Deploy

**SIEMPRE** ejecuta un backup antes de desplegar cambios:

```bash
# 1. Hacer backup
./scripts/export-full-backup.sh

# 2. Verificar que el backup está correcto
cat backups/*/manifest.json | tail -1

# 3. Ahora sí, desplegar
npm run build
npx wrangler pages deploy dist --project-name urbanizaciones-valdemorillo
```

## 🗄️ Datos Críticos a Proteger

| Tabla | Descripción | Criticidad |
|-------|-------------|------------|
| `users` | Usuarios y credenciales | 🔴 CRÍTICA |
| `properties` | Datos de viviendas | 🔴 CRÍTICA |
| `installations` | Estado de instalaciones | 🟡 ALTA |
| `maintenances` | Historial de mantenimientos | 🟡 ALTA |
| `conversations` | Conversaciones con Chari | 🟢 MEDIA |
| `porche_posts` | Posts de El Porche | 🟢 MEDIA |
| `contact_requests` | Solicitudes de contacto | 🟡 ALTA |

## 🔐 Seguridad

- **NUNCA** commitear el token de Cloudflare
- **NUNCA** subir backups a repositorios públicos
- Los backups contienen datos personales (emails, teléfonos)
- Almacenar backups en lugar seguro (AI Drive, disco local encriptado)

## 📞 En Caso de Emergencia

1. **NO ENTRAR EN PÁNICO**
2. Localizar el último backup válido en `backups/`
3. Verificar el manifest.json
4. Ejecutar restauración
5. Verificar en https://urbanizaciones-valdemorillo.pages.dev

## 🔗 Enlaces Útiles

- **Dashboard Cloudflare D1**: https://dash.cloudflare.com → D1
- **Producción**: https://urbanizaciones-valdemorillo.pages.dev
- **Base de datos**: `masurba-production` (ID: 0355b25e-d878-48c2-bbcf-6840fb1692a7)
