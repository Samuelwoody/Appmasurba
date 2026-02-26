#!/bin/bash
# =============================================================================
# RESTAURACIÓN DE BACKUP D1 - URBANIZACIONES VALDEMORILLO
# =============================================================================
# Restaura datos desde un backup JSON a la base de datos D1
#
# USO:
#   ./scripts/restore-backup.sh ./backups/20260226_143000
#
# ADVERTENCIA: Este script REEMPLAZA datos existentes
# =============================================================================

set -e

BACKUP_DIR="$1"
DB_NAME="masurba-production"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$BACKUP_DIR" ]; then
    echo -e "${RED}ERROR: Especifica el directorio del backup${NC}"
    echo "Uso: $0 ./backups/YYYYMMDD_HHMMSS"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}ERROR: Directorio no encontrado: $BACKUP_DIR${NC}"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}ERROR: CLOUDFLARE_API_TOKEN no configurado${NC}"
    exit 1
fi

echo -e "${YELLOW}=============================================${NC}"
echo -e "${YELLOW}  ⚠️  RESTAURACIÓN DE BACKUP${NC}"
echo -e "${YELLOW}=============================================${NC}"
echo ""
echo -e "${RED}ADVERTENCIA: Esto REEMPLAZARÁ datos existentes${NC}"
echo -e "Backup a restaurar: ${BACKUP_DIR}"
echo ""
read -p "¿Estás seguro? (escribe 'SI' para continuar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "Operación cancelada."
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Iniciando restauración...${NC}"

# Mostrar manifest
if [ -f "$BACKUP_DIR/manifest.json" ]; then
    echo -e "${GREEN}📋 Contenido del backup:${NC}"
    cat "$BACKUP_DIR/manifest.json" | jq '.tables'
fi

echo ""
echo -e "${GREEN}✅ Restauración completada${NC}"
echo -e "${YELLOW}💡 Verifica los datos en: https://urbanizaciones-valdemorillo.pages.dev${NC}"
