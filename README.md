# Propio Frontend

Interfaz web del sistema de administración de contratos de alquiler.

## Stack

- React 19 + TypeScript
- Vite
- Material UI (MUI)
- React Query (TanStack)
- React Hook Form + Zod
- Recharts (graficos)
- Socket.IO Client (notificaciones en tiempo real)

## Requisitos

- Node.js >= 20
- Backend corriendo (ver [BEPropio](https://github.com/benjagilardini/BEPropio))

## Instalación

```bash
git clone https://github.com/benjagilardini/FEPropio.git
cd FEPropio
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000/api
```

## Levantar en desarrollo

```bash
npm run dev
```

La aplicación arranca en `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview   # previsualizar el build localmente
```

## Lint

```bash
npm run lint
```

## Estructura del proyecto

```
src/
  api/             # Llamadas HTTP (axios)
  components/      # Componentes reutilizables
    common/        # UI compartida (KVTable, InfoRow, StatCard, etc.)
  config/          # Configuración (API URL)
  constants/       # Labels y constantes de dominio
  context/         # Auth, Toast, Socket (React Context)
  hooks/           # Custom hooks (React Query wrappers)
  pages/
    auth/          # Login, registro, invitaciones
    landlord/      # Panel del propietario
    tenant/        # Panel del inquilino
  routes/          # Definición de rutas por rol
  types/           # Tipos TypeScript compartidos
  utils/           # Formateo, helpers
```
