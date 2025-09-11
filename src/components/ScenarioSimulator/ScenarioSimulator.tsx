import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayCircle as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  Traffic as TrafficIcon,
  LocalFireDepartment as EmergencyIcon,
  Construction as ConstructionIcon,
  Event as EventIcon,
  Park as EnvironmentIcon,
} from '@mui/icons-material';
import { ConnectionService } from '../../services/ConnectionService';
import { NotificationService } from '../../services/NotificationService';

interface SimulationScenario {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  status: string;
  duration: number;
  progress?: number;
}

const ScenarioSimulator: React.FC = () => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [openNewScenario, setOpenNewScenario] = useState(false);
  
  const [newScenario, setNewScenario] = useState({
    name: '',
    type: '',
    duration: 60,
    parameters: {},
  });

  const scenarioTypes = [
    {
      id: 'traffic',
      name: 'Simulación de Tráfico',
      icon: <TrafficIcon />,
      color: '#2196f3',
      description: 'Modelar flujo vehicular y congestión',
      parameters: ['vehicleCount', 'rushHour', 'roadClosures', 'weatherConditions'],
    },
    {
      id: 'emergency',
      name: 'Situación de Emergencia',
      icon: <EmergencyIcon />,
      color: '#f44336',
      description: 'Simular respuesta a emergencias',
      parameters: ['emergencyType', 'location', 'severity', 'responseTime'],
    },
    {
      id: 'development',
      name: 'Desarrollo Urbano',
      icon: <ConstructionIcon />,
      color: '#ff9800',
      description: 'Evaluar impacto de nuevas construcciones',
      parameters: ['buildingHeight', 'landUse', 'populationImpact', 'trafficImpact'],
    },
    {
      id: 'event',
      name: 'Evento Masivo',
      icon: <EventIcon />,
      color: '#9c27b0',
      description: 'Planificar eventos y su impacto urbano',
      parameters: ['attendees', 'duration', 'venue', 'transportPlan'],
    },
    {
      id: 'environment',
      name: 'Impacto Ambiental',
      icon: <EnvironmentIcon />,
      color: '#4caf50',
      description: 'Analizar cambios ambientales',
      parameters: ['pollutionLevel', 'temperature', 'windSpeed', 'seasonality'],
    },
  ];

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      // Simulate loading scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const simulatedScenarios: SimulationScenario[] = [
        {
          id: 'scenario_1',
          name: 'Hora Pico - Av. 9 de Julio',
          type: 'traffic',
          parameters: {
            vehicleCount: 1500,
            rushHour: true,
            roadClosures: false,
            weatherConditions: 'clear',
          },
          status: 'completed',
          duration: 120,
        },
        {
          id: 'scenario_2',
          name: 'Concierto en Luna Park',
          type: 'event',
          parameters: {
            attendees: 8000,
            duration: 180,
            venue: 'Luna Park',
            transportPlan: 'metro_bus',
          },
          status: 'draft',
          duration: 240,
        },
        {
          id: 'scenario_3',
          name: 'Incendio en Puerto Madero',
          type: 'emergency',
          parameters: {
            emergencyType: 'fire',
            location: 'puerto_madero',
            severity: 'high',
            responseTime: 8,
          },
          status: 'completed',
          duration: 60,
        },
      ];
      
      setScenarios(simulatedScenarios);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const runSimulation = async (scenario: SimulationScenario) => {
    try {
      setCurrentScenario(scenario);
      setIsRunning(true);
      setProgress(0);
      setResults(null);
      
      const notificationService = NotificationService.getInstance();
      notificationService.info('Simulación Iniciada', `Ejecutando: ${scenario.name}`);
      
      // Simulate progressive execution
      const totalSteps = 20;
      for (let i = 0; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, scenario.duration * 50)); // Simulate time
        setProgress((i / totalSteps) * 100);
      }
      
      // Generate simulation results
      const simulationResults = generateSimulationResults(scenario);
      setResults(simulationResults);
      
      notificationService.success('Simulación Completada', `${scenario.name} ejecutado exitosamente`);
      
    } catch (error) {
      console.error('Error running simulation:', error);
      const notificationService = NotificationService.getInstance();
      notificationService.error('Error de Simulación', 'La simulación falló');
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  const stopSimulation = () => {
    setIsRunning(false);
    setProgress(0);
    setCurrentScenario(null);
    
    const notificationService = NotificationService.getInstance();
    notificationService.warning('Simulación Detenida', 'La simulación fue cancelada por el usuario');
  };

  const generateSimulationResults = (scenario: SimulationScenario) => {
    const baseResults = {
      executionTime: scenario.duration,
      timestamp: new Date(),
      status: 'completed',
    };

    switch (scenario.type) {
      case 'traffic':
        return {
          ...baseResults,
          metrics: {
            averageSpeed: Math.round((20 + Math.random() * 20) * 10) / 10,
            congestionReduction: Math.round(Math.random() * 30 * 10) / 10,
            fuelSavings: Math.round(Math.random() * 15 * 10) / 10,
            emissionReduction: Math.round(Math.random() * 20 * 10) / 10,
          },
          recommendations: [
            'Implementar semáforos inteligentes en intersecciones clave',
            'Aumentar frecuencia de transporte público durante hora pico',
            'Crear carriles exclusivos para buses en avenidas principales',
          ],
        };
        
      case 'emergency':
        return {
          ...baseResults,
          metrics: {
            responseTime: Math.round((5 + Math.random() * 10) * 10) / 10,
            evacuationTime: Math.round((15 + Math.random() * 20) * 10) / 10,
            affectedPopulation: Math.floor(Math.random() * 5000),
            resourcesNeeded: Math.floor(3 + Math.random() * 8),
          },
          recommendations: [
            'Optimizar rutas de evacuación',
            'Incrementar personal de emergencia en zona crítica',
            'Mejorar comunicación con ciudadanos',
          ],
        };
        
      case 'development':
        return {
          ...baseResults,
          metrics: {
            trafficIncrease: Math.round(Math.random() * 25 * 10) / 10,
            populationImpact: Math.floor(Math.random() * 2000),
            economicImpact: Math.round((1 + Math.random() * 5) * 100) / 100,
            environmentalScore: Math.round((60 + Math.random() * 30) * 10) / 10,
          },
          recommendations: [
            'Requiere estudio de impacto ambiental adicional',
            'Considerar expansión de transporte público',
            'Implementar espacios verdes compensatorios',
          ],
        };
        
      default:
        return {
          ...baseResults,
          metrics: {
            generalImpact: Math.round(Math.random() * 100 * 10) / 10,
            efficiency: Math.round((70 + Math.random() * 25) * 10) / 10,
          },
          recommendations: [
            'Continuar monitoreo de indicadores',
            'Evaluar resultados a largo plazo',
          ],
        };
    }
  };

  const createNewScenario = async () => {
    if (!newScenario.name || !newScenario.type) {
      const notificationService = NotificationService.getInstance();
      notificationService.warning('Campos Requeridos', 'Complete nombre y tipo de escenario');
      return;
    }

    try {
      const scenario: SimulationScenario = {
        id: `scenario_${Date.now()}`,
        name: newScenario.name,
        type: newScenario.type,
        parameters: newScenario.parameters,
        status: 'draft',
        duration: newScenario.duration,
      };

      setScenarios(prev => [scenario, ...prev]);
      setOpenNewScenario(false);
      
      // Reset form
      setNewScenario({
        name: '',
        type: '',
        duration: 60,
        parameters: {},
      });
      
      const notificationService = NotificationService.getInstance();
      notificationService.success('Escenario Creado', `${scenario.name} listo para ejecutar`);
      
    } catch (error) {
      console.error('Error creating scenario:', error);
    }
  };

  const getScenarioTypeInfo = (type: string) => {
    return scenarioTypes.find(st => st.id === type) || scenarioTypes[0];
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
          Simulador de Escenarios
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Modelado y análisis de situaciones urbanas
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => setOpenNewScenario(true)}
          >
            Nuevo Escenario
          </Button>
          {currentScenario && isRunning && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopSimulation}
            >
              Detener Simulación
            </Button>
          )}
        </Box>
      </Box>

      {/* Current Simulation */}
      {currentScenario && isRunning && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <IconButton size="small" onClick={stopSimulation}>
              <StopIcon />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="subtitle2">
              Ejecutando: {currentScenario.name}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mt: 1, mb: 1 }}
            />
            <Typography variant="body2">
              Progreso: {Math.round(progress)}% - Tipo: {getScenarioTypeInfo(currentScenario.type).name}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Scenario Types */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Tipos de Escenarios
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {scenarioTypes.map(type => (
          <Grid item xs={12} sm={6} md={4} key={type.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
              onClick={() => {
                setNewScenario(prev => ({ ...prev, type: type.id }));
                setOpenNewScenario(true);
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: type.color,
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                    }}
                  >
                    {React.cloneElement(type.icon, { sx: { color: 'white' } })}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {type.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {type.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Existing Scenarios */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Escenarios Guardados
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {scenarios.map(scenario => {
          const typeInfo = getScenarioTypeInfo(scenario.type);
          return (
            <Grid item xs={12} md={6} key={scenario.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: typeInfo.color,
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      {React.cloneElement(typeInfo.icon, { sx: { color: 'white', fontSize: '1.2rem' } })}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {scenario.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {typeInfo.name} • {scenario.duration} min
                      </Typography>
                    </Box>
                    <Chip
                      label={scenario.status}
                      size="small"
                      color={scenario.status === 'completed' ? 'success' : 'default'}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={() => runSimulation(scenario)}
                      disabled={isRunning}
                    >
                      Ejecutar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      disabled={isRunning}
                    >
                      Configurar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ShareIcon />}
                    >
                      Compartir
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Results */}
      {results && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Resultados de Simulación
          </Typography>
          
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                {currentScenario?.name}
              </Typography>
              <Chip 
                label="Completado" 
                color="success" 
                size="small" 
                sx={{ ml: 2 }} 
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Métricas Principales
                </Typography>
                {Object.entries(results.metrics || {}).map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {typeof value === 'number' ? value.toFixed(1) : String(value)}
                    </Typography>
                  </Box>
                ))}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Recomendaciones
                </Typography>
                {results.recommendations?.map((rec: string, index: number) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    • {rec}
                  </Typography>
                ))}
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
              >
                Guardar Resultados
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                Exportar Reporte
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
              >
                Compartir
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* New Scenario Dialog */}
      <Dialog
        open={openNewScenario}
        onClose={() => setOpenNewScenario(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crear Nuevo Escenario</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Escenario"
                  value={newScenario.name}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Hora pico en microcentro"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Escenario</InputLabel>
                  <Select
                    value={newScenario.type}
                    label="Tipo de Escenario"
                    onChange={(e) => setNewScenario(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {scenarioTypes.map(type => (
                      <MenuItem key={type.id} value={type.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          {type.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Duración de Simulación: {newScenario.duration} minutos
                </Typography>
                <Slider
                  value={newScenario.duration}
                  onChange={(_, value) => setNewScenario(prev => ({ ...prev, duration: value as number }))}
                  min={30}
                  max={480}
                  step={30}
                  marks={[
                    { value: 30, label: '30m' },
                    { value: 120, label: '2h' },
                    { value: 240, label: '4h' },
                    { value: 480, label: '8h' },
                  ]}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewScenario(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={createNewScenario}
            disabled={!newScenario.name || !newScenario.type}
          >
            Crear Escenario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenarioSimulator;