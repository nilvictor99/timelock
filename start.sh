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

MODE="${1:-bash}"
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