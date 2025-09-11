# Basic Viewer Examples

Ejemplos de código para crear visores básicos con iTwin.js.

## Contenido

### Simple iModel Viewer

#### Configuración Básica
```typescript
import { IModelApp, ScreenViewport, IModelConnection } from "@itwin/core-frontend";
import { UiFramework } from "@itwin/appui-react";

// Initialize the application
await IModelApp.startup();
await UiFramework.initialize();

// Open an iModel
const iModelConnection = await IModelConnection.openRemote(
  iTwinId,
  iModelId
);

// Create a viewport
const viewState = await iModelConnection.views.load(viewDefinitionId);
const viewport = ScreenViewport.create(canvas, viewState);
```

#### Visor Mínimo HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>Basic iTwin.js Viewer</title>
    <link rel="stylesheet" href="./viewer.css">
</head>
<body>
    <div id="sample-container">
        <canvas id="sample-canvas"></canvas>
    </div>
    <script src="./viewer.js"></script>
</body>
</html>
```

### Navegación Básica
- Orbit, pan, zoom
- View tools
- Element selection
- Property display

### Controles de Vista
- View flags
- Display styles
- Category visibility
- Model visibility

### Responsive Design
- Mobile adaptations
- Touch controls
- Screen size handling

### Ejemplos Completos
- [Simple Viewer App](./simple-viewer/)
- [Mobile Viewer](./mobile-viewer/)
- [Embedded Viewer](./embedded-viewer/)

---

*Estos ejemplos proporcionan la base para construir visores más complejos.*