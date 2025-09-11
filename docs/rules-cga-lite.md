# CGA-lite Rule Engine Documentation

## Overview

The CGA-lite rule engine provides CityEngine-compatible procedural modeling capabilities for iTwin.js applications. It implements a subset of the CGA (Computer Generated Architecture) rule language with 8 core operators.

## Rule Language Grammar

### Rule Program Structure

```typescript
interface RuleProgram {
  name: string;                    // Human-readable rule name
  description?: string;            // Optional description
  attrs?: Record<string, any>;     // Initial attributes
  rules: Rule[];                   // Array of operations
}
```

### Core Operations

#### 1. Extrude - Create 3D Mass
```typescript
{ op: 'extrude', h: number, mode?: 'world'|'local' }
```
- **Purpose**: Convert 2D polygon to 3D solid by vertical extrusion
- **Parameters**: 
  - `h`: Height in world units
  - `mode`: Coordinate system (defaults to 'world')
- **CGA Equivalent**: `extrude(h)`

**Example**:
```json
{ "op": "extrude", "h": 25 }
```

#### 2. Offset - Expand/Contract Polygon
```typescript
{ op: 'offset', d: number, mode?: 'in'|'out' }
```
- **Purpose**: Shrink or expand polygon boundary
- **Parameters**:
  - `d`: Distance in world units
  - `mode`: 'in' (default) or 'out'
- **CGA Equivalent**: `offset(d, inside/outside)`

**Example**:
```json
{ "op": "offset", "d": 2.5, "mode": "in" }
```

#### 3. Setback - Inset Faces
```typescript
{ op: 'setback', d: number, faces?: string[] }
```
- **Purpose**: Create building setbacks on specific faces
- **Parameters**:
  - `d`: Setback distance
  - `faces`: Array of face names ['front', 'back', 'left', 'right']
- **CGA Equivalent**: `setback(distance)`

**Example**:
```json
{ "op": "setback", "d": 3, "faces": ["front", "back"] }
```

#### 4. Split - Divide Geometry
```typescript
{ op: 'split', axis: 'x'|'y'|'z', sizes: (number|'*')[] }
```
- **Purpose**: Subdivide geometry along axis
- **Parameters**:
  - `axis`: Division direction
  - `sizes`: Array of sizes, '*' means flexible
- **CGA Equivalent**: `split(axis) { size: rule | size: rule }`

**Example**:
```json
{ "op": "split", "axis": "z", "sizes": [4, "*", 2] }
```

#### 5. Repeat - Pattern Elements
```typescript
{ op: 'repeat', axis: 'x'|'y'|'z', step: number, limit?: number }
```
- **Purpose**: Repeat geometry elements along axis
- **Parameters**:
  - `axis`: Repetition direction
  - `step`: Distance between repetitions
  - `limit`: Maximum number of repetitions
- **CGA Equivalent**: `repeat(axis, distance)`

**Example**:
```json
{ "op": "repeat", "axis": "y", "step": 3.5, "limit": 8 }
```

#### 6. Roof - Add Roof Geometry
```typescript
{ op: 'roof', kind: 'flat'|'gable'|'hip'|'shed', pitch?: number, height?: number }
```
- **Purpose**: Generate roof geometry on top face
- **Parameters**:
  - `kind`: Roof type
  - `pitch`: Roof angle in degrees (0-90)
  - `height`: Override roof height
- **CGA Equivalent**: `roofGable()`, `roofHip()`, etc.

**Example**:
```json
{ "op": "roof", "kind": "gable", "pitch": 35 }
```

#### 7. Texture Tag - Assign Materials
```typescript
{ op: 'textureTag', tag: string, faces?: string[] }
```
- **Purpose**: Assign material/texture identifiers
- **Parameters**:
  - `tag`: Material identifier string
  - `faces`: Target faces (default: all)
- **CGA Equivalent**: `set(material.color.r, r)`

**Example**:
```json
{ "op": "textureTag", "tag": "brick_facade", "faces": ["front", "back"] }
```

#### 8. Attribute - Set Properties
```typescript
{ op: 'attr', name: string, value: string|number|boolean }
```
- **Purpose**: Set custom attributes on geometry
- **Parameters**:
  - `name`: Attribute name
  - `value`: Attribute value
- **CGA Equivalent**: `set(attr.name, value)`

**Example**:
```json
{ "op": "attr", "name": "dwellingUnits", "value": 4 }
```

## Rule Execution Model

### Execution Flow
1. **Initialization**: Create geometry from input polygon
2. **Sequential Processing**: Apply rules in order
3. **State Propagation**: Pass geometry and attributes between operations
4. **Result Generation**: Output final geometry with metadata

### Geometry Context
```typescript
interface GeometryContext {
  polygon: number[][];              // [x, y] coordinate pairs
  attributes: Record<string, any>;  // Starting attributes
  boundingBox: {                    // Spatial bounds
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}
```

### Execution Result
```typescript
interface RuleExecutionResult {
  success: boolean;
  geometry?: SimpleGeometry;        // Resulting geometry
  attributes: Record<string, any>;  // Final attributes  
  error?: string;                   // Error message if failed
  metadata?: {
    operationCount: number;         // Number of operations
    executionTimeMs: number;        // Execution duration
  };
}
```

## Sample Rule Programs

### 1. Basic Residential Tower
```json
{
  "name": "Residential Tower",
  "description": "Simple high-rise residential building",
  "attrs": {
    "buildingType": "residential",
    "units": 120
  },
  "rules": [
    { "op": "setback", "d": 2, "faces": ["front", "back", "left", "right"] },
    { "op": "extrude", "h": 80 },
    { "op": "roof", "kind": "flat" },
    { "op": "textureTag", "tag": "residential_facade" },
    { "op": "attr", "name": "height", "value": 80 }
  ]
}
```

### 2. Stepped Office Building  
```json
{
  "name": "Stepped Office",
  "description": "Office building with architectural setbacks",
  "attrs": {
    "buildingType": "office",
    "floors": 15
  },
  "rules": [
    { "op": "extrude", "h": 20 },
    { "op": "setback", "d": 3, "faces": ["front", "back"] },
    { "op": "extrude", "h": 20 },
    { "op": "setback", "d": 2, "faces": ["left", "right"] },
    { "op": "extrude", "h": 20 },
    { "op": "roof", "kind": "flat" },
    { "op": "textureTag", "tag": "office_glass" }
  ]
}
```

### 3. Traditional House
```json
{
  "name": "Traditional House",
  "description": "Single-family house with gable roof",
  "attrs": {
    "buildingType": "residential",
    "units": 1
  },
  "rules": [
    { "op": "setback", "d": 1.5, "faces": ["front", "back", "left", "right"] },
    { "op": "extrude", "h": 8 },
    { "op": "roof", "kind": "gable", "pitch": 35, "height": 4 },
    { "op": "textureTag", "tag": "residential_siding", "faces": ["front", "back", "left", "right"] },
    { "op": "textureTag", "tag": "roof_shingles", "faces": ["top"] },
    { "op": "attr", "name": "dwellingUnits", "value": 1 }
  ]
}
```

## CGA vs CGA-lite Comparison

| Feature | CGA (CityEngine) | CGA-lite | Status |
|---------|------------------|----------|--------|
| **Basic Geometry** | ✅ | ✅ | Complete |
| Extrude | `extrude(h)` | `{op:'extrude',h:30}` | ✅ |
| Offset | `offset(d, inside)` | `{op:'offset',d:2,mode:'in'}` | ✅ |
| **Subdivision** | ✅ | 🚧 | Partial |
| Split | `split(x) {~1:A\|~1:B}` | `{op:'split',axis:'x',sizes:['*','*']}` | 🚧 |
| Repeat | `repeat(x, 3) {A}` | `{op:'repeat',axis:'x',step:3}` | 🚧 |
| **Components** | ✅ | ❌ | Planned |
| Comp(faces) | `comp(f) {all:Facade}` | Not implemented | ❌ |
| **Advanced** | ✅ | ❌ | Future |
| Expressions | `attr.height * 2` | Static values only | ❌ |
| Functions | User-defined rules | No recursion | ❌ |
| Texturing | UV mapping | Tag-based only | 🚧 |

## API Usage

### Initializing the Engine
```typescript
import { RulesEngine, RuleProgram } from '@itwin-dt/rules-cga-lite';

const engine = new RulesEngine();
```

### Executing Rules
```typescript
const ruleProgram: RuleProgram = {
  name: "My Building",
  rules: [
    { op: 'extrude', h: 25 },
    { op: 'roof', kind: 'gable', pitch: 30 }
  ]
};

const context = {
  polygon: [[0,0], [10,0], [10,10], [0,10]], // Square footprint
  attributes: { zoning: 'residential' },
  boundingBox: { 
    min: {x: 0, y: 0, z: 0}, 
    max: {x: 10, y: 10, z: 0} 
  }
};

const result = await engine.executeProgram(ruleProgram, context);
if (result.success) {
  console.log('Generated geometry:', result.geometry);
  console.log('Final attributes:', result.attributes);
}
```

### Validation
```typescript
import { RuleProgramSchema } from '@itwin-dt/rules-cga-lite';

try {
  const validatedRule = RuleProgramSchema.parse(jsonRule);
  // Rule is valid
} catch (error) {
  console.error('Rule validation failed:', error.message);
}
```

## Integration with iTwin.js

### Geometry Conversion
The engine outputs `SimpleGeometry` objects that need conversion to iTwin.js geometry:

```typescript
// Future integration point
function convertToITwinGeometry(simpleGeom: SimpleGeometry): ITwinGeometry {
  // Convert vertices/faces to iTwin Point3d/Polygon3d/Solid
  // Implementation depends on iTwin.js geometry API
}
```

### iModel Persistence
Generated geometry should be inserted into iModels via backend services:

```typescript
// Backend service integration
async function persistToIModel(geometry: ITwinGeometry, attributes: any) {
  // Use IModelDb.elements.insertElement()
  // Assign to appropriate category and model
}
```

## Performance Considerations

### Current Limitations
- **JavaScript Execution**: All geometry ops in browser
- **No GPU Acceleration**: CPU-only calculations
- **Simple Algorithms**: Basic offset/extrude implementations

### Optimization Targets
- **Rule Execution**: < 100ms for typical building
- **Memory Usage**: < 1MB per 1000 buildings
- **Concurrent Rules**: Support batch processing

### Scalability Roadmap
1. **WebAssembly Port**: Performance-critical operations
2. **Web Workers**: Parallel rule execution
3. **GPU Compute**: Shader-based geometry generation
4. **iTwin Native**: Full integration with iTwin geometry engine

## Error Handling

### Common Errors
- **Invalid Polygon**: Self-intersecting or degenerate input
- **Negative Values**: Invalid height/distance parameters
- **Resource Limits**: Exceeding geometry complexity thresholds

### Error Recovery
- **Graceful Degradation**: Skip invalid operations, continue with remaining
- **Validation**: Pre-execution rule validation
- **Logging**: Detailed error messages with context

## Future Enhancements

### Planned Features
- **Advanced CGA Operators**: `comp()`, `subdiv()`, `texture()`
- **Rule Hierarchies**: Nested rule calls and recursion
- **Attribute Expressions**: `attr.height * 0.8`
- **Conditional Logic**: `case`, `if-else` statements
- **Material System**: PBR material assignment
- **Animation**: Rule execution visualization

### Research Areas
- **AI Integration**: ML-generated rules
- **Performance**: GPU-accelerated geometry
- **Interoperability**: Full CGA import/export