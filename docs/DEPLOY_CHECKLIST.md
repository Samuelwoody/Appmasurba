# ✅ Checklist Pre-Deploy

## Antes de Cada Despliegue a Producción

### 1. 🔒 Backup de Datos
- [ ] Ejecutar backup completo: `./scripts/export-full-backup.sh`
- [ ] Verificar manifest.json del backup
- [ ] Anotar el nombre del directorio del backup

### 2. 🧪 Testing Local
- [ ] `npm run build` sin errores
- [ ] `pm2 restart urba-valdemorillo`
- [ ] Probar login cliente: `cliente@demo.es`
- [ ] Probar login admin: `samuel@masurba.es`
- [ ] Verificar funcionalidad principal

### 3. 📝 Control de Versiones
- [ ] `git status` - revisar cambios
- [ ] `git add .`
- [ ] `git commit -m "descripción clara"`

### 4. 🚀 Deploy
- [ ] `export CLOUDFLARE_API_TOKEN="..."`
- [ ] `npx wrangler pages deploy dist --project-name urbanizaciones-valdemorillo`
- [ ] Esperar confirmación de deploy exitoso

### 5. ✅ Verificación Post-Deploy
- [ ] https://urbanizaciones-valdemorillo.pages.dev/api/health
- [ ] Login de cliente funciona
- [ ] Login de admin funciona
- [ ] Secciones principales cargan (Dashboard, El Porche, etc.)

### 6. 🗄️ Si hay Migraciones de BD
- [ ] `npx wrangler d1 execute masurba-production --remote --file=migrations/XXXX.sql`
- [ ] Verificar que las tablas se crearon correctamente

---

## Comandos Rápidos

```bash
# Backup
export CLOUDFLARE_API_TOKEN="MePKjPCo3CDX2z8ZzM2wKMz3MWLyoWJedQj3qv46"
./scripts/export-full-backup.sh

# Build y Test Local
npm run build
pm2 restart urba-valdemorillo
curl http://localhost:3000/api/health

# Deploy
npx wrangler pages deploy dist --project-name urbanizaciones-valdemorillo

# Verificar Producción
curl https://urbanizaciones-valdemorillo.pages.dev/api/health
```

---

## ⚠️ En Caso de Problemas

1. **Deploy falla**: Verificar token de Cloudflare
2. **App no funciona**: Revisar logs `pm2 logs --nostream`
3. **BD corrupta**: Restaurar desde backup
4. **Rollback**: Desplegar commit anterior

## 📞 Contacto de Emergencia

- Revisar documentación en `docs/BACKUP_RECOVERY.md`
- Backups disponibles en `backups/`
