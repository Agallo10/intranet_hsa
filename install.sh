#!/usr/bin/env bash
#
# Instalador de la Intranet Hospitalaria.
#
# Verifica los requisitos (Node.js, npm y PostgreSQL) y, solo si se cumplen,
# instala las dependencias, crea la base de datos y ejecuta el seed.
#
# Uso:
#   ./install.sh            # instalar en modo desarrollo
#   ./install.sh --build    # instalar y compilar frontend/backend para producción
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

REQUIRED_NODE_MAJOR=20
FAIL=0
BUILD=0

for arg in "$@"; do
  if [ "$arg" = "--build" ] || [ "$arg" = "build" ]; then
    BUILD=1
  fi
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()  { printf '  [INFO]  %s\n' "$*"; }
ok()    { printf '  [OK]    %s\n' "$*"; }
error() { printf '  [ERROR] %s\n' "$*" >&2; }

# Lee el valor de una variable desde backend/.env (vacío si no existe).
env_get() {
  sed -nE "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$ROOT/backend/.env" 2>/dev/null | tail -1
}

# Agrega rutas comunes de PostgreSQL (macOS Postgres.app / Homebrew) al PATH.
setup_pg_path() {
  for p in \
    /Applications/Postgres.app/Contents/Versions/latest/bin \
    /opt/homebrew/bin \
    /usr/local/bin; do
    if [ -x "$p/psql" ]; then
      export PATH="$p:$PATH"
      return 0
    fi
  done
}

# ---------------------------------------------------------------------------
# Verificación de requisitos
# ---------------------------------------------------------------------------
check_node() {
  if ! command -v node >/dev/null 2>&1; then
    error "Node.js no está instalado. Se requiere Node.js >= ${REQUIRED_NODE_MAJOR}."
    FAIL=$((FAIL + 1))
    return
  fi
  local v major
  v="$(node --version | sed 's/^v//')"
  major="${v%%.*}"
  if [ "$major" -lt "$REQUIRED_NODE_MAJOR" ]; then
    error "Node.js ${v} es muy antiguo. Se requiere >= ${REQUIRED_NODE_MAJOR}."
    FAIL=$((FAIL + 1))
  else
    ok "Node.js ${v}"
  fi
}

check_npm() {
  if ! command -v npm >/dev/null 2>&1; then
    error "npm no está instalado."
    FAIL=$((FAIL + 1))
  else
    ok "npm $(npm --version)"
  fi
}

check_psql() {
  if ! command -v psql >/dev/null 2>&1; then
    error "PostgreSQL (psql) no se encontró en el PATH."
    error "  Instálalo o añade su carpeta bin al PATH."
    FAIL=$((FAIL + 1))
  else
    ok "PostgreSQL $(psql --version | awk '{print $3}')"
  fi
}

check_connection() {
  local host port user pass
  host="$(env_get DATABASE_HOST)"; host="${host:-localhost}"
  port="$(env_get DATABASE_PORT)"; port="${port:-5432}"
  user="$(env_get DATABASE_USER)"; user="${user:-postgres}"
  pass="$(env_get DATABASE_PASSWORD)"

  if PGPASSWORD="$pass" psql -h "$host" -p "$port" -U "$user" -d postgres -tAc "SELECT 1" >/dev/null 2>&1; then
    ok "Conexión a PostgreSQL correcta (${host}:${port}, usuario '${user}')"
  else
    error "No se pudo conectar a PostgreSQL en ${host}:${port} con el usuario '${user}'."
    error "  Revisa backend/.env (DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD)"
    error "  y verifica que PostgreSQL esté en ejecución."
    FAIL=$((FAIL + 1))
  fi
}

# ---------------------------------------------------------------------------
# Instalación
# ---------------------------------------------------------------------------
create_database() {
  local host port user pass name exists
  host="$(env_get DATABASE_HOST)"; host="${host:-localhost}"
  port="$(env_get DATABASE_PORT)"; port="${port:-5432}"
  user="$(env_get DATABASE_USER)"; user="${user:-postgres}"
  pass="$(env_get DATABASE_PASSWORD)"
  name="$(env_get DATABASE_NAME)"; name="${name:-intranet}"

  exists="$(PGPASSWORD="$pass" psql -h "$host" -p "$port" -U "$user" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname = '$name'")"

  if [ "$exists" = "1" ]; then
    ok "Base de datos '${name}' ya existe"
  else
    PGPASSWORD="$pass" psql -h "$host" -p "$port" -U "$user" -d postgres \
      -c "CREATE DATABASE \"$name\""
    ok "Base de datos '${name}' creada"
  fi
}

echo
echo "=================================================="
echo "  Instalador — Intranet Hospitalaria"
echo "=================================================="
echo
echo "Verificando requisitos..."
echo

setup_pg_path
check_node
check_npm
check_psql

# backend/.env debe existir antes de poder validar la conexión
if [ ! -f "$ROOT/backend/.env" ]; then
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  info "Se creó backend/.env a partir de backend/.env.example (ajusta los valores)."
fi

check_connection

echo
if [ "$FAIL" -gt 0 ]; then
  echo "=================================================="
  error "No se cumplen los requisitos (${FAIL} error(es))."
  echo "  Revisa los puntos anteriores y vuelve a ejecutar ./install.sh"
  echo "  Consulta REQUISITOS.md para más detalles."
  echo "=================================================="
  exit 1
fi

echo
echo "Requisitos cumplidos. Instalando el sistema..."
echo

set -e

# --- Backend ---
echo
echo "[1/3] Backend — dependencias"
( cd "$ROOT/backend" && npm install )

echo
echo "[2/3] Backend — base de datos y seed"
create_database
( cd "$ROOT/backend" && npm run seed )

# --- Frontend ---
echo
echo "[3/3] Frontend — dependencias"
( cd "$ROOT/frontend" && npm install )

if [ "$BUILD" = "1" ]; then
  echo
  echo "Compilando frontend y backend..."
  ( cd "$ROOT/frontend" && npm run build )
  ( cd "$ROOT/backend" && npm run build )
fi

echo
echo "=================================================="
echo "  Instalación completada"
echo "=================================================="
echo
echo "Para iniciar en desarrollo:"
echo "  cd backend  && npm run start:dev   # API en http://localhost:3000/api"
echo "  cd frontend && npm run dev         # App en http://localhost:5173"
echo
echo "Credenciales iniciales (admin):"
echo "  usuario: $(env_get SEED_ADMIN_USERNAME | grep . || echo admin)"
echo "  contraseña: $(env_get SEED_ADMIN_PASSWORD | grep . || echo admin123)"
echo
echo "Recuerda cambiar las variables JWT_* y la contraseña del admin en backend/.env."
echo "Para producción: docker compose up -d --build"
echo
