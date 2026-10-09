#!/usr/bin/env bash

# ==============================================================================
# Script de pruebas automatizadas con cURL para API Solicitudes Comerciales
# ==============================================================================

BASE_URL="http://localhost:3000"
KEY1="key-client-alpha-12345"
KEY2="key-client-beta-67890"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}    Iniciando batería de pruebas con cURL - API Solicitudes     ${NC}"
echo -e "${BLUE}================================================================${NC}\n"

test_request() {
  local title="$1"
  local expected_code="$2"
  local cmd="$3"

  echo -e "${YELLOW}>> Test: ${title}${NC}"
  response=$(eval "$cmd -s -w '\n%{http_code}'")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq "$expected_code" ]; then
    echo -e "   ${GREEN}✓ ÉXITO [HTTP $http_code] (Esperado: $expected_code)${NC}"
  else
    echo -e "   ${RED}✗ FALLO [HTTP $http_code] (Esperado: $expected_code)${NC}"
  fi
  echo -e "   Respuesta: $body\n"
}

# 1. Petición sin x-api-key rechazada (401)
test_request "1. Petición sin x-api-key" 401 \
  "curl -X GET '${BASE_URL}/solicitudes' -H 'x-user: admin'"

# 2. Petición con x-api-key inválida rechazada (401)
test_request "2. Petición con x-api-key inválida" 401 \
  "curl -X GET '${BASE_URL}/solicitudes' -H 'x-api-key: clave-invalida-xyz' -H 'x-user: admin'"

# 3. Petición con usuario desconocido rechazada (401)
test_request "3. Petición con usuario desconocido" 401 \
  "curl -X GET '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: usuario_no_existente'"

# 4. Consumo exitoso con primera API key (200)
test_request "4. Consumo exitoso con primera clave (${KEY1})" 200 \
  "curl -X GET '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: admin'"

# 5. Consumo exitoso con segunda API key (${KEY2}) (200)
test_request "5. Consumo exitoso con segunda clave (${KEY2})" 200 \
  "curl -X GET '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY2}' -H 'x-user: supervisor'"

# 6. Rechazo de validación DTO: cliente vacío (400)
test_request "6. DTO inválido: cliente vacío" 400 \
  "curl -X POST '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"cliente\":\"   \",\"descripcion\":\"Prueba\"}'"

# 7. Rechazo de validación DTO: campo no permitido (estado en creación) (400)
test_request "7. DTO inválido: enviar propiedad protegida 'estado'" 400 \
  "curl -X POST '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"cliente\":\"Tech Corp\",\"descripcion\":\"Interés en ERP\",\"estado\":\"RESUELTA\"}'"

# 8. Creación exitosa por asesor1 (el asesor se autoasigna) (201)
test_request "8. Creación de solicitud por asesor1" 201 \
  "curl -X POST '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"cliente\":\"Tech Corp\",\"descripcion\":\"Interés en ERP Empresarial\"}'"

# 9. Creación por supervisor asignando a asesor2 (201)
test_request "9. Creación por supervisor asignando a asesor2" 201 \
  "curl -X POST '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: supervisor' -H 'Content-Type: application/json' -d '{\"cliente\":\"Industrias Alfa\",\"descripcion\":\"Cotización de servidores\",\"asesor\":\"asesor2\"}'"

# 10. Consulta por asesor1 (solo ve las suyas) (200)
test_request "10. Consulta por asesor1 (filtro en base de datos)" 200 \
  "curl -X GET '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1'"

# 11. Consulta por supervisor (ve todas) (200)
test_request "11. Consulta por supervisor (operación completa)" 200 \
  "curl -X GET '${BASE_URL}/solicitudes' -H 'x-api-key: ${KEY1}' -H 'x-user: supervisor'"

# 12. Asesor1 intentando ver solicitud ajena (403)
test_request "12. Asesor1 consultando solicitud ajena de asesor2" 403 \
  "curl -X GET '${BASE_URL}/solicitudes/2' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1'"

# 13. Asesor1 intentando cambiar estado de solicitud ajena (403)
test_request "13. Asesor1 intentando modificar solicitud ajena" 403 \
  "curl -X PATCH '${BASE_URL}/solicitudes/2/estado' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"estado\":\"EN_GESTION\"}'"

# 14. Transición inválida: PENDIENTE -> RESUELTA directa (409)
test_request "14. Transición inválida: PENDIENTE a RESUELTA directa" 409 \
  "curl -X PATCH '${BASE_URL}/solicitudes/1/estado' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"estado\":\"RESUELTA\"}'"

# 15. Transición inválida: Mismo estado PENDIENTE -> PENDIENTE (409)
test_request "15. Transición inválida: al mismo estado" 409 \
  "curl -X PATCH '${BASE_URL}/solicitudes/1/estado' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"estado\":\"PENDIENTE\"}'"

# 16. Transición válida: PENDIENTE -> EN_GESTION (200)
test_request "16. Transición válida: PENDIENTE a EN_GESTION" 200 \
  "curl -X PATCH '${BASE_URL}/solicitudes/1/estado' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"estado\":\"EN_GESTION\"}'"

# 17. Transición válida: EN_GESTION -> RESUELTA (200)
test_request "17. Transición válida: EN_GESTION a RESUELTA" 200 \
  "curl -X PATCH '${BASE_URL}/solicitudes/1/estado' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"estado\":\"RESUELTA\"}'"

# 18. Transición inválida: reabrir solicitud RESUELTA -> EN_GESTION (409)
test_request "18. Transición inválida: reabrir solicitud resuelta" 409 \
  "curl -X PATCH '${BASE_URL}/solicitudes/1/estado' -H 'x-api-key: ${KEY1}' -H 'x-user: asesor1' -H 'Content-Type: application/json' -d '{\"estado\":\"EN_GESTION\"}'"

# 19. Consulta Swagger OpenAPI spec (200)
test_request "19. Documentación Swagger OpenAPI disponible" 200 \
  "curl -X GET '${BASE_URL}/api/docs-json'"

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}      Batería de pruebas cURL finalizada con éxito              ${NC}"
echo -e "${BLUE}================================================================${NC}"
