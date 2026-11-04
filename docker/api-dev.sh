#!/bin/sh
set -e

cd /app

checksum() {
  find src pom.xml -type f -print0 2>/dev/null \
    | sort -z \
    | xargs -0 md5sum 2>/dev/null \
    | md5sum \
    | awk '{print $1}'
}

echo "[dev] compilando proyecto..."
mvn -q -DskipTests compile

echo "[dev] iniciando Spring Boot (DevTools activo)..."
mvn -q spring-boot:run &
APP_PID=$!

trap 'kill -TERM "$APP_PID" 2>/dev/null; wait "$APP_PID" 2>/dev/null; exit 0' INT TERM

last="$(checksum)"
while kill -0 "$APP_PID" 2>/dev/null; do
  sleep 3
  current="$(checksum)"
  if [ "$current" != "$last" ]; then
    last="$current"
    echo "[dev] cambios detectados, recompilando..."
    if mvn -q -DskipTests compile; then
      echo "[dev] compilacion correcta, DevTools reiniciara la aplicacion"
    else
      echo "[dev] error de compilacion, se conserva la ultima version"
    fi
  fi
done
