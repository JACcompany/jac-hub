# JAC Hub

Panel de gestión del estudio indie **JAC** (Juega, Aprende y Crea) — tema cyberpunk oscuro con neon verde/cyan.

## Stack

- **Frontend**: React + Vite + TailwindCSS + Wouter + Recharts
- **Backend**: Express 5 + WebSocket (chat en tiempo real)
- **Base de datos**: PostgreSQL + Drizzle ORM
- **Auth**: Cookies httpOnly (sin JWT, sin terceros)
- **PWA**: Instalable directamente desde el navegador

## Módulos

| Módulo | Descripción |
|---|---|
| Dashboard | Estadísticas globales del estudio |
| Proyectos | Gestión de proyectos activos |
| Tareas | Tablero Kanban por proyecto |
| Bugs | Tracker de bugs con prioridades |
| Equipo | Directorio del equipo |
| Builds | Historial de versiones/builds |
| Chat | Chat en tiempo real con WebSocket |
| Planning | Roadmap y planificación |
| Storyboard | Tareas personales |
| Extensiones | Timer CCC (Código, Curiosidad y Cafeína) |
| Notificaciones | Sistema de alertas interno |

## Instalación

### Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL

### Pasos

```bash
# 1. Clonar e instalar dependencias
git clone <tu-repo>
cd <tu-repo>
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL

# 3. Migrar la base de datos
pnpm --filter @workspace/db run push

# 4. Iniciar en desarrollo
pnpm --filter @workspace/api-server run dev   # API en :8080
pnpm --filter @workspace/jac-hub run dev       # Frontend en :19610
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Secreto para cookies de sesión |
| `NODE_ENV` | `development` o `production` |
| `PORT` | Puerto del servidor API (default: 8080) |

## Acceso por defecto

- **Admin**: `gael@jac.dev` / `jac2024`

## Estructura

```
artifacts/
  api-server/   — Express API + WebSocket
  jac-hub/      — React + Vite frontend (PWA)
lib/
  db/           — Drizzle ORM + esquemas PostgreSQL
  api-spec/     — OpenAPI spec (fuente de verdad)
  api-client-react/ — Hooks generados (React Query)
  api-zod/      — Schemas Zod generados
```

## Regenerar código desde el spec

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Licencia

MIT — JAC Studio
