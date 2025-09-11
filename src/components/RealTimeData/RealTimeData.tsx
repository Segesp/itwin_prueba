import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Sensors as SensorsIcon,
  Traffic as TrafficIcon,
  Thermostat as TempIcon,
  Air as AirIcon,
  ElectricBolt as EnergyIcon,
  Water as WaterIcon,
  VolumeUp as NoiseIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  SignalWifi4Bar as OnlineIcon,
  SignalWifiOff as OfflineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { ConnectionService } from '../../services/ConnectionService';

interface SensorData {
  id: string;
  type: string;
  location: {
    lat: number;
    lng: number;
    barrio: string;
  };
  value: number;
  status: string;
  lastUpdate: Date;
}

const RealTimeData: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const sensorTypes: Record<string, { name: string; icon: React.ReactElement; color: string; unit: string }> = {
    temperature: { name: 'Temperatura', icon: <TempIcon />, color: '#ff9800', unit: '°C' },
    humidity: { name: 'Humedad', icon: <AirIcon />, color: '#2196f3', unit: '%' },
    air_quality: { name: 'Calidad del Aire', icon: <AirIcon />, color: '#4caf50', unit: 'AQI' },
    noise: { name: 'Ruido', icon: <NoiseIcon />, color: '#9c27b0', unit: 'dB' },
    traffic: { name: 'Tráfico', icon: <TrafficIcon />, color: '#f44336', unit: 'veh/h' },
  };

  useEffect(() => {
    loadRealTimeData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadRealTimeData, 15000); // Every 15 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadRealTimeData = async () => {
    try {
      setLoading(true);
      const connectionService = ConnectionService.getInstance();
      
      const [sensorsData, metricsData] = await Promise.all([
        connectionService.fetchData('sensors'),
        connectionService.fetchData('metrics'),
      ]);
      
      setSensors(sensorsData);
      setMetrics(metricsData);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error loading real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSensorStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <OnlineIcon sx={{ color: '#4caf50' }} />;
      case 'offline':
        return <OfflineIcon sx={{ color: '#f44336' }} />;
      default:
        return <WarningIcon sx={{ color: '#ff9800' }} />;
    }
  };

  const getSensorsByType = (type: string) => {
    return sensors.filter(sensor => sensor.type === type);
  };

  const getAverageValue = (type: string) => {
    const typeSensors = getSensorsByType(type);
    if (typeSensors.length === 0) return 0;
    
    const sum = typeSensors.reduce((acc, sensor) => acc + sensor.value, 0);
    return Math.round((sum / typeSensors.length) * 10) / 10;
  };

  const getOnlineSensors = (type: string) => {
    const typeSensors = getSensorsByType(type);
    return typeSensors.filter(sensor => sensor.status === 'online').length;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatTimeDiff = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
          Datos en Tiempo Real
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Monitoreo continuo de sensores IoT urbanos
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Actualización Automática"
          />
          <Typography variant="body2" color="text.secondary">
            Última actualización: {formatTime(lastUpdate)}
          </Typography>
          <IconButton size="small" onClick={loadRealTimeData} disabled={loading}>
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

      {/* Sensor Overview */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Resumen de Sensores
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {Object.entries(sensorTypes).map(([type, info]) => {
          const onlineCount = getOnlineSensors(type);
          const totalCount = getSensorsByType(type).length;
          const averageValue = getAverageValue(type);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={type}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: info.color,
                        width: 40,
                        height: 40,
                        mr: 2,
                      }}
                    >
                      {info.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h5">
                        {averageValue}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {info.unit}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {info.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                    <Typography variant="body2">
                      {onlineCount}/{totalCount} activos
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Detailed Sensor Table */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Estado Detallado de Sensores
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sensor</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell>Última Actualización</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sensors.map((sensor) => {
              const typeInfo = sensorTypes[sensor.type] || {
                name: sensor.type,
                icon: <SensorsIcon />,
                color: '#666',
                unit: '',
              };
              
              return (
                <TableRow key={sensor.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          backgroundColor: typeInfo.color,
                          width: 24,
                          height: 24,
                          mr: 1,
                        }}
                      >
                        {React.cloneElement(typeInfo.icon, { sx: { fontSize: '0.8rem' } })}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {sensor.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {typeInfo.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {sensor.location.barrio}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sensor.location.lat.toFixed(4)}, {sensor.location.lng.toFixed(4)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {sensor.value.toFixed(1)} {typeInfo.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getSensorStatusIcon(sensor.status)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Hace {formatTimeDiff(new Date(sensor.lastUpdate))}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* System Status */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
          Estado del Sistema de Monitoreo
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SensorsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Sensores Totales</Typography>
              </Box>
              <Typography variant="h3" color="primary.main">
                {sensors.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Distribuidos en Buenos Aires
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Sensores Online</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {sensors.filter(s => s.status === 'online').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Funcionando correctamente
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Latencia Promedio</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                45ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tiempo de respuesta
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default RealTimeData;