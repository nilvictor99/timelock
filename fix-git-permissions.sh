#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "ERROR: ejecuta este script dentro de un repositorio Git." >&2
    exit 1
}

cd "${REPOSITORY_ROOT}"

git config --local core.filemode false

echo "Git ya no reportara cambios de permisos en este repositorio."
echo
echo "Cambios reales detectados:"

if git status --short | grep -q .; then
    git status --short
else
    echo "Ninguno."
fi
