# CityEngine Parity Implementation with iTwin.js

## Overview

This document outlines the implementation of CityEngine-like capabilities in the iTwin Urban Digital Twin platform, providing 1:1 feature parity with ArcGIS CityEngine for procedural urban modeling.

## Feature Mapping: CityEngine → iTwin.js

| CityEngine Feature | iTwin.js Implementation | Status | Location |
|-------------------|------------------------|--------|----------|
| **CGA Rules Engine** | `packages/rules-cga-lite` | ✅ MVP | Rule DSL with 8 operators |
| **Rule Assignment** | UI Panel + Selection System | ✅ MVP | Viewer integration |
| **Street Networks** | `packages/urban-ops` | 🚧 Planned | OSM import + editing |
| **Lot Subdivision** | BSP/Voronoi algorithms | 🚧 Planned | Automated parcelation |
| **Scenarios** | `services/scenarios` | 🚧 Planned | A/B comparison |
| **3D Tiles Context** | Cesium integration | 🚧 Planned | OSM Buildings + Terrain |
| **Metrics/KPIs** | ECSQL queries | 🚧 Planned | FAR, heights, land use |

## Current Implementation Status

### ✅ Phase 1: Infrastructure & CGA-lite Rules Engine (COMPLETED)

**What's Working:**
- **Web Application**: React app with iTwin Viewer integration
- **CGA-lite Engine**: 8 procedural operators implemented
- **Rule Editor**: Monaco-based JSON editor with validation
- **Geometry Selection**: Click-to-select buildings for rule application
- **Simulated Viewer**: Fallback when iTwin packages unavailable

**CGA Operators Implemented:**
```typescript
// Basic geometric operations
{ op: 'extrude', h: number }           // Create 3D mass from 2D footprint
{ op: 'offset', d: number, mode: 'in'|'out' }  // Shrink/expand polygon
{ op: 'setback', d: number, faces: [...] }      // Inset specific faces

// Advanced subdivision
{ op: 'split', axis: 'x'|'y'|'z', sizes: [...] }  // Divide geometry
{ op: 'repeat', axis: 'x'|'y'|'z', step: number } // Repeat elements

// Architectural elements  
{ op: 'roof', kind: 'flat'|'gable'|'hip', pitch: number }

// Material/attribution
{ op: 'textureTag', tag: string, faces: [...] }
{ op: 'attr', name: string, value: any }
```

**Sample Rules Available:**
- Simple Tower (basic extrusion)
- Stepped Building (setbacks + multiple extrusions)  
- House with Gable Roof (residential with roof)
- Commercial Strip (low-rise with parking setback)
- Mixed Use Building (ground commercial + upper residential)

### 🚧 Phase 2: Urban Operations (IN PROGRESS)

**Planned Features:**
- OSM street network import (GeoJSON)
- Automated lot subdivision using BSP/Voronoi
- Street editing tools (width, setbacks, intersections)
- Parcel attribute management (zoning, FAR, height limits)

### 🚧 Phase 3: Scenario Management (PLANNED)

**Target Capabilities:**
- Multiple scenario channels (A/B/C comparison)
- Changed Elements API integration for diffs
- Visual highlighting of modifications
- Scenario persistence and sharing

### 🚧 Phase 4: 3D Context & KPIs (PLANNED)

**Integration Points:**
- Cesium World Terrain + OSM Buildings as context
- ECSQL query system for urban metrics
- Thematic visualization (FAR, height, land use)
- Real-time KPI dashboards

## Architecture

### Monorepo Structure
```
/apps
  /city-dt-web           # React + iTwin Viewer (main UI)
/packages  
  /rules-cga-lite        # CGA-like rule engine ✅
  /urban-ops            # Streets/lots/zoning 🚧
  /viewer-extensions    # UI widgets (RuleEditor, etc.) ✅
/services
  /imodel-editor        # Backend for iModel editing 🚧  
  /scenarios           # Scenario management 🚧
/data
  /samples             # Test GeoJSON files ✅
```

### Technology Stack
- **Frontend**: React 18, Material-UI, TypeScript
- **3D Viewer**: iTwin.js (with simulated fallback)
- **Rule Engine**: Zod validation + custom geometry operations
- **Editor**: Monaco Editor for rule authoring
- **Data**: GeoJSON samples for Buenos Aires

## Usage Examples

### 1. Applying a Simple Tower Rule

```json
{
  "name": "Simple Tower", 
  "description": "Basic extrusion to create building mass",
  "attrs": {
    "buildingType": "residential",
    "floors": 10
  },
  "rules": [
    { "op": "extrude", "h": 30 },
    { "op": "textureTag", "tag": "building_facade" },
    { "op": "attr", "name": "buildingHeight", "value": 30 }
  ]
}
```

### 2. Creating a Stepped Building

```json
{
  "name": "Stepped Building",
  "description": "Building with setbacks creating stepped profile",
  "rules": [
    { "op": "extrude", "h": 20 },
    { "op": "setback", "d": 3, "faces": ["front", "back"] },
    { "op": "extrude", "h": 20 },
    { "op": "setback", "d": 2, "faces": ["left", "right"] },
    { "op": "extrude", "h": 20 },
    { "op": "roof", "kind": "flat" }
  ]
}
```

## Current Limitations vs. CityEngine

### Missing Features (Roadmap)
- **Advanced CGA Operations**: `comp()`, `subdiv()`, `texture()` functions
- **Attribute Inheritance**: Parent-child attribute passing
- **Rule Hierarchies**: Nested rule calls and recursion  
- **Advanced Geometry**: Curved surfaces, complex roofs
- **Material System**: PBR materials and texture mapping
- **Animation**: Rule execution visualization

### Performance Considerations
- **Target**: 100k-250k building instances at >30fps
- **Current**: Simulated viewer, geometry ops in JavaScript
- **Future**: GPU-accelerated geometry, iTwin native rendering

## Getting Started

### 1. Install and Run
```bash
npm install
npm start
# Navigate to http://localhost:3000/viewer
```

### 2. Using the Rule Editor
1. Click **"Rules"** button in iTwin Viewer
2. Load a sample rule from dropdown
3. Click on buildings in viewer to select geometry
4. Click **"Apply Rule"** to execute

### 3. Testing Sample Data
- Sample parcels: `/data/samples/parcels.geojson`
- Street network: `/data/samples/osm-roads.geojson`  
- Zoning data: `/data/samples/zoning.geojson`

## Next Steps

1. **Complete iTwin.js Integration**: Add proper authentication and iModel connectivity
2. **Implement Street/Lots Module**: OSM import and subdivision algorithms
3. **Add Scenario Management**: Changed Elements API integration
4. **Performance Optimization**: GPU acceleration and LOD systems
5. **Advanced CGA Features**: Complete rule language implementation

## Contributing

See individual package READMEs for development guidelines:
- `packages/rules-cga-lite/README.md` - Rule engine development
- `packages/urban-ops/README.md` - Urban operations
- `apps/city-dt-web/README.md` - Main application

## References

- [CityEngine CGA Documentation](https://doc.arcgis.com/en/cityengine/latest/help/help-cga-modeling-overview.htm)
- [iTwin.js Developer Portal](https://developer.bentley.com/)
- [Buenos Aires Open Data](https://data.buenosaires.gob.ar/)