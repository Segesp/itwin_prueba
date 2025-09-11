import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  LocationOn as LocationIcon,
  Public as PublicIcon,
} from '@mui/icons-material';

// iTwin.js imports (we'll implement a simplified version for now)
// import { IModelConnection, ViewState } from '@itwin/core-frontend';

const UrbanViewer: React.FC = () => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerInitialized, setViewerInitialized] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [showBuildings, setShowBuildings] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showSensors, setShowSensors] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [currentView, setCurrentView] = useState('overview');

  // Buenos Aires coordinates and areas
  const buenosAiresCenter = { lat: -34.6118, lng: -58.3960 };
  const viewPresets = [
    { id: 'overview', name: 'Vista General', coordinates: buenosAiresCenter },
    { id: 'puerto_madero', name: 'Puerto Madero', coordinates: { lat: -34.6112, lng: -58.3631 } },
    { id: 'palermo', name: 'Palermo', coordinates: { lat: -34.5722, lng: -58.4314 } },
    { id: 'san_telmo', name: 'San Telmo', coordinates: { lat: -34.6214, lng: -58.3731 } },
    { id: 'recoleta', name: 'Recoleta', coordinates: { lat: -34.5875, lng: -58.3974 } },
  ];

  const layers = [
    { id: 'all', name: 'Todas las Capas', color: '#2196f3' },
    { id: 'buildings', name: 'Edificios', color: '#4caf50' },
    { id: 'infrastructure', name: 'Infraestructura', color: '#ff9800' },
    { id: 'transport', name: 'Transporte', color: '#9c27b0' },
    { id: 'environment', name: 'Ambiente', color: '#4caf50' },
    { id: 'utilities', name: 'Servicios Públicos', color: '#f44336' },
  ];

  useEffect(() => {
    initializeViewer();
    
    return () => {
      // Cleanup viewer
      if (viewerRef.current) {
        // In a real implementation, dispose of iTwin.js resources
      }
    };
  }, []);

  const initializeViewer = async () => {
    try {
      setIsLoading(true);
      
      // Simulate viewer initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (viewerRef.current) {
        // Create a simulated 3D viewer
        createSimulated3DViewer();
        setViewerInitialized(true);
      }
      
    } catch (error) {
      console.error('Error initializing viewer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSimulated3DViewer = () => {
    if (!viewerRef.current) return;

    // Clear any existing content
    viewerRef.current.innerHTML = '';

    // Create a simulated 3D environment
    const canvas = document.createElement('canvas');
    canvas.width = viewerRef.current.offsetWidth;
    canvas.height = viewerRef.current.offsetHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 40%, #98FB98 40%, #98FB98 100%)';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw a simplified city view
      drawSimplifiedCityView(ctx, canvas.width, canvas.height);
    }
    
    viewerRef.current.appendChild(canvas);

    // Add click interaction
    canvas.addEventListener('click', handleCanvasClick);
    
    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      if (viewerRef.current) {
        canvas.width = viewerRef.current.offsetWidth;
        canvas.height = viewerRef.current.offsetHeight;
        if (ctx) {
          drawSimplifiedCityView(ctx, canvas.width, canvas.height);
        }
      }
    });
    
    resizeObserver.observe(viewerRef.current);
  };

  const drawSimplifiedCityView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.4);
    
    // Draw ground
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, height * 0.4, width, height * 0.6);
    
    // Draw buildings (representing Buenos Aires skyline)
    const buildings = [
      { x: width * 0.1, width: width * 0.08, height: height * 0.3, color: '#4A4A4A' },
      { x: width * 0.2, width: width * 0.06, height: height * 0.25, color: '#5A5A5A' },
      { x: width * 0.28, width: width * 0.1, height: height * 0.35, color: '#6A6A6A' },
      { x: width * 0.4, width: width * 0.07, height: height * 0.28, color: '#4A4A4A' },
      { x: width * 0.5, width: width * 0.09, height: height * 0.32, color: '#5A5A5A' },
      { x: width * 0.62, width: width * 0.08, height: height * 0.27, color: '#6A6A6A' },
      { x: width * 0.72, width: width * 0.11, height: height * 0.38, color: '#4A4A4A' },
      { x: width * 0.85, width: width * 0.08, height: height * 0.29, color: '#5A5A5A' },
    ];

    buildings.forEach(building => {
      if (showBuildings) {
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(
          building.x + 5,
          height * 0.4 - building.height + 5,
          building.width,
          building.height
        );
        
        // Building
        ctx.fillStyle = building.color;
        ctx.fillRect(
          building.x,
          height * 0.4 - building.height,
          building.width,
          building.height
        );
        
        // Windows
        ctx.fillStyle = '#FFFF99';
        for (let i = 0; i < building.height / 15; i++) {
          for (let j = 0; j < building.width / 10; j++) {
            if (Math.random() > 0.3) { // Some windows are lit
              ctx.fillRect(
                building.x + j * 10 + 2,
                height * 0.4 - building.height + i * 15 + 2,
                6,
                8
              );
            }
          }
        }
      }
    });

    // Draw traffic (if enabled)
    if (showTraffic) {
      // Roads
      ctx.fillStyle = '#404040';
      ctx.fillRect(0, height * 0.5, width, 8);
      ctx.fillRect(0, height * 0.6, width, 8);
      
      // Vehicles
      const vehicles = 8;
      for (let i = 0; i < vehicles; i++) {
        const x = (width / vehicles) * i + Math.random() * 50;
        ctx.fillStyle = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'][Math.floor(Math.random() * 4)];
        ctx.fillRect(x, height * 0.5 - 3, 15, 6);
      }
    }

    // Draw sensors (if enabled)
    if (showSensors) {
      const sensors = 12;
      for (let i = 0; i < sensors; i++) {
        const x = Math.random() * width;
        const y = height * 0.4 + Math.random() * (height * 0.2);
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Sensor signal
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Draw labels
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.fillText('Buenos Aires - Gemelo Digital Urbano', 20, 30);
    ctx.font = '12px Arial';
    ctx.fillText(`Vista: ${viewPresets.find(v => v.id === currentView)?.name || 'Personalizada'}`, 20, 50);
  };

  const handleCanvasClick = (event: MouseEvent) => {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log(`Clicked at coordinates: ${x}, ${y}`);
    // In a real implementation, this would handle 3D picking and object selection
  };

  const handleZoomIn = () => {
    console.log('Zoom in');
    // Implement zoom functionality
  };

  const handleZoomOut = () => {
    console.log('Zoom out');
    // Implement zoom functionality
  };

  const handleCenter = () => {
    console.log('Center view');
    setCurrentView('overview');
    // Redraw with overview settings
    if (viewerRef.current) {
      createSimulated3DViewer();
    }
  };

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
    console.log(`Changing view to: ${viewId}`);
    // In a real implementation, this would animate the camera to the new position
    if (viewerRef.current) {
      createSimulated3DViewer();
    }
  };

  const handleLayerChange = (layerId: string) => {
    setSelectedLayer(layerId);
    console.log(`Changing layer to: ${layerId}`);
    // Update layer visibility
  };

  const handleFullscreen = () => {
    if (viewerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        viewerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar sx={{ backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <PublicIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Visor 3D - Buenos Aires
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleZoomIn} title="Acercar">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={handleZoomOut} title="Alejar">
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={handleCenter} title="Centrar">
            <CenterIcon />
          </IconButton>
          <IconButton onClick={handleFullscreen} title="Pantalla completa">
            <FullscreenIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative' }}>
        {/* Main Viewer */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {/* Loading */}
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 1000,
              }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Inicializando Visor 3D
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cargando modelo de Buenos Aires...
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* 3D Viewer Container */}
          <Box
            ref={viewerRef}
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f5f5f5',
              border: viewerInitialized ? 'none' : '2px dashed #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!viewerInitialized && !isLoading && (
              <Typography variant="h6" color="text.secondary">
                Visor 3D no inicializado
              </Typography>
            )}
          </Box>

          {/* Status overlay */}
          {viewerInitialized && (
            <Paper
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                <Typography variant="body2">
                  Buenos Aires, Argentina
                </Typography>
                <Chip label="En vivo" size="small" color="success" />
              </Box>
            </Paper>
          )}
        </Box>

        {/* Controls Panel */}
        <Paper
          sx={{
            width: 320,
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Panel Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LayersIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Controles</Typography>
            </Box>
          </Box>

          {/* Panel Content */}
          <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
            {/* View Presets */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Vistas Predefinidas
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {viewPresets.map(preset => (
                <Chip
                  key={preset.id}
                  label={preset.name}
                  clickable
                  variant={currentView === preset.id ? 'filled' : 'outlined'}
                  color={currentView === preset.id ? 'primary' : 'default'}
                  size="small"
                  onClick={() => handleViewChange(preset.id)}
                />
              ))}
            </Box>

            {/* Layer Selection */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Capas
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Seleccionar Capa</InputLabel>
              <Select
                value={selectedLayer}
                label="Seleccionar Capa"
                onChange={(e) => handleLayerChange(e.target.value)}
              >
                {layers.map(layer => (
                  <MenuItem key={layer.id} value={layer.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: layer.color,
                        }}
                      />
                      {layer.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Visibility Controls */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Visibilidad
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showBuildings}
                  onChange={(e) => {
                    setShowBuildings(e.target.checked);
                    if (viewerRef.current) createSimulated3DViewer();
                  }}
                />
              }
              label="Edificios"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showTraffic}
                  onChange={(e) => {
                    setShowTraffic(e.target.checked);
                    if (viewerRef.current) createSimulated3DViewer();
                  }}
                />
              }
              label="Tráfico"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showSensors}
                  onChange={(e) => {
                    setShowSensors(e.target.checked);
                    if (viewerRef.current) createSimulated3DViewer();
                  }}
                />
              }
              label="Sensores IoT"
              sx={{ mb: 2 }}
            />

            {/* Opacity Control */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Transparencia: {opacity}%
            </Typography>
            <Slider
              value={opacity}
              onChange={(_, value) => setOpacity(value as number)}
              min={0}
              max={100}
              step={5}
              sx={{ mb: 3 }}
            />

            {/* Information */}
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Haga clic en el visor para interactuar con elementos urbanos.
              Use los controles para personalizar la visualización.
            </Alert>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default UrbanViewer;