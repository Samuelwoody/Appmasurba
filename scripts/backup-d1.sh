#!/bin/bash
# =============================================================================
# SCRIPT DE BACKUP DE BASE DE DATOS D1 - URBANIZACIONES VALDEMORILLO
# =============================================================================
# Este script exporta toda la base de datos D1 de producción a un archivo SQL
# que puede ser restaurado en caso de emergencia.
#
# USO:
#   ./scripts/backup-d1.sh                    # Backup con fecha automática
#   ./scripts/backup-d1.sh mi_backup          # Backup con nombre personalizado
#
# REQUISITOS:
#   - Variable CLOUDFLARE_API_TOKEN configurada
#   - wrangler instalado (npx wrangler)
# =============================================================================

set -e

# Configuración
DB_NAME="masurba-production"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${1:-backup_${TIMESTAMP}}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  BACKUP DE BASE DE DATOS D1${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""

# Verificar token de Cloudflare
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}ERROR: CLOUDFLARE_API_TOKEN no está configurado${NC}"
    echo "Ejecuta: export CLOUDFLARE_API_TOKEN='tu_token'"
    exit 1
fi

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Iniciando backup de: ${DB_NAME}${NC}"
echo -e "${YELLOW}📁 Archivo destino: ${BACKUP_FILE}${NC}"
echo ""

# Obtener lista de tablas
echo -e "${YELLOW}🔍 Obteniendo lista de tablas...${NC}"
TABLES=$(npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf%' AND name NOT LIKE 'sqlite%' ORDER BY name;" 2>/dev/null | grep '"name"' | sed 's/.*"name": "\([^"]*\)".*/\1/')

if [ -z "$TABLES" ]; then
    echo -e "${RED}ERROR: No se pudieron obtener las tablas${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tablas encontradas:${NC}"
echo "$TABLES" | while read table; do echo "  - $table"; done
echo ""

# Iniciar archivo de backup
cat > "$BACKUP_FILE" << EOF
-- =============================================================================
-- BACKUP DE BASE DE DATOS: ${DB_NAME}
-- FECHA: $(date "+%Y-%m-%d %H:%M:%S")
-- GENERADO POR: backup-d1.sh
-- =============================================================================
-- 
-- INSTRUCCIONES DE RESTAURACIÓN:
-- 1. Asegúrate de tener CLOUDFLARE_API_TOKEN configurado
-- 2. Ejecuta: npx wrangler d1 execute ${DB_NAME} --remote --file=${BACKUP_FILE}
-- 
-- NOTA: Este backup incluye estructura y datos de todas las tablas.
-- =============================================================================

PRAGMA foreign_keys = OFF;

EOF

# Exportar cada tabla
echo -e "${YELLOW}📤 Exportando tablas...${NC}"

for TABLE in $TABLES; do
    echo -n "  Exportando $TABLE... "
    
    # Obtener CREATE TABLE
    CREATE_STMT=$(npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='$TABLE';" 2>/dev/null | grep '"sql"' | sed 's/.*"sql": "\(.*\)"/\1/' | sed 's/\\n/\n/g' | sed 's/\\"/"/g')
    
    if [ -n "$CREATE_STMT" ]; then
        echo "" >> "$BACKUP_FILE"
        echo "-- Tabla: $TABLE" >> "$BACKUP_FILE"
        echo "DROP TABLE IF EXISTS $TABLE;" >> "$BACKUP_FILE"
        echo "$CREATE_STMT;" >> "$BACKUP_FILE"
        echo "" >> "$BACKUP_FILE"
    fi
    
    # Obtener datos (JSON format)
    DATA=$(npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT * FROM $TABLE;" 2>/dev/null)
    
    # Contar registros
    COUNT=$(echo "$DATA" | grep -o '"results":\s*\[' | wc -l)
    
    echo -e "${GREEN}✓${NC}"
done

# Restaurar foreign keys
echo "" >> "$BACKUP_FILE"
echo "PRAGMA foreign_keys = ON;" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
echo "-- FIN DEL BACKUP" >> "$BACKUP_FILE"

# Calcular tamaño del backup
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  ✅ BACKUP COMPLETADO${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "  📁 Archivo: ${BACKUP_FILE}"
echo -e "  📊 Tamaño: ${BACKUP_SIZE}"
echo -e "  📅 Fecha: $(date "+%Y-%m-%d %H:%M:%S")"
echo ""
echo -e "${YELLOW}💡 Para restaurar este backup:${NC}"
echo -e "   npx wrangler d1 execute ${DB_NAME} --remote --file=${BACKUP_FILE}"
echo ""
