# AppUI React Documentation

Documentación completa del framework de aplicación React de iTwin.js.

## Contenido

### Framework Overview
El framework AppUI React proporciona la estructura base para aplicaciones iTwin.js:

- **ConfigurableUIContent** - Contenedor principal de la aplicación
- **Frontstage** - Configuración de pantallas principales
- **Backstage** - Menú de navegación principal
- **Widget** - Componentes modulares de UI
- **Tool** - Herramientas interactivas

### Core Components

#### Frontstage Management
```typescript
import { ConfigurableCreateInfo, FrontstageProvider } from "@itwin/appui-react";

class MyFrontstage extends FrontstageProvider {
  public get frontstage() {
    return {
      id: "MyFrontstage",
      defaultTool: SelectionTool,
      defaultLayout: "SingleContent",
      contentGroup: myContentGroup,
    };
  }
}
```

#### Widget Configuration
- Widget areas and zones
- Widget state management
- Widget communication
- Custom widget development

#### Status Bar
- Status fields
- Progress indicators
- Message display
- Custom status items

### Advanced Features
- Theme management
- Keyboard shortcuts
- Context menus
- Modal dialogs
- Notification system

### Best Practices
- Application structure
- Performance optimization
- Accessibility guidelines
- Testing strategies

---

*Para ejemplos completos, consulta [UI Customization Examples](../../examples-samples/ui-customization/).*