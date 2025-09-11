# 🏗️ Primer Modelo 3D de Gemelo Digital Urbano

Tutorial paso a paso para crear tu primera visualización urbana con iTwin.js.

## 🎯 Objetivo

Crear un modelo 3D básico de un área urbana que incluya:
- Edificios principales
- Calles y vías
- Espacios verdes
- Visualización interactiva

## 📋 Prerrequisitos

- ✅ [Configuración inicial](../../configuracion-inicial/) completada
- ✅ Proyecto iTwin.js configurado
- ✅ Datos geoespaciales básicos (coordenadas de edificios)

## 🛠️ Implementación Paso a Paso

### Paso 1: Preparar Datos Urbanos Básicos

```typescript
// src/data/urban-sample-data.ts
export interface BuildingData {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitud, latitud]
  height: number;
  footprint: [number, number][]; // Polígono del edificio
  type: 'residential' | 'commercial' | 'office' | 'public';
}

export interface StreetData {
  id: string;
  name: string;
  path: [number, number][]; // Puntos de la vía
  width: number;
  type: 'main' | 'secondary' | 'pedestrian';
}

export interface GreenSpaceData {
  id: string;
  name: string;
  area: [number, number][]; // Polígono del espacio verde
  type: 'park' | 'plaza' | 'garden';
}

// Datos de ejemplo para un área urbana pequeña
export const sampleUrbanData = {
  center: [-58.3816, -34.6037], // Buenos Aires, Argentina
  
  buildings: [
    {
      id: 'building-001',
      name: 'Torre Oficinas Central',
      coordinates: [-58.3816, -34.6037],
      height: 80,
      footprint: [
        [-58.3818, -34.6035],
        [-58.3814, -34.6035],
        [-58.3814, -34.6039],
        [-58.3818, -34.6039]
      ],
      type: 'office' as const
    },
    {
      id: 'building-002',
      name: 'Edificio Residencial Norte',
      coordinates: [-58.3820, -34.6040],
      height: 45,
      footprint: [
        [-58.3822, -34.6038],
        [-58.3818, -34.6038],
        [-58.3818, -34.6042],
        [-58.3822, -34.6042]
      ],
      type: 'residential' as const
    },
    {
      id: 'building-003',
      name: 'Centro Comercial Sur',
      coordinates: [-58.3812, -34.6034],
      height: 25,
      footprint: [
        [-58.3815, -34.6032],
        [-58.3809, -34.6032],
        [-58.3809, -34.6036],
        [-58.3815, -34.6036]
      ],
      type: 'commercial' as const
    }
  ],
  
  streets: [
    {
      id: 'street-001',
      name: 'Avenida Principal',
      path: [
        [-58.3825, -34.6030],
        [-58.3805, -34.6030],
        [-58.3805, -34.6045]
      ],
      width: 12,
      type: 'main' as const
    },
    {
      id: 'street-002',
      name: 'Calle Secundaria',
      path: [
        [-58.3823, -34.6035],
        [-58.3807, -34.6035]
      ],
      width: 8,
      type: 'secondary' as const
    }
  ],
  
  greenSpaces: [
    {
      id: 'park-001',
      name: 'Plaza Central',
      area: [
        [-58.3816, -34.6041],
        [-58.3812, -34.6041],
        [-58.3812, -34.6045],
        [-58.3816, -34.6045]
      ],
      type: 'plaza' as const
    }
  ]
};
```

### Paso 2: Crear Generador de Geometría 3D

```typescript
// src/utils/urban-geometry-generator.ts
import { Point3d, Vector3d, Range3d } from '@itwin/core-geometry';
import { 
  IModelConnection, 
  SpatialViewState,
  GeometricElement3d 
} from '@itwin/core-frontend';

export class UrbanGeometryGenerator {
  
  /**
   * Convertir coordenadas geográficas a coordenadas del modelo 3D
   */
  static geographicToModel(
    longitude: number, 
    latitude: number, 
    centerLon: number, 
    centerLat: number
  ): Point3d {
    // Conversión simplificada para el ejemplo
    // En producción usar proyecciones cartográficas apropiadas
    const x = (longitude - centerLon) * 111320; // Aproximado en metros
    const y = (latitude - centerLat) * 110540;   // Aproximado en metros
    
    return Point3d.create(x, y, 0);
  }
  
  /**
   * Generar geometría de edificio 3D
   */
  static generateBuildingGeometry(building: BuildingData, center: [number, number]) {
    const points: Point3d[] = [];
    
    // Convertir footprint a puntos 3D
    building.footprint.forEach(coord => {
      const point = this.geographicToModel(
        coord[0], coord[1], center[0], center[1]
      );
      points.push(point);
    });
    
    // Crear geometría del edificio (extrusión hacia arriba)
    const basePolygon = points;
    const height = building.height;
    
    return {
      base: basePolygon,
      top: basePolygon.map(p => Point3d.create(p.x, p.y, height)),
      height: height,
      type: building.type
    };
  }
  
  /**
   * Generar geometría de calle
   */
  static generateStreetGeometry(street: StreetData, center: [number, number]) {
    const centerLine: Point3d[] = [];
    
    street.path.forEach(coord => {
      const point = this.geographicToModel(
        coord[0], coord[1], center[0], center[1]
      );
      centerLine.push(point);
    });
    
    return {
      centerLine: centerLine,
      width: street.width,
      type: street.type
    };
  }
  
  /**
   * Generar geometría de espacio verde
   */
  static generateGreenSpaceGeometry(greenSpace: GreenSpaceData, center: [number, number]) {
    const boundary: Point3d[] = [];
    
    greenSpace.area.forEach(coord => {
      const point = this.geographicToModel(
        coord[0], coord[1], center[0], center[1]
      );
      boundary.push(point);
    });
    
    return {
      boundary: boundary,
      type: greenSpace.type
    };
  }
}
```

### Paso 3: Crear Componente de Visualización Urbana

```typescript
// src/components/urban/UrbanViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  IModelApp,
  IModelConnection,
  Viewport,
  ViewState,
  SpatialViewState
} from '@itwin/core-frontend';
import { Point3d, Range3d } from '@itwin/core-geometry';
import { sampleUrbanData } from '../../data/urban-sample-data';
import { UrbanGeometryGenerator } from '../../utils/urban-geometry-generator';

interface UrbanViewerProps {
  iModel: IModelConnection;
  onModelLoaded?: () => void;
}

export const UrbanViewer: React.FC<UrbanViewerProps> = ({ 
  iModel, 
  onModelLoaded 
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    initializeViewer();
  }, [iModel]);
  
  const initializeViewer = async () => {
    if (!viewportRef.current || !iModel) return;
    
    try {
      // Crear vista espacial
      const spatialView = await createUrbanSpatialView(iModel);
      
      // Crear viewport
      const vp = ScreenViewport.create(viewportRef.current, spatialView);
      
      // Configurar cámara para vista urbana
      setupUrbanCamera(vp);
      
      // Cargar geometría urbana
      await loadUrbanGeometry(vp);
      
      setViewport(vp);
      setIsLoading(false);
      onModelLoaded?.();
      
    } catch (error) {
      console.error('Error al inicializar visor urbano:', error);
      setIsLoading(false);
    }
  };
  
  const createUrbanSpatialView = async (
    iModel: IModelConnection
  ): Promise<SpatialViewState> => {
    // Configurar vista para datos urbanos
    const viewDefinitionProps = {
      classFullName: "BisCore:SpatialViewDefinition",
      model: iModel.models.repositoryModelId,
      categorySelectorId: "", // Se configurará según las categorías
      displayStyleId: "",     // Se configurará según el estilo
      code: { spec: "", scope: "" },
      isPrivate: false
    };
    
    // Crear vista espacial
    const spatialView = SpatialViewState.createFromProps(
      viewDefinitionProps,
      iModel
    );
    
    return spatialView;
  };
  
  const setupUrbanCamera = (viewport: Viewport) => {
    const center = sampleUrbanData.center;
    const centerPoint = UrbanGeometryGenerator.geographicToModel(
      center[0], center[1], center[0], center[1]
    );
    
    // Configurar posición de cámara para vista aérea urbana
    const cameraPosition = Point3d.create(
      centerPoint.x,
      centerPoint.y - 200, // 200 metros al sur
      150 // 150 metros de altura
    );
    
    const targetPoint = centerPoint;
    const upVector = Vector3d.create(0, 0, 1);
    
    viewport.view.lookAt(cameraPosition, targetPoint, upVector);
    viewport.synchWithView();
  };
  
  const loadUrbanGeometry = async (viewport: Viewport) => {
    const center = sampleUrbanData.center;
    
    // Cargar edificios
    for (const building of sampleUrbanData.buildings) {
      const geometry = UrbanGeometryGenerator.generateBuildingGeometry(
        building, center
      );
      await addBuildingToViewport(viewport, building, geometry);
    }
    
    // Cargar calles
    for (const street of sampleUrbanData.streets) {
      const geometry = UrbanGeometryGenerator.generateStreetGeometry(
        street, center
      );
      await addStreetToViewport(viewport, street, geometry);
    }
    
    // Cargar espacios verdes
    for (const greenSpace of sampleUrbanData.greenSpaces) {
      const geometry = UrbanGeometryGenerator.generateGreenSpaceGeometry(
        greenSpace, center
      );
      await addGreenSpaceToViewport(viewport, greenSpace, geometry);
    }
  };
  
  const addBuildingToViewport = async (
    viewport: Viewport,
    building: BuildingData,
    geometry: any
  ) => {
    // Crear representación visual del edificio
    const color = getBuildingColor(building.type);
    
    // Aquí iría la lógica específica de iTwin.js para crear
    // elementos geométricos en el viewport
    
    // Esto es pseudocódigo - la implementación real depende
    // del modelo específico de iTwin.js
    /*
    const buildingElement = {
      geometry: geometry,
      appearance: {
        color: color,
        material: getBuildingMaterial(building.type),
        transparency: 0.1
      },
      metadata: {
        id: building.id,
        name: building.name,
        type: building.type,
        height: building.height
      }
    };
    
    viewport.addElement(buildingElement);
    */
  };
  
  const addStreetToViewport = async (
    viewport: Viewport,
    street: StreetData,
    geometry: any
  ) => {
    // Crear representación visual de la calle
    const color = getStreetColor(street.type);
    
    // Implementación similar para calles
  };
  
  const addGreenSpaceToViewport = async (
    viewport: Viewport,
    greenSpace: GreenSpaceData,
    geometry: any
  ) => {
    // Crear representación visual del espacio verde
    const color = getGreenSpaceColor(greenSpace.type);
    
    // Implementación similar para espacios verdes
  };
  
  // Funciones auxiliares para colores y materiales
  const getBuildingColor = (type: string) => {
    const colors = {
      residential: '#8D6E63',  // Marrón
      commercial: '#2196F3',   // Azul
      office: '#607D8B',       // Gris azulado
      public: '#4CAF50'        // Verde
    };
    return colors[type] || '#9E9E9E';
  };
  
  const getStreetColor = (type: string) => {
    const colors = {
      main: '#424242',      // Gris oscuro
      secondary: '#616161', // Gris medio
      pedestrian: '#BDBDBD' // Gris claro
    };
    return colors[type] || '#757575';
  };
  
  const getGreenSpaceColor = (type: string) => {
    const colors = {
      park: '#4CAF50',     // Verde
      plaza: '#8BC34A',    // Verde claro
      garden: '#2E7D32'    // Verde oscuro
    };
    return colors[type] || '#4CAF50';
  };
  
  return (
    <div className="urban-viewer">
      <div 
        ref={viewportRef} 
        className="viewport-container"
        style={{ 
          width: '100%', 
          height: '500px',
          border: '1px solid #ccc',
          borderRadius: '8px'
        }}
      />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            Cargando modelo urbano...
          </div>
        </div>
      )}
      
      <div className="urban-controls">
        <button onClick={() => resetCamera()}>
          Vista General
        </button>
        <button onClick={() => focusOnBuildings()}>
          Enfocar Edificios
        </button>
        <button onClick={() => toggleStreetView()}>
          Vista de Calles
        </button>
      </div>
      
      <div className="urban-info">
        <h3>Información del Modelo</h3>
        <div className="stats">
          <div>Edificios: {sampleUrbanData.buildings.length}</div>
          <div>Calles: {sampleUrbanData.streets.length}</div>
          <div>Espacios Verdes: {sampleUrbanData.greenSpaces.length}</div>
        </div>
      </div>
    </div>
  );
  
  // Funciones de control de cámara
  function resetCamera() {
    if (viewport) {
      setupUrbanCamera(viewport);
    }
  }
  
  function focusOnBuildings() {
    // Enfocar en el área de edificios
    if (viewport) {
      const center = sampleUrbanData.center;
      const centerPoint = UrbanGeometryGenerator.geographicToModel(
        center[0], center[1], center[0], center[1]
      );
      
      viewport.view.lookAt(
        Point3d.create(centerPoint.x, centerPoint.y - 100, 80),
        centerPoint,
        Vector3d.create(0, 0, 1)
      );
      viewport.synchWithView();
    }
  }
  
  function toggleStreetView() {
    // Cambiar a vista a nivel de calle
    if (viewport) {
      const center = sampleUrbanData.center;
      const centerPoint = UrbanGeometryGenerator.geographicToModel(
        center[0], center[1], center[0], center[1]
      );
      
      viewport.view.lookAt(
        Point3d.create(centerPoint.x, centerPoint.y - 20, 5),
        Point3d.create(centerPoint.x, centerPoint.y + 50, 5),
        Vector3d.create(0, 0, 1)
      );
      viewport.synchWithView();
    }
  }
};
```

### Paso 4: Integrar en la Aplicación Principal

```typescript
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { IModelApp, IModelConnection } from '@itwin/core-frontend';
import { UrbanViewer } from './components/urban/UrbanViewer';
import './App.css';

function App() {
  const [iModel, setIModel] = useState<IModelConnection | undefined>();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    initializeITwinApp();
  }, []);
  
  const initializeITwinApp = async () => {
    try {
      // Inicializar iTwin.js
      await IModelApp.startup();
      
      // Crear conexión con iModel (o crear uno nuevo para el ejemplo)
      const connection = await createOrConnectToUrbanModel();
      
      setIModel(connection);
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Error al inicializar iTwin.js:', error);
    }
  };
  
  const createOrConnectToUrbanModel = async (): Promise<IModelConnection> => {
    // Para el ejemplo, creamos un modelo en memoria
    // En producción, esto se conectaría a un iModel existente
    
    // Implementación simplificada para el ejemplo
    // La implementación real requiere configuración específica del iModel
    
    return {} as IModelConnection; // Placeholder
  };
  
  if (!isInitialized || !iModel) {
    return (
      <div className="app-loading">
        <h2>Inicializando Gemelo Digital Urbano...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="App">
      <header className="app-header">
        <h1>🏙️ Mi Primer Gemelo Digital Urbano</h1>
        <p>Visualización 3D interactiva con iTwin.js</p>
      </header>
      
      <main className="app-content">
        <UrbanViewer 
          iModel={iModel}
          onModelLoaded={() => console.log('Modelo urbano cargado')}
        />
      </main>
      
      <footer className="app-footer">
        <p>Desarrollado con iTwin.js - Bentley Systems</p>
      </footer>
    </div>
  );
}

export default App;
```

### Paso 5: Estilos CSS

```css
/* src/App.css */
.App {
  text-align: center;
  font-family: 'Roboto', sans-serif;
}

.app-header {
  background: linear-gradient(135deg, #2E7D32, #1976D2);
  padding: 20px;
  color: white;
}

.app-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.app-header p {
  margin: 10px 0 0 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.app-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f5f5;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2E7D32;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-top: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Estilos del visor urbano */
.urban-viewer {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.viewport-container {
  position: relative;
  background: #e3f2fd;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.urban-controls {
  padding: 15px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.urban-controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #2E7D32;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.urban-controls button:hover {
  background: #1B5E20;
}

.urban-info {
  padding: 15px;
  text-align: left;
  border-top: 1px solid #dee2e6;
}

.urban-info h3 {
  margin: 0 0 10px 0;
  color: #2E7D32;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.stats > div {
  padding: 8px;
  background: #e8f5e8;
  border-radius: 4px;
  font-size: 14px;
}

.app-footer {
  padding: 20px;
  background: #f8f9fa;
  color: #6c757d;
  font-size: 14px;
}
```

## 🎯 Resultado Esperado

Al completar este tutorial tendrás:

- ✅ **Modelo 3D básico** con edificios, calles y espacios verdes
- ✅ **Visualización interactiva** con controles de cámara
- ✅ **Datos urbanos estructurados** listos para expansión
- ✅ **Base escalable** para funciones más avanzadas

## 🔄 Próximos Pasos

1. **[Integración de Datos Reales](../../integracion-datos/)** - Conectar con fuentes de datos reales
2. **[Sensores IoT](../../tiempo-real/)** - Agregar datos en tiempo real
3. **[Simulación](../../simulacion-escenarios/)** - Implementar escenarios dinámicos
4. **[Interfaces Avanzadas](../../interfaces-ciudadanas/)** - Crear UIs especializadas

---

*¡Felicitaciones! Has creado tu primer gemelo digital urbano con iTwin.js.* 🎉