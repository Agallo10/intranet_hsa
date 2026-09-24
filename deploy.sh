#!/usr/bin/env bash
#
# Despliegue de producción de la Intranet Hospitalaria en un servidor Linux (Ubuntu).
#
# Uso:
#   ./deploy.sh                          # si el repo ya está clonado en REPO_DIR
#   REPO_URL=https://... ./deploy.sh     # clona el repo en REPO_DIR y despliega
#
# Hace:
#   1. Verifica Docker + Docker Compose.
#   2. Clona (o actualiza) el repositorio.
#   3. Crea `.env` con secretos aleatorios si no existe, o valida que estén completos.
#   4. Levanta los servicios con `docker compose up -d --build`.
#
set -uo pipefail

REPO_DIR="${REPO_DIR:-/opt/intranet}"
REPO_URL="${REPO_URL:-}"
ENV_FILE="${REPO_DIR}/.env"

info()  { printf '  [INFO]  %s\n' "$*"; }
ok()    { printf '  [OK]    %s\n' "$*"; }
error() { printf '  [ERROR] %s\n' "$*" >&2; }

gen_hex() { openssl rand -hex "${1:-32}"; }

# ---------------------------------------------------------------------------
# 1. Verificar Docker
# ---------------------------------------------------------------------------
echo
echo "=== 1. Verificando Docker ==="

if ! command -v docker >/dev/null 2>&1; then
  error "Docker no está instalado."
  error "  Instálalo: https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi
ok "docker $(docker --version | awk '{print $3}' | tr -d ',')"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
  ok "docker compose $(docker compose version --short)"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
  ok "docker-compose $(docker-compose --version | awk '{print $3}' | tr -d ',')"
else
  error "Docker Compose no está instalado."
  error "  Instálalo: sudo apt install docker-compose-plugin"
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Obtener el código
# ---------------------------------------------------------------------------
echo
echo "=== 2. Obteniendo el código ==="

if [ -d "$REPO_DIR/.git" ]; then
  info "Repositorio existente en $REPO_DIR — actualizando..."
  ( cd "$REPO_DIR" && git pull --ff-only )
  ok "Código actualizado"
elif [ -n "$REPO_URL" ]; then
  info "Clonando $REPO_URL en $REPO_DIR..."
  sudo mkdir -p "$(dirname "$REPO_DIR")"
  sudo git clone "$REPO_URL" "$REPO_DIR"
  ok "Repositorio clonado"
else
  error "No existe $REPO_DIR y no se indicó REPO_URL."
  error "  Ejecuta: REPO_URL=https://... ./deploy.sh"
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Configurar secretos (.env)
# ---------------------------------------------------------------------------
echo
echo "=== 3. Configurando secretos ==="

set_env() {
  local key="$1" val="$2"
  if grep -qE "^[[:space:]]*${key}=" "$ENV_FILE"; then
    sed -i.bak "s|^[[:space:]]*${key}=.*|${key}=${val}|" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
  else
    printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

env_get() {
  sed -nE "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$ENV_FILE" 2>/dev/null | tail -1
}

ADMIN_GENERATED=0

if [ ! -f "$ENV_FILE" ]; then
  info ".env no existe — generando uno con secretos aleatorios..."
  cp "$REPO_DIR/.env.example" "$ENV_FILE"
  set_env JWT_ACCESS_SECRET "$(gen_hex 32)"
  set_env JWT_REFRESH_SECRET "$(gen_hex 32)"
  set_env POSTGRES_PASSWORD "$(gen_hex 16)"
  set_env SEED_ADMIN_PASSWORD "$(gen_hex 16)"
  ADMIN_GENERATED=1
  ok ".env generado con secretos aleatorios"
else
  ok ".env ya existe"
fi

missing=0
for key in JWT_ACCESS_SECRET JWT_REFRESH_SECRET POSTGRES_PASSWORD SEED_ADMIN_PASSWORD; do
  val="$(env_get "$key")"
  if [ -z "$val" ]; then
    error "La variable $key está vacía en $ENV_FILE"
    missing=$((missing + 1))
  fi
done

if [ "$missing" -gt 0 ]; then
  echo
  error "Completa las variables indicadas en $ENV_FILE y vuelve a ejecutar."
  exit 1
fi
ok "Secretos configurados"

# ---------------------------------------------------------------------------
# 4. Desplegar
# ---------------------------------------------------------------------------
echo
echo "=== 4. Desplegando ==="
( cd "$REPO_DIR" && $COMPOSE up -d --build )

echo
echo "=================================================="
echo "  Despliegue completado"
echo "=================================================="
echo
echo "Servicios:"
( cd "$REPO_DIR" && $COMPOSE ps )
echo
if [ "$ADMIN_GENERATED" = "1" ]; then
  echo "Credenciales del administrador (generadas):"
  echo "  usuario:    admin"
  echo "  contraseña: $(env_get SEED_ADMIN_PASSWORD)"
  echo "  (cámbiala al entrar por primera vez)"
else
  echo "El admin se creó con SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD de tu .env"
fi
echo
echo "La app queda en http://<ip-o-dominio-del-servidor>/"
echo "  - Abre el puerto 80/443 en el firewall (ufw allow 80/tcp)."
echo "  - Backups: cd $REPO_DIR && ./scripts/backup.sh"
echo
