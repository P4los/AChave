#!/bin/bash

set -e  # Detener en caso de error

# ── Colores ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${BOLD} AChave — Self-Hosted Launcher${NC}"
echo -e "${BLUE}══════════════════════════════════════${NC}"
echo ""

# ── Verificar que Docker está instalado ──
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[X] Docker no está instalado. Instálalo desde https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# ── Verificar que Docker Compose está disponible ──
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[X] Docker Compose no está instalado.${NC}"
    exit 1
fi

echo -e "${GREEN}[+] Docker detectado${NC}"

# ── Crear .env del backend si no existe ──
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo -e "${YELLOW}[X] No se encontró backend/.env — creando uno por defecto...${NC}"
    cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
    # Generar un JWT_SECRET_KEY aleatorio seguro
    SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    sed -i "s/cambia_esta_clave_por_una_segura_en_produccion/$SECRET/" "$SCRIPT_DIR/backend/.env"
    echo -e "${GREEN}[+] backend/.env creado con clave JWT aleatoria${NC}"
else
    echo -e "${GREEN}[+] backend/.env encontrado${NC}"
fi

# ── Crear .env.local del frontend si no existe ──
if [ ! -f "$SCRIPT_DIR/frontend/.env.local" ]; then
    echo -e "${YELLOW}[X] No se encontró frontend/.env.local — creando uno por defecto...${NC}"
    cat > "$SCRIPT_DIR/frontend/.env.local" << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    echo -e "${GREEN}[+] frontend/.env.local creado${NC}"
else
    echo -e "${GREEN}[+] frontend/.env.local encontrado${NC}"
fi

echo ""

# ── Gestión de argumentos ──
ACTION="${1:-up}"

case "$ACTION" in
    up|start)
        echo -e "${BOLD}[+] Levantando todos los servicios...${NC}"
        echo ""
        cd "$SCRIPT_DIR"
        $COMPOSE_CMD up --build -d

        echo ""
        echo -e "${GREEN}${BOLD}[+] ¡AChave está en marcha!${NC}"
        echo ""
        echo -e "  ${BOLD}Frontend:${NC}  http://localhost:3000"
        echo -e "  ${BOLD}Backend:${NC}   http://localhost:8000"
        echo -e "  ${BOLD}API Docs:${NC}  http://localhost:8000/docs"
        echo -e "  ${BOLD}Adminer:${NC}   http://localhost:8080"
        echo ""
        echo -e "${YELLOW}  - Usa './start.sh logs' para ver los logs en tiempo real${NC}"
        echo -e "${YELLOW}  - Usa './start.sh stop' para detener todo${NC}"
        echo ""
        ;;

    stop|down)
        echo -e "${BOLD}[-] Deteniendo todos los servicios...${NC}"
        cd "$SCRIPT_DIR"
        $COMPOSE_CMD down
        echo -e "${GREEN}[+] Servicios detenidos${NC}"
        ;;

    restart)
        echo -e "${BOLD}[-] Reiniciando todos los servicios...${NC}"
        cd "$SCRIPT_DIR"
        $COMPOSE_CMD down
        $COMPOSE_CMD up --build -d
        echo -e "${GREEN}[+] Servicios reiniciados${NC}"
        ;;

    logs)
        cd "$SCRIPT_DIR"
        $COMPOSE_CMD logs -f
        ;;

    reset-db)
        echo -e "${RED}${BOLD}[X] ADVERTENCIA: Esto borrará TODOS los datos de la base de datos.${NC}"
        read -p "¿Estás seguro? Escribe 'si' para confirmar: " CONFIRM
        if [ "$CONFIRM" = "si" ]; then
            cd "$SCRIPT_DIR"
            $COMPOSE_CMD exec backend python reset_db.py --force
            echo -e "${GREEN}[+] Base de datos reseteada${NC}"
        else
            echo "Operación cancelada."
        fi
        ;;

    status)
        cd "$SCRIPT_DIR"
        $COMPOSE_CMD ps
        ;;

    *)
        echo -e "${BOLD}Uso:${NC} ./start.sh [comando]"
        echo ""
        echo -e "  ${GREEN}up${NC}        Levanta todos los servicios (por defecto)"
        echo -e "  ${GREEN}stop${NC}      Para todos los servicios"
        echo -e "  ${GREEN}restart${NC}   Reinicia todos los servicios"
        echo -e "  ${GREEN}logs${NC}      Ver logs en tiempo real"
        echo -e "  ${GREEN}reset-db${NC}  [X] ADVERTENCIA: Borrar y recrear la base de datos"
        echo -e "  ${GREEN}status${NC}    Ver estado de los contenedores"
        echo ""
        ;;
esac
