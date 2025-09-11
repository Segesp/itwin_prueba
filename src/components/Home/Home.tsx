import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Public as PublicIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  PlayArrow as PlayIcon,
  LocationCity as CityIcon,
  Traffic as TrafficIcon,
  Park as EcoIcon,
  ThermostatAuto as TempIcon,
  Speed as SpeedIcon,
  BarChart as ChartIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ConnectionService } from '../../services/ConnectionService';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();
    
    // Set up periodic updates
    const interval = setInterval(loadMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const connectionService = ConnectionService.getInstance();
      const data = await connectionService.fetchData('metrics');
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Visor 3D',
      description: 'Explorar el modelo tridimensional de Buenos Aires',
      icon: <PublicIcon />,
      color: '#4caf50',
      action: () => navigate('/viewer'),
    },
    {
      title: 'Portal Ciudadano',
      description: 'Acceso para participación ciudadana',
      icon: <PeopleIcon />,
      color: '#2196f3',
      action: () => navigate('/citizen'),
    },
    {
      title: 'Datos en Tiempo Real',
      description: 'Monitoreo de sensores y métricas urbanas',
      icon: <AnalyticsIcon />,
      color: '#ff9800',
      action: () => navigate('/data'),
    },
    {
      title: 'Simulador',
      description: 'Simular escenarios urbanos',
      icon: <PlayIcon />,
      color: '#9c27b0',
      action: () => navigate('/simulator'),
    },
  ];

  const getAirQualityLabel = (aqi: number) => {
    if (aqi <= 50) return { label: 'Buena', color: '#4caf50' };
    if (aqi <= 100) return { label: 'Moderada', color: '#ff9800' };
    if (aqi <= 150) return { label: 'Insalubre para grupos sensibles', color: '#ff5722' };
    return { label: 'Insalubre', color: '#f44336' };
  };

  const getTrafficLabel = (index: number) => {
    if (index <= 25) return { label: 'Fluido', color: '#4caf50' };
    if (index <= 50) return { label: 'Moderado', color: '#ff9800' };
    if (index <= 75) return { label: 'Congestionado', color: '#ff5722' };
    return { label: 'Muy Congestionado', color: '#f44336' };
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
          Gemelo Digital Urbano
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Buenos Aires - Ciudad Autónoma
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<CityIcon />}
            label="Sistema Activo"
            color="success"
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <IconButton size="small" onClick={loadMetrics} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Acceso Rápido
          </Typography>
        </Grid>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={action.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: action.color,
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    {action.icon}
                  </Avatar>
                  <IconButton size="small">
                    <LaunchIcon />
                  </IconButton>
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Real-time Metrics */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
              Métricas en Tiempo Real
            </Typography>
          </Grid>

          {/* Population */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Población</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {metrics.population.total.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Habitantes
              </Typography>
              <Typography variant="body2">
                Densidad: {metrics.population.density.toLocaleString()} hab/km²
              </Typography>
              <Typography variant="body2" color="success.main">
                Crecimiento: +{metrics.population.growth}%
              </Typography>
            </Paper>
          </Grid>

          {/* Traffic */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrafficIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Tráfico</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {metrics.traffic.averageSpeed} km/h
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Velocidad Promedio
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Congestión</Typography>
                  <Typography variant="body2">{metrics.traffic.congestionIndex}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.traffic.congestionIndex}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getTrafficLabel(metrics.traffic.congestionIndex).color,
                    },
                  }}
                />
              </Box>
              
              <Chip
                label={getTrafficLabel(metrics.traffic.congestionIndex).label}
                size="small"
                sx={{
                  backgroundColor: `${getTrafficLabel(metrics.traffic.congestionIndex).color}20`,
                  color: getTrafficLabel(metrics.traffic.congestionIndex).color,
                }}
              />
            </Paper>
          </Grid>

          {/* Environment */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EcoIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Ambiente</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TempIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="h5" sx={{ mr: 1 }}>
                  {metrics.environment.averageTemperature}°C
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  / {metrics.environment.humidity}% hum
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Calidad del Aire (AQI): {metrics.environment.airQualityIndex}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(metrics.environment.airQualityIndex, 300) / 3}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getAirQualityLabel(metrics.environment.airQualityIndex).color,
                    },
                  }}
                />
              </Box>
              
              <Chip
                label={getAirQualityLabel(metrics.environment.airQualityIndex).label}
                size="small"
                sx={{
                  backgroundColor: `${getAirQualityLabel(metrics.environment.airQualityIndex).color}20`,
                  color: getAirQualityLabel(metrics.environment.airQualityIndex).color,
                }}
              />
            </Paper>
          </Grid>

          {/* Energy */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Energía</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Consumo Total
                  </Typography>
                  <Typography variant="h5">
                    {metrics.energy.consumption} MWh
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Renovable
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {metrics.energy.renewable}%
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Eficiencia Energética</Typography>
                  <Typography variant="body2">{metrics.energy.efficiency}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.energy.efficiency}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50',
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ChartIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Estadísticas</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Vehículos Activos
                  </Typography>
                  <Typography variant="h6">
                    {metrics.traffic.totalVehicles.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Transporte Público
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {metrics.traffic.publicTransportUsage}%
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Viento
                  </Typography>
                  <Typography variant="h6">
                    {metrics.environment.windSpeed} km/h
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Actualizado
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Ahora
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Information */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/viewer')}>
                Explorar
              </Button>
            }
          >
            Bienvenido al Gemelo Digital Urbano de Buenos Aires. Explore la visualización 3D, consulte datos en tiempo real y participe en la planificación urbana.
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;