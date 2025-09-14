import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Drawer,
  Divider,
  CircularProgress
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
  Code as CodeIcon,
  CompareArrows as CompareIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Import environment validation
import { 
  validateEnvironmentOnStartup, 
  shouldUseSimulationFallback,
  getITwinAuthConfig,
  getITwinPlatformConfig 
} from '../../utils/env-validation';

// Import iTwin.js components (will be implemented as the deps install)
// Note: These imports will work once we install the iTwin packages
let Viewer: any;
let IModelApp: any;

// Import our services
import { CesiumCuratedContentService } from '../../services/CesiumCuratedContentService';

// Temporary placeholder interfaces until packages are ready
interface RuleProgram {
  name: string;
  description?: string;
  attrs?: Record<string, any>;
  rules: any[];
}

interface RuleEditorProps {
  onRuleApply?: (rule: RuleProgram) => Promise<void>;
  onRuleValidate?: (rule: RuleProgram) => Promise<boolean>;
  selectedGeometry?: any;
  disabled?: boolean;
}

// Temporary Rule Editor component placeholder
const RuleEditor: React.FC<RuleEditorProps> = ({ selectedGeometry, disabled }) => {
  return (
    <Paper sx={{ height: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        CGA-lite Rule Editor
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Rule engine integration in progress. This will provide CityEngine-like procedural rule capabilities.
      </Alert>
      {selectedGeometry && (
        <Alert severity="success" sx={{ fontSize: '0.8rem' }}>
          Geometry selected! Rule application will be available once the engine is complete.
        </Alert>
      )}
      {disabled && (
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
          Editor disabled while viewer is loading.
        </Alert>
      )}
    </Paper>
  );
};

interface UrbanViewerProps {}

const UrbanViewer: React.FC<UrbanViewerProps> = () => {
  // State management
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerInitialized, setViewerInitialized] = useState(false);
  const [iTwinInitialized, setITwinInitialized] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [showBuildings, setShowBuildings] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showSensors, setShowSensors] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [currentView, setCurrentView] = useState('overview');
  const [selectedGeometry, setSelectedGeometry] = useState<any>(null);
  
  // Curated Content state
  const [showWorldTerrain, setShowWorldTerrain] = useState(true);
  const [showOSMBuildings, setShowOSMBuildings] = useState(true);
  const [curatedContentService] = useState(() => CesiumCuratedContentService.getInstance());
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [contentAttachments, setContentAttachments] = useState<any[]>([]);
  
  // Panel states
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [scenarioCompareOpen, setScenarioCompareOpen] = useState(false);
  const [kpiPanelOpen, setKpiPanelOpen] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Buenos Aires coordinates and areas (updated to Chancay for proper location)
  // Note: Updated coordinates to Chancay, Peru as per requirements
  const chancayCenter = { lat: -11.57, lng: -77.27 };
  const viewPresets = [
    { id: 'overview', name: 'Vista General', coordinates: chancayCenter },
    { id: 'puerto_chancay', name: 'Puerto Chancay', coordinates: { lat: -11.5654, lng: -77.2681 } },
    { id: 'centro_chancay', name: 'Centro Chancay', coordinates: { lat: -11.5742, lng: -77.2703 } },
    { id: 'zona_industrial', name: 'Zona Industrial', coordinates: { lat: -11.5691, lng: -77.2745 } },
    { id: 'zona_residencial', name: 'Zona Residencial', coordinates: { lat: -11.5783, lng: -77.2658 } },
  ];

  const layers = [
    { id: 'all', name: 'Todas las Capas', color: '#2196f3' },
    { id: 'buildings', name: 'Edificios', color: '#4caf50' },
    { id: 'infrastructure', name: 'Infraestructura', color: '#ff9800' },
    { id: 'transport', name: 'Transporte', color: '#9c27b0' },
    { id: 'environment', name: 'Ambiente', color: '#4caf50' },
    { id: 'utilities', name: 'Servicios Públicos', color: '#f44336' },
  ];

  // Initialize viewer
  useEffect(() => {
    // Validate environment on startup
    try {
      validateEnvironmentOnStartup();
    } catch (error) {
      console.error('Environment validation failed:', error);
      setError(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      return;
    }

    initializeViewer();
    
    return () => {
      // Cleanup iTwin.js resources
      if (iTwinInitialized && IModelApp) {
        IModelApp.shutdown();
      }
    };
  }, []);

  const initializeViewer = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if simulation fallback should be used (addresses BLOCKER 6)
      const useSimulation = shouldUseSimulationFallback();
      
      if (useSimulation) {
        console.warn('Using simulation fallback - iTwin.js not fully configured or explicitly disabled');
        await initializeSimulatedViewer();
        return;
      }

      // Try to initialize iTwin.js viewer with proper configuration
      try {
        await initializeITwinViewer();
      } catch (iTwinError) {
        console.warn('Failed to initialize iTwin.js viewer, falling back to simulated viewer:', iTwinError);
        setError('iTwin.js viewer unavailable - using simulated environment');
        await initializeSimulatedViewer();
      }
      
    } catch (error) {
      console.error('Error initializing viewer:', error);
      setError(`Error initializing viewer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeITwinViewer = async () => {
    // This will be implemented when iTwin.js packages are available
    // For now, we'll use try-catch to handle missing dependencies gracefully
    try {
      // Check if we're in a browser environment and dependencies exist
      if (typeof window === 'undefined') {
        throw new Error('Server-side rendering not supported for iTwin.js');
      }

      // Get validated configuration
      const authConfig = getITwinAuthConfig();
      const platformConfig = getITwinPlatformConfig();
      
      if (!authConfig || !platformConfig) {
        throw new Error('iTwin.js configuration not available');
      }

      // Try to dynamically import iTwin.js modules (using variables to prevent webpack from bundling)
      const iTwinPackage = '@itwin/web-viewer-react';
      const corePackage = '@itwin/core-frontend';
      
      const [iTwinModule, coreModule] = await Promise.all([
        import(/* webpackIgnore: true */ iTwinPackage).catch(() => null),
        import(/* webpackIgnore: true */ corePackage).catch(() => null)
      ]);
      
      if (!iTwinModule || !coreModule) {
        throw new Error('iTwin.js packages not available');
      }

      Viewer = iTwinModule.Viewer;
      IModelApp = coreModule.IModelApp;
      
      // Initialize iTwin.js application with validated configuration
      await IModelApp.startup({
        authorizationClient: authConfig
      });
      
      setITwinInitialized(true);
      setViewerInitialized(true);
      
      console.log('iTwin.js viewer initialized successfully with configuration:', {
        iTwinId: platformConfig.iTwinId,
        iModelId: platformConfig.iModelId,
        authEnabled: true
      });
      
      // Configure and setup Curated Content for Chancay
      await setupCuratedContentForChancay();
      
    } catch (error) {
      throw new Error(`Failed to initialize iTwin.js: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const initializeSimulatedViewer = async () => {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (viewerRef.current) {
      createSimulated3DViewer();
      setViewerInitialized(true);
    }

    // Setup simulated Curated Content context
    await setupCuratedContentForChancay();
  };

  /**
   * Setup Curated Content for Chancay using official Cesium APIs
   * Implements World Terrain + OSM Buildings with performance optimization
   */
  const setupCuratedContentForChancay = async (accessToken?: string) => {
    try {
      console.log('🌍 Setting up Curated Content for Chancay, Peru...');
      
      // Configure the service with authentication if available
      if (accessToken) {
        curatedContentService.configure({
          token: accessToken,
          worldTerrain: {
            enabled: showWorldTerrain,
            regionFilter: {
              south: -11.7,   // Chancay region bounds
              north: -11.4,
              west: -77.4,
              east: -77.1
            }
          },
          osmBuildings: {
            enabled: showOSMBuildings,
            regionFilter: {
              south: -11.7,
              north: -11.4,
              west: -77.4,
              east: -77.1
            }
          }
        });
      }

      // Setup complete Chancay 3D context (in production this would use real DisplayStyle ID)
      const mockDisplayStyleId = 'chancay-display-style-001';
      const attachments = await curatedContentService.setupChancayContext(mockDisplayStyleId);
      setContentAttachments(attachments);

      // Start performance monitoring
      startPerformanceMonitoring();
      
      console.log('✅ Curated Content setup completed for Chancay:', {
        attachments: attachments.length,
        successful: attachments.filter(a => a.success).length,
        worldTerrain: showWorldTerrain,
        osmBuildings: showOSMBuildings
      });
      
    } catch (error) {
      console.error('❌ Failed to setup Curated Content:', error);
    }
  };

  /**
   * Toggle OSM Buildings visibility
   * This is the main feature requested for this implementation
   */
  const handleOSMBuildingsToggle = async (enabled: boolean) => {
    try {
      setShowOSMBuildings(enabled);
      console.log(`🏢 OSM Buildings ${enabled ? 'enabled' : 'disabled'}`);

      if (iTwinInitialized) {
        // In production, this would call real iTwin.js APIs:
        // - Get the current DisplayStyle
        // - Update OSM Buildings attachment based on enabled state
        // - Refresh the viewer
        console.log('Production: Would update DisplayStyle OSM Buildings attachment');
      } else {
        // Update simulated viewer
        if (viewerRef.current) {
          createSimulated3DViewer();
        }
      }

      // Log performance impact
      const metrics = await curatedContentService.monitorPerformance();
      console.log('📊 Performance after OSM Buildings toggle:', {
        fps: metrics.fps,
        tilesLoaded: metrics.tilesLoaded,
        memoryUsage: metrics.memoryUsage
      });

    } catch (error) {
      console.error('❌ Error toggling OSM Buildings:', error);
    }
  };

  /**
   * Toggle World Terrain visibility
   */
  const handleWorldTerrainToggle = async (enabled: boolean) => {
    try {
      setShowWorldTerrain(enabled);
      console.log(`🏔️ World Terrain ${enabled ? 'enabled' : 'disabled'}`);

      if (iTwinInitialized) {
        console.log('Production: Would update DisplayStyle World Terrain attachment');
      } else {
        if (viewerRef.current) {
          createSimulated3DViewer();
        }
      }
    } catch (error) {
      console.error('❌ Error toggling World Terrain:', error);
    }
  };

  /**
   * Start performance monitoring for 3D Tiles
   * Essential for maintaining ≥30 FPS with city-scale content
   */
  const startPerformanceMonitoring = () => {
    const monitorInterval = setInterval(async () => {
      if (viewerInitialized) {
        const metrics = await curatedContentService.monitorPerformance();
        setPerformanceMetrics(metrics);
        
        // Log warnings if performance is below target
        if (metrics.fps < 30) {
          console.warn('⚠️ Performance below target: FPS =', metrics.fps);
        }
      }
    }, 2000); // Monitor every 2 seconds

    // Cleanup function would be called on component unmount
    return () => clearInterval(monitorInterval);
  };

  const createSimulated3DViewer = () => {
    if (!viewerRef.current) return;

    // Clear any existing content
    viewerRef.current.innerHTML = '';

    // Create a simulated 3D environment with enhanced urban features
    const canvas = document.createElement('canvas');
    canvas.width = viewerRef.current.offsetWidth;
    canvas.height = viewerRef.current.offsetHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 40%, #98FB98 40%, #98FB98 100%)';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawEnhancedCityView(ctx, canvas.width, canvas.height);
    }
    
    viewerRef.current.appendChild(canvas);

    // Add click interaction for geometry selection
    canvas.addEventListener('click', handleCanvasClick);
    
    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      if (viewerRef.current) {
        canvas.width = viewerRef.current.offsetWidth;
        canvas.height = viewerRef.current.offsetHeight;
        if (ctx) {
          drawEnhancedCityView(ctx, canvas.width, canvas.height);
        }
      }
    });
    
    resizeObserver.observe(viewerRef.current);
  };

  const drawEnhancedCityView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky with gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.4);
    
    // Draw World Terrain (enhanced when enabled)
    if (showWorldTerrain) {
      // Enhanced terrain with elevation and texture
      const terrainGradient = ctx.createLinearGradient(0, height * 0.35, 0, height);
      terrainGradient.addColorStop(0, '#8FBC8F');  // Sage green for hills
      terrainGradient.addColorStop(0.3, '#90EE90'); // Light green
      terrainGradient.addColorStop(0.7, '#DEB887'); // Burlywood for beach areas
      terrainGradient.addColorStop(1, '#F4A460');   // Sandy brown
      ctx.fillStyle = terrainGradient;
      ctx.fillRect(0, height * 0.35, width, height * 0.65);
      
      // Add terrain elevation contours for Chancay topography
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'; // Brown contours
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const y = height * (0.4 + i * 0.1);
        ctx.moveTo(0, y);
        // Create wavy contour lines
        for (let x = 0; x <= width; x += 20) {
          const waveY = y + Math.sin((x / width) * Math.PI * 2) * (5 - i);
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
    } else {
      // Simple flat ground when terrain is disabled
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, height * 0.4, width, height * 0.6);
    }
    
    // Draw OSM Buildings (enhanced city context when enabled)
    if (showOSMBuildings) {
      // Enhanced city blocks representing OSM Buildings dataset
      const osmBuildings = [
        // Port area buildings
        { x: width * 0.05, y: height * 0.5, width: width * 0.2, height: height * 0.3, type: 'port', buildings: 8 },
        // Commercial district
        { x: width * 0.3, y: height * 0.48, width: width * 0.25, height: height * 0.35, type: 'commercial', buildings: 12 },
        // Residential areas
        { x: width * 0.6, y: height * 0.52, width: width * 0.15, height: height * 0.25, type: 'residential', buildings: 15 },
        // Industrial zone
        { x: width * 0.78, y: height * 0.55, width: width * 0.18, height: height * 0.3, type: 'industrial', buildings: 6 },
      ];

      osmBuildings.forEach((block) => {
        // Draw block base with OSM-style details
        ctx.fillStyle = '#E5E5E5';
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Add block outline
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        
        // Draw individual OSM buildings within block
        const buildingWidth = block.width / Math.ceil(Math.sqrt(block.buildings));
        const buildingDepth = block.height / Math.ceil(Math.sqrt(block.buildings));
        
        for (let i = 0; i < block.buildings; i++) {
          const row = Math.floor(i / Math.ceil(Math.sqrt(block.buildings)));
          const col = i % Math.ceil(Math.sqrt(block.buildings));
          
          const buildingX = block.x + col * buildingWidth + 2;
          const buildingY = block.y + row * buildingDepth + 2;
          const actualWidth = buildingWidth - 4;
          const actualDepth = buildingDepth - 4;
          
          // Building height based on type (OSM building classification)
          let buildingHeight;
          let buildingColor;
          switch (block.type) {
            case 'port':
              buildingHeight = (0.3 + Math.random() * 0.4) * actualDepth; // Lower port buildings
              buildingColor = '#4682B4'; // Steel blue
              break;
            case 'commercial':
              buildingHeight = (0.6 + Math.random() * 0.5) * actualDepth; // Medium commercial
              buildingColor = '#2F4F4F'; // Dark slate gray
              break;
            case 'residential':
              buildingHeight = (0.4 + Math.random() * 0.3) * actualDepth; // Lower residential
              buildingColor = '#8B4513'; // Saddle brown
              break;
            case 'industrial':
              buildingHeight = (0.5 + Math.random() * 0.6) * actualDepth; // Varied industrial
              buildingColor = '#696969'; // Dim gray
              break;
            default:
              buildingHeight = actualDepth * 0.5;
              buildingColor = '#5A5A5A';
          }
          
          const finalY = buildingY + actualDepth - buildingHeight;
          
          // Building shadow for 3D effect
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fillRect(buildingX + 2, finalY + 2, actualWidth, buildingHeight);
          
          // Main building structure with OSM-style variation
          ctx.fillStyle = buildingColor;
          ctx.fillRect(buildingX, finalY, actualWidth, buildingHeight);
          
          // Add building details (windows, etc.) for larger buildings
          if (actualWidth > 15 && buildingHeight > 20) {
            // Windows grid
            ctx.fillStyle = Math.random() > 0.3 ? '#FFFF99' : '#333333';
            const windowCols = Math.max(1, Math.floor(actualWidth / 8));
            const windowRows = Math.max(1, Math.floor(buildingHeight / 10));
            
            for (let row = 0; row < windowRows; row++) {
              for (let col = 0; col < windowCols; col++) {
                if (Math.random() > 0.4) {
                  ctx.fillRect(
                    buildingX + col * 8 + 2,
                    finalY + row * 10 + 2,
                    4,
                    6
                  );
                }
              }
            }
          }
          
          // Building outline for clarity
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(buildingX, finalY, actualWidth, buildingHeight);
        }
        
        // Add block label for OSM Buildings identification
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(
          `OSM ${block.type.charAt(0).toUpperCase() + block.type.slice(1)}`, 
          block.x + 5, 
          block.y - 5
        );
      });
    } else if (showBuildings) {
      // Show simplified buildings when OSM is disabled but local buildings are enabled
      const cityBlocks = [
        { x: width * 0.05, y: height * 0.45, width: width * 0.15, height: height * 0.4, buildings: 6 },
        { x: width * 0.25, y: height * 0.5, width: width * 0.2, height: height * 0.35, buildings: 8 },
        { x: width * 0.5, y: height * 0.48, width: width * 0.18, height: height * 0.37, buildings: 7 },
        { x: width * 0.75, y: height * 0.52, width: width * 0.2, height: height * 0.33, buildings: 5 },
      ];

      cityBlocks.forEach((block, blockIndex) => {
        // Draw simplified block base
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Draw individual buildings within block
        const buildingWidth = block.width / block.buildings;
        for (let i = 0; i < block.buildings; i++) {
          const buildingHeight = (0.6 + Math.random() * 0.4) * block.height;
          const buildingX = block.x + i * buildingWidth + 2;
          const buildingY = block.y + block.height - buildingHeight;
          
          // Building shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fillRect(buildingX + 3, buildingY + 3, buildingWidth - 4, buildingHeight);
          
          // Building main structure
          const buildingColors = ['#4A4A4A', '#5A5A5A', '#6A6A6A', '#7A7A7A'];
          ctx.fillStyle = buildingColors[Math.floor(Math.random() * buildingColors.length)];
          ctx.fillRect(buildingX, buildingY, buildingWidth - 4, buildingHeight);
          
          // Basic windows
          ctx.fillStyle = Math.random() > 0.3 ? '#FFFF99' : '#333333';
          const windowCols = Math.floor((buildingWidth - 4) / 8);
          const windowRows = Math.floor(buildingHeight / 12);
          
          for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
              if (Math.random() > 0.4) {
                ctx.fillRect(
                  buildingX + col * 8 + 2,
                  buildingY + row * 12 + 2,
                  5,
                  8
                );
              }
            }
          }
        }
      });
    }

    // Draw transportation network
    if (showTraffic) {
      // Main streets
      ctx.fillStyle = '#404040';
      ctx.fillRect(0, height * 0.6, width, 12);
      ctx.fillRect(0, height * 0.75, width, 12);
      ctx.fillRect(width * 0.3, height * 0.4, 12, height * 0.5);
      ctx.fillRect(width * 0.7, height * 0.4, 12, height * 0.5);
      
      // Street markings
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.606);
      ctx.lineTo(width, height * 0.606);
      ctx.moveTo(0, height * 0.756);
      ctx.lineTo(width, height * 0.756);
      ctx.stroke();
      
      // Vehicles with animation effect
      const vehicles = 12;
      for (let i = 0; i < vehicles; i++) {
        const x = (width / vehicles) * i + (Date.now() / 50) % 100;
        const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x % width, height * 0.6 - 4, 20, 8);
      }
    }

    // Draw IoT sensors network
    if (showSensors) {
      const sensors = 15;
      for (let i = 0; i < sensors; i++) {
        const x = (width / sensors) * i + Math.random() * 30;
        const y = height * 0.45 + Math.random() * (height * 0.15);
        
        // Sensor node
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Sensor signal (animated)
        const pulseRadius = 10 + (Math.sin(Date.now() / 500 + i) * 5);
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Data connection lines
        if (i > 0) {
          const prevX = (width / sensors) * (i - 1) + Math.random() * 30;
          const prevY = height * 0.45 + Math.random() * (height * 0.15);
          ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(prevX, prevY);
          ctx.stroke();
        }
      }
    }

    // Draw UI overlays
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Chancay Digital Twin Platform - iTwin Integration', 20, 35);
    
    ctx.font = '14px Arial';
    ctx.fillText(`View: ${viewPresets.find(v => v.id === currentView)?.name || 'Custom'}`, 20, 55);
    
    // Show Curated Content status
    ctx.font = '12px Arial';
    ctx.fillStyle = showWorldTerrain ? '#228B22' : '#888';
    ctx.fillText(`🏔️ World Terrain: ${showWorldTerrain ? 'ON' : 'OFF'}`, 20, 75);
    
    ctx.fillStyle = showOSMBuildings ? '#228B22' : '#888';
    ctx.fillText(`🏢 OSM Buildings: ${showOSMBuildings ? 'ON' : 'OFF'}`, 20, 90);
    
    // Show performance metrics if available
    if (performanceMetrics) {
      ctx.fillStyle = performanceMetrics.fps >= 30 ? '#228B22' : '#FF6B6B';
      ctx.fillText(`FPS: ${performanceMetrics.fps}`, width - 120, 35);
      
      ctx.fillStyle = '#333';
      ctx.fillText(`Tiles: ${performanceMetrics.tilesLoaded}`, width - 120, 50);
      ctx.fillText(`Memory: ${performanceMetrics.memoryUsage}MB`, width - 120, 65);
    }
    
    if (error) {
      ctx.fillStyle = '#FF6B6B';
      ctx.font = '12px Arial';
      ctx.fillText(error, 20, 110);
    }
    
    // Draw selection indicator if geometry is selected
    if (selectedGeometry) {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.strokeRect(selectedGeometry.x - 5, selectedGeometry.y - 5, selectedGeometry.width + 10, selectedGeometry.height + 10);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = '12px Arial';
      ctx.fillText('Selected for Rules', selectedGeometry.x, selectedGeometry.y - 10);
    }
  };

  const handleCanvasClick = (event: MouseEvent) => {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Simulate geometry selection
    setSelectedGeometry({
      x: x - 25,
      y: y - 25,
      width: 50,
      height: 50,
      type: 'building_footprint'
    });
    
    console.log(`Selected geometry at coordinates: ${x}, ${y}`);
    
    // Redraw to show selection
    if (viewerRef.current) {
      createSimulated3DViewer();
    }
  };

  // Rule application handler
  const handleRuleApply = useCallback(async (rule: RuleProgram) => {
    if (!selectedGeometry) {
      throw new Error('No geometry selected');
    }
    
    console.log('Applying rule:', rule.name, 'to geometry:', selectedGeometry);
    
    // Simulate rule application delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would:
    // 1. Convert selected geometry to iTwin format
    // 2. Execute rule using RulesEngine
    // 3. Insert resulting geometry into iModel
    // 4. Refresh the viewer
    
    console.log('Rule applied successfully');
  }, [selectedGeometry]);

  // Rule validation handler
  const handleRuleValidate = useCallback(async (rule: RuleProgram) => {
    console.log('Validating rule:', rule.name);
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return rule.rules.length > 0;
  }, []);

  // Navigation handlers
  const handleZoomIn = () => console.log('Zoom in');
  const handleZoomOut = () => console.log('Zoom out');
  const handleCenter = () => {
    setCurrentView('overview');
    if (viewerRef.current) createSimulated3DViewer();
  };

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
    if (viewerRef.current) createSimulated3DViewer();
  };

  const handleLayerChange = (layerId: string) => {
    setSelectedLayer(layerId);
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

  // Animation loop for dynamic elements and performance monitoring
  useEffect(() => {
    let animationFrame: number;
    let performanceCleanup: (() => void) | undefined;
    
    const animate = () => {
      if (viewerRef.current && viewerInitialized) {
        createSimulated3DViewer();
      }
      animationFrame = requestAnimationFrame(animate);
    };
    
    // Start performance monitoring when viewer is initialized
    if (viewerInitialized) {
      performanceCleanup = startPerformanceMonitoring();
    }
    
    if (showTraffic || showSensors) {
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (performanceCleanup) {
        performanceCleanup();
      }
    };
  }, [showTraffic, showSensors, viewerInitialized, selectedGeometry, showWorldTerrain, showOSMBuildings]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar sx={{ backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <PublicIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          iTwin Urban Digital Twin - Chancay, Peru
        </Typography>
        
        {/* Extension Panel Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
          <Button
            variant={ruleEditorOpen ? 'contained' : 'outlined'}
            size="small"
            startIcon={<CodeIcon />}
            onClick={() => setRuleEditorOpen(!ruleEditorOpen)}
          >
            Rules
          </Button>
          <Button
            variant={scenarioCompareOpen ? 'contained' : 'outlined'}
            size="small"
            startIcon={<CompareIcon />}
            onClick={() => setScenarioCompareOpen(!scenarioCompareOpen)}
          >
            Scenarios
          </Button>
          <Button
            variant={kpiPanelOpen ? 'contained' : 'outlined'}
            size="small"
            startIcon={<AssessmentIcon />}
            onClick={() => setKpiPanelOpen(!kpiPanelOpen)}
          >
            KPIs
          </Button>
        </Box>
        
        {/* Viewer Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleZoomIn} title="Zoom In">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={handleZoomOut} title="Zoom Out">
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={handleCenter} title="Center">
            <CenterIcon />
          </IconButton>
          <IconButton onClick={handleFullscreen} title="Fullscreen">
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
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                zIndex: 1000,
              }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Initializing Chancay Digital Twin Platform
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Loading Chancay 3D model, Curated Content and urban data...
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* iTwin Viewer Container */}
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
                iTwin Viewer not initialized
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
                  Chancay, Peru
                </Typography>
                <Chip 
                  label={iTwinInitialized ? 'iTwin Live' : 'Simulated'} 
                  size="small" 
                  color={iTwinInitialized ? 'success' : 'warning'} 
                />
                {(showWorldTerrain || showOSMBuildings) && (
                  <Chip 
                    label={`Curated Content ${showWorldTerrain && showOSMBuildings ? 'Full' : 'Partial'}`} 
                    size="small" 
                    color="info" 
                  />
                )}
                {selectedGeometry && (
                  <Chip 
                    label="Geometry Selected" 
                    size="small" 
                    color="primary" 
                  />
                )}
                {performanceMetrics && performanceMetrics.fps < 30 && (
                  <Chip 
                    label={`${performanceMetrics.fps} FPS`}
                    size="small" 
                    color="error" 
                  />
                )}
              </Box>
            </Paper>
          )}
        </Box>

        {/* Rule Editor Panel */}
        <Drawer
          anchor="right"
          open={ruleEditorOpen}
          onClose={() => setRuleEditorOpen(false)}
          variant="persistent"
          sx={{
            '& .MuiDrawer-paper': {
              width: 480,
              position: 'relative',
              height: '100%',
            },
          }}
        >
          <RuleEditor
            onRuleApply={handleRuleApply}
            onRuleValidate={handleRuleValidate}
            selectedGeometry={selectedGeometry}
            disabled={isLoading}
          />
        </Drawer>

        {/* Scenario Compare Panel */}
        <Drawer
          anchor="right"
          open={scenarioCompareOpen}
          onClose={() => setScenarioCompareOpen(false)}
          variant="persistent"
          sx={{
            '& .MuiDrawer-paper': {
              width: 400,
              position: 'relative',
              height: '100%',
            },
          }}
        >
          <Paper sx={{ height: '100%', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Scenario Comparison
            </Typography>
            <Alert severity="info">
              Scenario management coming soon. This will allow A/B comparison of different urban development scenarios.
            </Alert>
          </Paper>
        </Drawer>

        {/* KPI Panel */}
        <Drawer
          anchor="right"
          open={kpiPanelOpen}
          onClose={() => setKpiPanelOpen(false)}
          variant="persistent"
          sx={{
            '& .MuiDrawer-paper': {
              width: 350,
              position: 'relative',
              height: '100%',
            },
          }}
        >
          <Paper sx={{ height: '100%', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Urban KPIs & Metrics
            </Typography>
            <Alert severity="info">
              ECSQL-based KPI dashboard coming soon. This will show FAR, building heights, land use metrics, etc.
            </Alert>
          </Paper>
        </Drawer>

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
              <Typography variant="h6">Controls</Typography>
            </Box>
          </Box>

          {/* Panel Content */}
          <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
            {/* View Presets */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Predefined Views
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
              Layers
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Layer</InputLabel>
              <Select
                value={selectedLayer}
                label="Select Layer"
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
              Visibility
            </Typography>
            
            {/* Curated Content Controls */}
            <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic', color: 'text.secondary' }}>
              Cesium Curated Content (Official 3D Tiles)
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showWorldTerrain}
                  onChange={(e) => handleWorldTerrainToggle(e.target.checked)}
                  color="primary"
                />
              }
              label="World Terrain"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showOSMBuildings}
                  onChange={(e) => handleOSMBuildingsToggle(e.target.checked)}
                  color="primary"
                />
              }
              label="OSM Buildings"
              sx={{ mb: 2 }}
            />
            
            {/* Local Content Controls */}
            <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic', color: 'text.secondary' }}>
              Local Content
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
              label="Local Buildings"
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
              label="Traffic"
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
              label="IoT Sensors"
              sx={{ mb: 2 }}
            />

            {/* Performance Metrics Display */}
            {performanceMetrics && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Performance Monitor
                </Typography>
                <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    FPS: <span style={{ 
                      color: performanceMetrics.fps >= 30 ? '#4caf50' : '#f44336',
                      fontWeight: 'bold'
                    }}>{performanceMetrics.fps}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    Tiles Loaded: {performanceMetrics.tilesLoaded}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    Memory: {performanceMetrics.memoryUsage}MB
                  </Typography>
                  {performanceMetrics.recommendations?.length > 0 && (
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'warning.main', mt: 1 }}>
                      ⚠️ {performanceMetrics.recommendations[0]}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* Content Attachments Status */}
            {contentAttachments.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Content Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {contentAttachments.map((attachment, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: attachment.success ? '#4caf50' : '#f44336',
                        mr: 1
                      }} />
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {attachment.contentId.replace('cesium-', '').replace('-', ' ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Opacity Control */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Transparency: {opacity}%
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
            <Alert severity="info" sx={{ fontSize: '0.8rem', mb: 2 }}>
              <strong>Curated Content:</strong> Toggle World Terrain and OSM Buildings to see official Cesium 3D Tiles integration with performance optimization for Chancay region.
            </Alert>
            
            <Alert severity="info" sx={{ fontSize: '0.8rem', mb: 2 }}>
              Click on buildings in the viewer to select geometry for rule application.
            </Alert>
            
            {selectedGeometry && (
              <Alert severity="success" sx={{ fontSize: '0.8rem' }}>
                Geometry selected! Open the Rules panel to apply procedural rules.
              </Alert>
            )}
            
            {performanceMetrics && performanceMetrics.fps < 30 && (
              <Alert severity="warning" sx={{ fontSize: '0.8rem', mt: 1 }}>
                Performance below 30 FPS target. Consider adjusting 3D Tiles settings.
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default UrbanViewer;