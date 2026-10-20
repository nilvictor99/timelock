#!/usr/bin/env bash
#
# start.sh — Arranca la aplicación con Docker (Laravel Sail).
#
# Uso:
#   ./start.sh            # docker compose up -d + bash interactivo dentro del contenedor
#   ./start.sh dev        # igual pero ejecuta `npm run dev` (desarrollo/HMR en :5173)
#   ./start.sh build      # igual pero ejecuta `npm run build`
#
# Flujo:
#   1) docker compose up -d
#   2) docker ps -a -> identificamos el id del contenedor de la app (servicio laravel.test)
#   3) docker exec -it <id> bash
#
# Ojo: el puerto 5173 está publicado por el contenedor, por eso `npm run dev`
# debe correr DENTRO del contenedor (nunca en el host, que dará "port in use").
# Al terminar se normaliza el ownership de node_modules/storage a uid 1000 para
# que los comandos de npm en el host no fallen por archivos root (EACCES).

set -euo pipefail

cd "$(dirname "$0")"

# Verificar e instalar dependencias con Composer si no existen
if [[ ! -d "vendor" ]]; then
    echo "==> vendor/ no encontrado. Ejecutando composer install..."
    if command -v composer >/dev/null 2>&1; then
        composer install --no-interaction --prefer-dist
    else
        echo "ERROR: composer no está instalado en el host." >&2
        exit 1
    fi
fi

# Verificar .env
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        echo "==> .env no encontrado. Copiando desde .env.example..."
        cp .env.example .env
        echo "==> .env creado."
    else
        echo "ERROR: .env.example no encontrado." >&2
        exit 1
    fi
fi

# Generar APP_KEY si está vacío
if grep -q '^APP_KEY=$' .env || ! grep -q '^APP_KEY=base64:' .env; then
    if command -v php >/dev/null 2>&1 && [[ -f "artisan" ]]; then
        echo "==> Generando APP_KEY..."
        php artisan key:generate --force >/dev/null 2>&1 || true
    fi
fi

# Verificar dependencias NPM
if [[ ! -d "node_modules" ]]; then
    echo "==> node_modules no encontrado. Ejecutando npm install..."
    if command -v npm >/dev/null 2>&1; then
        npm install
    else
        echo "ERROR: npm no está instalado en el host." >&2
        exit 1
    fi
fi

MODE="${1:-}"
if [[ -z "${MODE}" ]]; then
    echo "Selecciona modo de ejecución:"
    echo "  1) bash  - abrir shell en el contenedor"
    echo "  2) dev   - levantar npm run dev dentro del contenedor"
    echo "  3) build - ejecutar npm run build dentro del contenedor"
    read -rp "Opción [1-3]: " opt
    case "${opt}" in
        1) MODE="bash" ;;
        2) MODE="dev" ;;
        3) MODE="build" ;;
        *) MODE="bash" ;;
    esac
fi
SERVICE="laravel.test"
CONTAINER_WORKDIR="/var/www/html"

# -it si hay terminal interactiva; sin flags para uso automatizado (docker exec no tiene -T)
if [[ -t 0 ]]; then
    EXEC_FLAGS="-it"
else
    EXEC_FLAGS=""
fi

echo "==> docker compose up -d"
docker compose up -d

echo "==> Identificando contenedor del servicio ${SERVICE}..."
CONTAINER_ID="$(docker compose ps -q "${SERVICE}" 2>/dev/null || true)"
if [[ -z "${CONTAINER_ID}" ]]; then
    CONTAINER_ID="$(docker ps -a --filter "name=${SERVICE}" --format '{{.ID}}' | head -1)"
fi
if [[ -z "${CONTAINER_ID}" ]]; then
    echo "ERROR: no se encontró el contenedor de la app (${SERVICE})." >&2
    exit 1
fi
echo "==> Contenedor de la app: ${CONTAINER_ID}"

case "${MODE}" in
    bash)
        docker exec ${EXEC_FLAGS} "${CONTAINER_ID}" bash
        ;;
    dev)
        if docker exec "${CONTAINER_ID}" sh -c 'pgrep -f "[n]ode .*/vite" >/dev/null 2>&1'; then
            echo "==> Ya existe un servidor Vite corriendo en el contenedor; no se lanza otro."
            exit 0
        fi
        docker exec ${EXEC_FLAGS} "${CONTAINER_ID}" bash -lc "cd ${CONTAINER_WORKDIR} && npm run dev"
        ;;
    build)
        docker exec ${EXEC_FLAGS} "${CONTAINER_ID}" bash -lc "cd ${CONTAINER_WORKDIR} && npm run build"
        ;;
    *)
        echo "Modo desconocido: ${MODE}. Usa: '' (bash), dev o build." >&2
        exit 1
        ;;
esac

echo "==> Normalizando ownership (node_modules/.vite + storage) a uid 1000..."
docker exec -u root "${CONTAINER_ID}" bash -lc "chown -R 1000:1000 ${CONTAINER_WORKDIR}/node_modules/.vite ${CONTAINER_WORKDIR}/storage" 2>/dev/null || true

echo "==> OK"