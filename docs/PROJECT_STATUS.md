# Estado del Proyecto — Gemelo Digital Urbano

Este documento resume el estado actual del repositorio, qué está implementado, qué falta por hacer y un plan sugerido por fases para alcanzar un despliegue funcional con iTwin, Cesium 3D Tiles y KPIs urbanos conectados a datos reales.

## Resumen ejecutivo

- Alcance: SPA en React/TypeScript para gemelo digital urbano con visor 3D (iTwin o simulación), reglas CGA-lite para generación procedural, servicios de KPIs, y backend de edición de iModel (simulado). Contenedores para despliegue (Nginx, Docker Compose) y servicios de apoyo (Mongo, Redis, InfluxDB, Grafana).
- Estado general: UI y servicios simulados están avanzados y permiten demostración. La integración “en vivo” con iTwin (auth, conexión a iModel, queries ECSQL), Cesium Curated Content y A/B con control de cambios está parcialmente documentada/maquetada pero no consolidada end-to-end.
- Riesgos clave: discrepancias de versión entre paquetes de @itwin (frontend v5.x vs backend v4.x), validación estricta de entorno que impide fallback si faltan IMJS_*, y falta del servicio de “scenarios”.

## Pila tecnológica

- Frontend: React 18, TypeScript 5, MUI v5, Webpack 5, Jest/ts-jest, ESLint.
- iTwin: @itwin/core-frontend, appui-react, web-viewer-react (v5.x en frontend). Backend de ejemplo con @itwin v4.2.0 (mismatch).
- Procedural/CGA-lite: paquete `packages/rules-cga-lite` y extensión `packages/viewer-extensions` (RuleEditor basado en Monaco).
- 3D Tiles: Servicios Cesium/Tiles (stubs) y configuración de rendimiento.
- Backend: `services/imodel-edit` (Express + zod), simula inserciones y tracking; `services/scenarios` referenciado pero sin punto de entrada.
- DevOps: Dockerfile (multi-stage → Nginx), nginx.conf (SPA + proxy), docker-compose (frontend, backend placeholder, Mongo, Redis, InfluxDB, Grafana, proxy).

## Estructura de carpetas (alto nivel)

- `src/` SPA: `index.tsx`, `App.tsx`, componentes (Viewer, Dashboards), y servicios (Connection, KPI, Cesium, Tiles, BIS Element, CGA Operators).
- `packages/` librerías: `rules-cga-lite` (engine, types), `viewer-extensions` (RuleEditor).
- `services/` backend: `imodel-edit` (Express, simulado), `scenarios/` (faltante de main).
- `docs/` documentación amplia de iTwin + este documento de estado.
- `data/samples/` geojson de ejemplo.
- Infra: `Dockerfile`, `nginx.conf`, `docker-compose.yml`.

## Estado por módulo

### SPA y UI
- Shell (`src/App.tsx`) y rutas listos. Sidebar, dashboards (Ciudadano, Admin, KPIs, Simulador, Datos en Tiempo Real) consumen servicios simulados.
- Notificaciones y “connection status” integrados.

### Visor 3D (UrbanViewer)
- Simulación por canvas avanzada con capas (sensores, tráfico, métricas) y paneles (Reglas, Escenarios, KPIs).
- Integración iTwin real: stubs/dynamic import; depende de configuración IMJS y auth; no está cableada de extremo a extremo.

### Reglas CGA-lite
- `packages/rules-cga-lite`: engine y tipos con zod; operadores básicos implementados en `CGAOperatorsService` (extrude/offset/setback/split/repeat/roof) con geometría simplificada.
- `packages/viewer-extensions/RuleEditor.tsx`: editor JSON basado en Monaco con muestras y validación.

### Servicios Frontend
- `ConnectionService`: simula WebSocket/eventos y “fetch/send”.
- `UrbanKPIService`: define KPIs y patrones de ECSQL para producción; actualmente genera datos simulados.
- `BISElementService`: maqueta pipeline BIS (GeometryStream/ElementProps/insert/save/named version) de forma segura para frontend.
- `CesiumContextService`/`TilesContextService`: configuración y acceso a tiles; parámetros de rendimiento y “bounds” regionales.

### Backend `services/imodel-edit`
- Express con zod; endpoints para inserción simulada, enable/disable change tracking, comparación A/B y creación de named versions.
- No conecta a iTwin “real” (briefcase/checkpoint, push/pull de changesets) y usa @itwin v4.2.0.

### Servicios de escenarios
- Estructura presente (`services/scenarios`) pero sin archivo principal (`src/index.ts`) ni endpoints.

### Infraestructura
- Dockerfile listo para build de SPA en Nginx. nginx.conf con SPA routing, compresión y headers de seguridad.
- docker-compose define frontend, backend placeholder y stack de datos/monitoring; faltan imágenes/servicios reales para iTwin o Cesium proxy.

## Variables de entorno (frontend)

Ver `.env.example` en la raíz para una plantilla completa. Claves relevantes detectadas en `src/utils/env-validation.ts`:

- Requeridas para modo iTwin real: `IMJS_AUTH_CLIENT_CLIENT_ID`, `IMJS_ITWIN_ID`, `IMJS_IMODEL_ID`.
- Opcionales: `IMJS_AUTH_CLIENT_REDIRECT_URI`, `IMJS_AUTH_CLIENT_LOGOUT_URI`, `IMJS_AUTH_CLIENT_SCOPE`, `IMJS_AUTH_AUTHORITY`.
- App: `REACT_APP_NAME`, `REACT_APP_VERSION`, `REACT_APP_API_BASE_URL`, `REACT_APP_WEBSOCKET_URL`.
- Ciudad: `REACT_APP_CITY_NAME`, `REACT_APP_CITY_LAT`, `REACT_APP_CITY_LNG`, `REACT_APP_CITY_ZOOM`.
- Flags: `REACT_APP_ENABLE_3D_VIEWER`, `REACT_APP_ENABLE_ITWIN_VIEWER`, `REACT_APP_ENABLE_RULES_ENGINE`, `REACT_APP_ENABLE_SCENARIOS`, `REACT_APP_ENABLE_SIMULATION_FALLBACK`.

Importante: la validación actual marca como “requeridas” las IMJS_* y lanza error si faltan. Esto puede impedir el fallback simulado. Mientras no se modifique esa validación, use valores de marcador válidos (no vacíos) como en `.env.example`.

## Gaps y riesgos identificados

- Versiones @itwin: frontend v5.x vs backend v4.2.0. Debe unificarse (recomendado: v5.x en ambos lados) para compatibilidad y soporte.
- Validación de entorno estricta: falla el arranque si faltan IMJS_*. Ajustar para permitir simulación sin error o proveer `.env` con placeholders.
- Integración iTwin real: falta wiring de autenticación PKCE, `IModelConnection`, queries ECSQL, y persistencia de cambios en backend.
- Cesium Curated Content: actualmente conceptual; validar tokens/licencias y el flujo de acceso.
- Servicio de escenarios: faltante de implementación (endpoints, modelo de datos y UI).
- Identidad/plaza: hay referencias a Buenos Aires y a Chancay; alinear branding y CRS/ubicaciones en toda la doc/app.

## Plan por fases (sugerido)

1) Fundaciones técnicas
   - Unificar versión @itwin a v5.x (frontend y backend). Revisar APIs rotas y ajustar imports/usos.
   - Revisar `validateEnvironment` para permitir fallback sin lanzar error, o documentar `.env` requerido.
   - Añadir `.env.example` (frontend y backend) y guía de configuración.

2) Visor iTwin en vivo
   - Implementar auth (PKCE) con `getITwinAuthConfig()` y `@itwin/web-viewer-react`.
   - Abrir `IModelConnection` con `IMJS_ITWIN_ID/IMODEL_ID` y mostrar modelo base.
   - Telemetría básica (carga, FPS, tiempos de conexión).

3) Backend iModel Edit v5
   - Migrar `services/imodel-edit` a @itwin v5.x. Implementar flujo real: briefcase, changesets, named versions.
   - Endpoints seguros (OIDC, CORS, rate limit) y logs estructurados.

4) KPIs con ECSQL
   - Conectar `UrbanKPIService` al `IModelConnection` y ejecutar ECSQL reales (evitar JsonProperties; usar clases BIS correctas).
   - Agregaciones por manzana/barrio y cache de resultados.

5) Cesium 3D Tiles
   - Integrar Cesium tokens de forma segura (servidor/proxy si aplica). Validar cobertura para OSM Buildings y Terrain.
   - Optimización de rendimiento (clipping region, screen-space error, culling).

6) Escenarios A/B y evidencia visual
   - Implementar `services/scenarios` (modelo, endpoints CRUD, versionado, comparación de changesets).
   - UI de comparación A/B con decoraciones y navegación elemento a elemento.

7) Observabilidad y DevOps
   - Grafana/InfluxDB con métricas clave; healthchecks y alertas.
   - CI/CD (lint, build, tests, contenedores, escaneo de vulnerabilidades) y despliegue.

8) Hardening y Docs
   - Seguridad (headers, CSP, secrets management). Accesibilidad y i18n.
   - Documentación de API y manual de operación.

## Cómo ejecutar (resumen)

- Desarrollo SPA: `npm start` en la raíz (Webpack Dev Server). Requiere `.env` presente para superar validación.
- Backend simulado: `npm run dev` en `services/imodel-edit` (Express con ts-node).
- Contenedores: `docker-compose up --build` (front en Nginx + stack auxiliar). Ajustar variables y puertos según `.env.example`.

## Próximos pasos inmediatos

1) Unificar @itwin a v5.x e instalar dependencias.  
2) Ajustar validación de entorno o usar `.env` con placeholders para permitir demo con fallback.  
3) Implementar bootstrap mínimo del visor iTwin real con auth PKCE y conexión a iModel.  
4) Crear el servicio `services/scenarios` (esqueleto + endpoints básicos).  

—

Última actualización: automática por análisis del repositorio en esta sesión.
