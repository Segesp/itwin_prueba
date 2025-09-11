# 🚀 Configuración Inicial para Gemelos Digitales Urbanos

Guía completa para configurar el entorno de desarrollo de gemelos digitales urbanos con iTwin.js.

## 📋 Prerrequisitos

### Herramientas Básicas
```bash
# Node.js (versión 18 o superior)
node --version

# npm (incluido con Node.js)
npm --version

# Git para control de versiones
git --version
```

### Cuentas y Servicios Requeridos
- **[Bentley iTwin Platform](https://developer.bentley.com/)** - Cuenta de desarrollador
- **[iTwin.js Account](https://www.itwinjs.org/)** - Registro en la plataforma
- **Servicios de mapas** (opcional):
  - Mapbox API Key
  - Google Maps API Key
  - OpenStreetMap APIs

## 🛠️ Instalación del Entorno

### 1. Instalación de iTwin.js CLI

```bash
# Instalar herramientas globales de iTwin.js
npm install -g @itwin/create-app
npm install -g @itwin/cli

# Verificar instalación
itwin --version
```

### 2. Crear Proyecto de Gemelo Digital Urbano

```bash
# Crear nuevo proyecto especializado en gemelos urbanos
npx @itwin/create-app@latest mi-gemelo-urbano

# Navegar al directorio del proyecto
cd mi-gemelo-urbano

# Instalar dependencias específicas para gemelos urbanos
npm install
```

### 3. Dependencias Especializadas

```bash
# Bibliotecas para datos geoespaciales
npm install @itwin/core-geometry @itwin/core-common
npm install @itwin/core-frontend @itwin/core-backend

# Herramientas para visualización urbana
npm install @itwin/appui-react @itwin/components-react
npm install @itwin/ui-core @itwin/ui-components

# Integración con datos IoT y sensores
npm install @itwin/core-bentley @itwin/imodel-bridge
npm install @itwin/reality-data-client

# Análisis geoespacial
npm install turf @types/turf
npm install proj4 @types/proj4

# Visualización de datos
npm install d3 @types/d3
npm install chartjs chart.js
```

## ⚙️ Configuración del Proyecto

### 1. Estructura de Carpetas Recomendada

```
mi-gemelo-urbano/
├── src/
│   ├── components/          # Componentes UI especializados
│   │   ├── urban/          # Componentes específicos urbanos
│   │   ├── sensors/        # Widgets de sensores IoT
│   │   └── simulation/     # Herramientas de simulación
│   ├── data/               # Gestión de datos urbanos
│   │   ├── sources/        # Fuentes de datos
│   │   ├── processors/     # Procesadores de datos
│   │   └── schemas/        # Esquemas de datos
│   ├── services/           # Servicios de backend
│   │   ├── iot/           # Servicios IoT
│   │   ├── gis/           # Servicios GIS
│   │   └── simulation/    # Servicios de simulación
│   ├── models/            # Modelos 3D y datos
│   │   ├── buildings/     # Modelos de edificios
│   │   ├── infrastructure/ # Infraestructura urbana
│   │   └── terrain/       # Modelos de terreno
│   └── utils/             # Utilidades específicas
├── assets/                # Recursos estáticos
│   ├── textures/         # Texturas para modelos 3D
│   ├── icons/            # Iconografía urbana
│   └── data/             # Datos estáticos
├── config/               # Configuraciones
└── docs/                # Documentación del proyecto
```

### 2. Configuración de iTwin.js

```typescript
// src/config/itwin-config.ts
export const iTwinConfig = {
  // Configuración de la aplicación iTwin
  appId: process.env.REACT_APP_ITWIN_APP_ID,
  
  // URLs de servicios
  services: {
    iModelHubUrl: "https://api.bentley.com/imodelhub",
    connectUrl: "https://connect.bentley.com",
    buddiUrl: "https://buddi.bentley.com",
    realityDataUrl: "https://reality-data.bentley.com"
  },
  
  // Configuración específica para gemelos urbanos
  urbanTwin: {
    defaultViewport: {
      longitude: -58.3816, // Buenos Aires ejemplo
      latitude: -34.6037,
      zoom: 12,
      pitch: 45,
      bearing: 0
    },
    
    // Capas predeterminadas
    defaultLayers: [
      "buildings",
      "roads",
      "green-spaces",
      "public-transport"
    ],
    
    // Fuentes de datos urbanos
    dataSources: {
      traffic: process.env.REACT_APP_TRAFFIC_API,
      weather: process.env.REACT_APP_WEATHER_API,
      airQuality: process.env.REACT_APP_AIR_QUALITY_API
    }
  }
};
```

### 3. Variables de Entorno

```bash
# .env.local
REACT_APP_ITWIN_APP_ID=tu_app_id_aqui
REACT_APP_ITWIN_CLIENT_ID=tu_client_id_aqui

# APIs de datos urbanos
REACT_APP_TRAFFIC_API=tu_api_trafico
REACT_APP_WEATHER_API=tu_api_clima
REACT_APP_AIR_QUALITY_API=tu_api_calidad_aire

# Servicios de mapas
REACT_APP_MAPBOX_TOKEN=tu_token_mapbox
REACT_APP_GOOGLE_MAPS_KEY=tu_key_google_maps

# Base de datos (opcional)
DATABASE_URL=tu_string_conexion_bd
```

## 🎨 Configuración de UI Especializada

### 1. Tema Urbano Personalizado

```typescript
// src/styles/urban-theme.ts
export const urbanTheme = {
  colors: {
    // Paleta de colores para gemelos urbanos
    primary: '#2E7D32',      // Verde urbano
    secondary: '#1976D2',    // Azul tecnológico
    accent: '#FF9800',       // Naranja alerta
    
    // Colores de infraestructura
    buildings: '#8D6E63',    // Marrón edificios
    roads: '#607D8B',        // Gris carreteras
    greenSpaces: '#4CAF50',  // Verde espacios
    water: '#03A9F4',        // Azul agua
    
    // Estados de sensores
    sensorActive: '#4CAF50',
    sensorInactive: '#F44336',
    sensorWarning: '#FF9800'
  },
  
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    urbanDisplay: {
      fontSize: '2.5rem',
      fontWeight: 300,
      lineHeight: 1.2
    }
  }
};
```

### 2. Componentes UI Base

```typescript
// src/components/urban/UrbanDashboard.tsx
import React from 'react';
import { IModelApp, IModelConnection } from '@itwin/core-frontend';

interface UrbanDashboardProps {
  iModel: IModelConnection;
  title: string;
}

export const UrbanDashboard: React.FC<UrbanDashboardProps> = ({ 
  iModel, 
  title 
}) => {
  return (
    <div className="urban-dashboard">
      <header className="dashboard-header">
        <h1>{title}</h1>
        <div className="city-stats">
          {/* Estadísticas urbanas en tiempo real */}
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="viewport-container">
          {/* Visor 3D principal */}
        </div>
        
        <aside className="control-panel">
          {/* Panel de control urbano */}
        </aside>
      </main>
    </div>
  );
};
```

## 🔧 Configuración de Servicios

### 1. Servicio de Datos IoT

```typescript
// src/services/iot/IoTDataService.ts
export class IoTDataService {
  private sensors: Map<string, SensorData> = new Map();
  
  async connectToSensors(): Promise<void> {
    // Conectar con sensores urbanos
    // Implementación específica según proveedores
  }
  
  async getTrafficData(location: string): Promise<TrafficData> {
    // Obtener datos de tráfico en tiempo real
  }
  
  async getAirQualityData(coordinates: [number, number]): Promise<AirQualityData> {
    // Obtener datos de calidad del aire
  }
  
  async getWeatherData(cityId: string): Promise<WeatherData> {
    // Obtener datos meteorológicos
  }
}
```

### 2. Servicio de Simulación

```typescript
// src/services/simulation/UrbanSimulationService.ts
export class UrbanSimulationService {
  async simulateTrafficFlow(
    scenario: TrafficScenario
  ): Promise<SimulationResult> {
    // Simular flujos de tráfico
  }
  
  async simulateEmergencyEvacuation(
    emergencyPoint: Point3d,
    populationDensity: number
  ): Promise<EvacuationPlan> {
    // Simular evacuación de emergencia
  }
  
  async simulateUrbanGrowth(
    currentState: UrbanState,
    growthParameters: GrowthParams
  ): Promise<UrbanProjection> {
    // Simular crecimiento urbano
  }
}
```

## 🧪 Configuración de Testing

```bash
# Instalar herramientas de testing
npm install --save-dev jest @testing-library/react
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @types/jest

# Testing específico para datos geoespaciales
npm install --save-dev turf-test-helpers
```

## 🚀 Scripts de Desarrollo

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    
    "dev:urban": "npm start",
    "build:urban": "npm run build && npm run optimize-assets",
    "test:urban": "npm test -- --testPathPattern=urban",
    "lint:urban": "eslint src/ --ext .ts,.tsx",
    
    "data:import": "node scripts/import-urban-data.js",
    "sensors:connect": "node scripts/connect-iot-sensors.js",
    "optimize-assets": "node scripts/optimize-3d-assets.js"
  }
}
```

## ✅ Verificación de Instalación

```bash
# Ejecutar tests básicos
npm test

# Verificar conexión con iTwin Platform
npm run test:connection

# Compilar proyecto
npm run build

# Iniciar servidor de desarrollo
npm start
```

## 📚 Próximos Pasos

1. **[Integración de Datos](../integracion-datos/)** - Conectar fuentes de datos urbanos
2. **[Modelado 3D](../modelado-3d/)** - Crear modelos urbanos
3. **[Visualización Interactiva](../visualizacion-interactiva/)** - Desarrollar interfaces
4. **[Ejemplos Básicos](../ejemplos-basicos/)** - Implementar casos simples

---

*Con esta configuración tienes la base completa para desarrollar gemelos digitales urbanos con iTwin.js.* ⚙️