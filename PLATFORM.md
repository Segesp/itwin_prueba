# 🏙️ Plataforma Web - Gemelo Digital Urbano Buenos Aires

Plataforma web completa para el gemelo digital urbano de Buenos Aires desarrollada con iTwin.js.

## 🚀 Características Principales

### 🌟 Visualización 3D Avanzada
- **Visor 3D interactivo** de Buenos Aires con iTwin.js
- **Modelos detallados** de edificios, infraestructura y espacios verdes
- **Navegación inmersiva** por barrios y puntos de interés
- **Capas temáticas** (transporte, ambiente, servicios públicos)
- **Controles de visualización** (zoom, rotación, transparencia)

### 📊 Monitoreo en Tiempo Real
- **Red de sensores IoT** distribuidos por la ciudad
- **Datos ambientales** (temperatura, humedad, calidad del aire)
- **Métricas de tráfico** (flujo vehicular, congestión, velocidades)
- **Indicadores urbanos** (energía, agua, residuos)
- **Alertas automáticas** para situaciones críticas

### 👥 Portal Ciudadano
- **Reportes ciudadanos** para problemas urbanos
- **Participación en planificación** urbana
- **Consulta de proyectos** en desarrollo
- **Notificaciones** de eventos relevantes
- **Interfaz intuitiva** para usuarios no técnicos

### 🏛️ Dashboard Administrativo
- **Panel de control** para gestión urbana
- **KPIs en tiempo real** de la ciudad
- **Gestión de reportes** ciudadanos
- **Monitoreo de sistemas** y servicios
- **Herramientas de análisis** avanzado

### 🎮 Simulador de Escenarios
- **Simulación de tráfico** y movilidad urbana
- **Escenarios de emergencia** (incendios, inundaciones)
- **Impacto de nuevos desarrollos** urbanos
- **Eventos masivos** y su planificación
- **Análisis predictivo** con machine learning

## 🛠️ Tecnologías Utilizadas

### Core Framework
- **iTwin.js 4.5+** - Plataforma principal de visualización 3D
- **React 18** - Framework de interfaz de usuario
- **TypeScript** - Desarrollo con tipado estático
- **Material-UI** - Componentes de diseño

### Visualización y Mapas
- **Cesium** - Renderizado 3D avanzado
- **Three.js** - Gráficos 3D adicionales
- **Leaflet** - Mapas 2D interactivos

### Datos y Conectividad
- **Socket.io** - Comunicación en tiempo real
- **Axios** - Cliente HTTP para APIs
- **Chart.js** - Visualización de datos

### Desarrollo y Construcción
- **Webpack 5** - Bundling y optimización
- **Babel** - Transpilación de código
- **ESLint** - Linting y calidad de código

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── Home/            # Página principal
│   ├── UrbanViewer/     # Visor 3D
│   ├── CitizenDashboard/# Portal ciudadano
│   ├── AdminDashboard/  # Dashboard administrativo
│   ├── ScenarioSimulator/# Simulador de escenarios
│   ├── RealTimeData/    # Datos en tiempo real
│   ├── Settings/        # Configuración
│   └── Sidebar/         # Navegación lateral
├── services/            # Servicios y lógica de negocio
│   ├── ConnectionService.ts    # Gestión de conexiones
│   ├── NotificationService.ts  # Sistema de notificaciones
│   └── BuenosAiresDataService.ts # Datos específicos de Buenos Aires
├── types/               # Definiciones TypeScript
│   └── common.ts        # Tipos comunes
├── styles/              # Estilos CSS
│   ├── global.css       # Estilos globales
│   └── App.css          # Estilos de la aplicación
├── utils/               # Utilidades
├── App.tsx              # Componente principal
└── index.tsx            # Punto de entrada
```

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 16+ 
- npm o yarn
- Navegador moderno con soporte WebGL

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Segesp/itwin_prueba.git
cd itwin_prueba
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con sus credenciales de iTwin.js
```

4. **Iniciar en modo desarrollo**
```bash
npm start
```

5. **Abrir en navegador**
```
http://localhost:3000
```

### Construcción para Producción

```bash
# Construir aplicación optimizada
npm run build

# Servir archivos estáticos
npm run serve
```

## 🌍 Contexto de Buenos Aires

### Coordenadas de Referencia
- **Centro**: -34.6118, -58.3960
- **Límites**: Norte: -34.5265, Sur: -34.7051, Este: -58.3275, Oeste: -58.5314

### Barrios Incluidos
- **Puerto Madero** - Distrito financiero moderno
- **San Telmo** - Barrio histórico y cultural
- **Palermo** - Zona residencial y comercial
- **Recoleta** - Área residencial premium
- **Belgrano** - Zona residencial tradicional

### Datos Urbanos Simulados
- **Población**: 3,075,646 habitantes
- **Densidad**: 15,057 hab/km²
- **Sensores IoT**: 100+ distribuidos
- **Red de transporte**: Subte, buses, Metrobus, bicisendas

## 🔧 Configuración de iTwin.js

### Credenciales Requeridas
```javascript
// En .env
ITWIN_CLIENT_ID=your_client_id
ITWIN_REDIRECT_URI=http://localhost:3000/signin-callback
ITWIN_SCOPE=imodels:read
```

### Inicialización
```typescript
await IModelApp.startup({
  applicationId: "gemelo-digital-urbano-buenos-aires",
  applicationVersion: "1.0.0",
});
```

## 📊 Funcionalidades Implementadas

### ✅ Completadas
- [x] Estructura base de la aplicación
- [x] Sistema de navegación y routing
- [x] Visor 3D con controles básicos
- [x] Portal ciudadano para reportes
- [x] Dashboard administrativo con métricas
- [x] Simulador de escenarios urbanos
- [x] Monitoreo de datos en tiempo real
- [x] Sistema de notificaciones
- [x] Configuración personalizable
- [x] Diseño responsive

### 🔄 En Desarrollo
- [ ] Integración completa con iTwin.js
- [ ] Backend para persistencia de datos
- [ ] Autenticación y autorización
- [ ] APIs de integración externa
- [ ] Análisis avanzado con ML
- [ ] Realidad aumentada (AR/VR)

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Test con coverage
npm run test:coverage

# Tests end-to-end
npm run test:e2e
```

## 📦 Deploy

### Desarrollo
```bash
npm start
```

### Staging
```bash
npm run build:staging
npm run deploy:staging
```

### Producción
```bash
npm run build
npm run deploy:production
```

## 🔗 APIs y Servicios

### Endpoints Principales
- `/api/sensors` - Datos de sensores IoT
- `/api/traffic` - Información de tráfico
- `/api/reports` - Reportes ciudadanos
- `/api/simulations` - Escenarios de simulación
- `/api/metrics` - Métricas urbanas agregadas

### WebSocket Events
- `sensor_update` - Actualizaciones de sensores
- `traffic_update` - Cambios de tráfico
- `alert_created` - Nuevas alertas
- `simulation_progress` - Progreso de simulaciones

## 🎯 Casos de Uso

### Para Ciudadanos
1. **Consultar estado del tráfico** en tiempo real
2. **Reportar problemas** urbanos (baches, luminarias, etc.)
3. **Visualizar proyectos** de desarrollo urbano
4. **Participar en encuestas** de planificación
5. **Recibir alertas** de eventos que los afecten

### Para Planificadores Urbanos
1. **Analizar impacto** de nuevas construcciones
2. **Simular escenarios** de tráfico y eventos
3. **Monitorear métricas** de calidad urbana
4. **Gestionar reportes** ciudadanos
5. **Planificar recursos** y servicios

### Para Administradores
1. **Supervisar sistemas** de la ciudad
2. **Responder a emergencias** de manera coordinada
3. **Optimizar servicios** públicos
4. **Analizar tendencias** urbanas
5. **Tomar decisiones** basadas en datos

## 🤝 Contribución

1. Fork el proyecto
2. Cree una rama para su feature (`git checkout -b feature/AmazingFeature`)
3. Commit sus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abra un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

**Segesp** - Desarrollo de gemelos digitales urbanos

## 🙏 Agradecimientos

- **Bentley Systems** por iTwin.js
- **Ciudad de Buenos Aires** por datos abiertos
- **Comunidad de desarrolladores** de gemelos digitales

---

*Transformando Buenos Aires en una ciudad más inteligente y conectada* 🌟