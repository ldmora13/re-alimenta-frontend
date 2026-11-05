# Re-Alimenta Frontend

Aplicación web de página única (SPA) para la plataforma **Re-Alimenta**, diseñada para conectar empresas con excedentes de alimentos (donantes), organizaciones sociales que los aprovechan (receptoras) y transportistas encargados de su traslado (repartidores).

## Tecnologías y Herramientas

- **Framework / Runtime:** [React 19](https://react.dev/) con [TypeScript](https://www.typescriptlang.org/)
- **Empaquetador y Dev Server:** [Vite 8](https://vite.dev/)
- **Enrutamiento:** [React Router 7](https://reactrouter.com/) con rutas públicas, privadas y guardias de rol
- **Estado del servidor y caché:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Estilos y Maquetación:** [Tailwind CSS v4](https://tailwindcss.com/) con tokens visuales personalizados y tipografías Fraunces e Inter
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Linter:** ESLint 10 con reglas específicas para React Hooks y TypeScript

## Estructura del Código

La aplicación sigue una arquitectura orientada a funcionalidades (*feature-driven architecture*):

```text
src/
├── features/
│   ├── auth/              # Páginas de Login/Registro, AuthProvider, interceptor de sesión y guardias
│   ├── workspace/         # WorkspaceProvider: resuelve la organización activa, membresía y rol
│   ├── donations/         # Dashboard, Catálogo filtrable, Creación de donación y Vista de detalle
│   ├── deliveries/        # Listado de entregas, seguimiento de hitos de ruta y panel del repartidor (Courier)
│   ├── organizations/     # Cliente API para consulta y mutación de organizaciones y direcciones
│   ├── settings/          # Configuración de la organización, gestión de sedes y equipo de trabajo
│   ├── onboarding/        # Registro guiado para nuevas organizaciones y creación de primera sede
│   ├── admin/             # Vista administrativa de supervisión y verificación de organizaciones
│   ├── landing/           # Landing page informativa de impacto y bienvenida
│   ├── design/            # Muestrario de componentes y sistema de diseño visual
│   └── not-found/         # Manejo de rutas inexistentes (404)
├── shared/
│   ├── components/        # Componentes reutilizables: Timeline, RouteMap, Toast, Badges, Botones, etc.
│   ├── layout/            # AppShell con navegación lateral, barra superior y menú de usuario
│   ├── lib/               # Cliente API centralizado (`api.ts`), formateadores y QueryClient
│   └── types.ts           # Definiciones TypeScript de entidades y respuestas paginadas
├── App.tsx                # Declaración de rutas y jerarquía de protección
├── index.css              # Variables de diseño, fuentes y clases utilitarias de Tailwind
└── main.tsx               # Montaje del DOM e inicialización de proveedores raíz
```

## Configuración y Variables de Entorno

Crear un archivo `.env` en la raíz de `frontend/` (o configurar en el entorno de despliegue):

```dotenv
# URL base del backend NestJS (opcional en desarrollo; por defecto Vite usa el proxy a /api)
VITE_API_URL=http://localhost:3000/api

# Correos con privilegios de administración de plataforma (separados por coma)
VITE_PLATFORM_ADMIN_EMAILS=admin@realimenta.org,supervisor@realimenta.org
```

> **Proxy de desarrollo:** `vite.config.ts` incluye un proxy que redirige automáticamente todas las peticiones a `/api` hacia `http://localhost:3000`, evitando problemas de CORS en entorno local sin necesidad de configurar URLs absolutas.

## Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en http://localhost:3001
npm run dev

# 3. Compilar para producción (TypeScript check + Vite bundle)
npm run build

# 4. Previsualizar la compilación de producción
npm run preview

# 5. Ejecutar análisis estático (linter)
npm run lint
```

## Rutas y Acceso por Rol

| Ruta | Acceso | Descripción |
| :--- | :--- | :--- |
| `/` | Público | Landing page informativa con propuesta de valor y pasos del servicio |
| `/login` | Invitado | Inicio de sesión con correo y contraseña |
| `/registro` | Invitado | Registro de nuevo usuario y creación de perfil |
| `/onboarding` | Autenticado | Asignación inicial de organización, tipo y dirección |
| `/panel` | Autenticado | Dashboard operativo personalizado según el tipo de organización |
| `/donaciones` | Autenticado | Catálogo general de donaciones disponibles y solicitudes |
| `/donaciones/nueva` | Donantes | Publicación de excedentes alimentarios con desglose de ítems |
| `/donaciones/:id` | Autenticado | Ficha técnica de la donación, opción de reserva y trazabilidad |
| `/entregas` | Autenticado | Listado y filtro de entregas (programadas, en tránsito, completadas) |
| `/entregas/:id` | Autenticado | Detalle logístico, mapa de ruta y confirmación de hitos |
| `/courier` | Repartidores | Panel optimizado para dispositivos móviles con entregas asignadas al usuario |
| `/configuracion` | Admins de Org | Gestión de datos fiscales, sedes y miembros del equipo |
| `/admin/verificaciones`| Superadmin | Panel de verificación y auditoría de organizaciones |
| `/diseno` | Autenticado | Catálogo de referencia del sistema de diseño (tokens, badges, botones) |

## Integración con el Backend

1. **Sesión JWT:** El cliente almacena el token de Supabase Auth en `localStorage` y lo adjunta automáticamente en el encabezado `Authorization: Bearer <token>`.
2. **Refresco automático:** Si la API devuelve un código `401`, el cliente intenta renovar el token mediante `POST /api/auth/refresh` y reintenta la petición de forma transparente.
3. **Manejo de errores:** Todos los errores de la API se capturan y formatean mediante la clase `ApiError`, mostrando alertas contextuales sin bloquear la navegación.
