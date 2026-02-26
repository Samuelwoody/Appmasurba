#!/bin/bash
# =============================================================================
# EXPORT COMPLETO DE DATOS D1 - URBANIZACIONES VALDEMORILLO
# =============================================================================
# Exporta TODOS los datos de la base de datos a archivos JSON individuales
# por tabla, más un archivo SQL con la estructura.
#
# USO:
#   ./scripts/export-full-backup.sh
#
# GENERA:
#   backups/YYYYMMDD_HHMMSS/
#   ├── schema.sql          # Estructura de todas las tablas
#   ├── users.json          # Datos de usuarios
#   ├── properties.json     # Datos de propiedades
#   ├── ... (una por tabla)
#   └── manifest.json       # Resumen del backup
# =============================================================================

set -e

# Configuración
DB_NAME="masurba-production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  EXPORT COMPLETO DE BASE DE DATOS D1${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Verificar token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}ERROR: CLOUDFLARE_API_TOKEN no está configurado${NC}"
    exit 1
fi

# Crear directorio
mkdir -p "$BACKUP_DIR"
echo -e "${YELLOW}📁 Directorio de backup: ${BACKUP_DIR}${NC}"
echo ""

# Tablas a exportar (excluir internas de Cloudflare)
TABLES="users properties installations maintenances maintenance_history maintenance_media maintenance_photos estimates conversations chari_memory chari_auto_content contact_requests reminders activity_log services client_tags strategic_assessments property_management property_media sessions porche_posts porche_comments porche_reactions inmourba_listings inmourba_comments mercadillo_items mercadillo_comments d1_migrations"

# Iniciar manifest
echo '{' > "$BACKUP_DIR/manifest.json"
echo '  "database": "'$DB_NAME'",' >> "$BACKUP_DIR/manifest.json"
echo '  "timestamp": "'$(date -Iseconds)'",' >> "$BACKUP_DIR/manifest.json"
echo '  "tables": {' >> "$BACKUP_DIR/manifest.json"

FIRST_TABLE=true

# Exportar cada tabla
for TABLE in $TABLES; do
    echo -n -e "  ${YELLOW}Exportando ${TABLE}...${NC} "
    
    # Exportar datos a JSON
    RESULT=$(npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT * FROM $TABLE;" --json 2>/dev/null || echo '[]')
    
    # Guardar JSON
    echo "$RESULT" > "$BACKUP_DIR/${TABLE}.json"
    
    # Contar registros
    COUNT=$(echo "$RESULT" | jq '.[0].results | length' 2>/dev/null || echo "0")
    
    echo -e "${GREEN}✓ ${COUNT} registros${NC}"
    
    # Añadir al manifest
    if [ "$FIRST_TABLE" = true ]; then
        FIRST_TABLE=false
    else
        echo ',' >> "$BACKUP_DIR/manifest.json"
    fi
    echo -n '    "'$TABLE'": '$COUNT >> "$BACKUP_DIR/manifest.json"
done

# Cerrar manifest
echo '' >> "$BACKUP_DIR/manifest.json"
echo '  }' >> "$BACKUP_DIR/manifest.json"
echo '}' >> "$BACKUP_DIR/manifest.json"

# Exportar schema
echo ""
echo -e "${YELLOW}📋 Exportando estructura de tablas...${NC}"
npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf%' AND name NOT LIKE 'sqlite%';" --json 2>/dev/null > "$BACKUP_DIR/schema.json"

# Crear archivo de restauración rápida
cat > "$BACKUP_DIR/RESTORE_INSTRUCTIONS.md" << 'EOF'
# Instrucciones de Restauración

## Restauración Completa

Para restaurar este backup en una base de datos D1 vacía:

```bash
# 1. Configurar token
export CLOUDFLARE_API_TOKEN="tu_token"

# 2. Ejecutar script de restauración
./restore-backup.sh
```

## Restauración Manual por Tabla

```bash
# Ejemplo: restaurar solo usuarios
cat users.json | jq -r '.[0].results[] | "INSERT INTO users VALUES (\(.id), \"\(.email)\", ...);"'
```

## Notas Importantes

- Este backup fue creado el: $(date)
- Base de datos origen: masurba-production
- Verificar que las foreign keys estén desactivadas antes de restaurar
EOF

# Calcular tamaño total
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  ✅ EXPORT COMPLETADO${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "  📁 Directorio: ${BACKUP_DIR}"
echo -e "  📊 Tamaño total: ${TOTAL_SIZE}"
echo -e "  📅 Fecha: $(date "+%Y-%m-%d %H:%M:%S")"
echo ""
echo -e "${YELLOW}📋 Archivos generados:${NC}"
ls -la "$BACKUP_DIR"
echo ""
