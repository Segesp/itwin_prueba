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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Alert,
  Avatar,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  People as PeopleIcon,
  DirectionsCar as TrafficIcon,
  Park as EcoIcon,
  ElectricBolt as EnergyIcon,
  Water as WaterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { ConnectionService } from '../../services/ConnectionService';

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up periodic updates
    const interval = setInterval(loadDashboardData, 45000); // Every 45 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const connectionService = ConnectionService.getInstance();
      
      // Load multiple data sources
      const [metricsData, reportsData] = await Promise.all([
        connectionService.fetchData('metrics'),
        connectionService.fetchData('reports'),
      ]);
      
      setMetrics(metricsData);
      setReports(reportsData);
      
      // Generate alerts based on metrics
      generateSystemAlerts(metricsData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSystemAlerts = (data: any) => {
    const newAlerts = [];
    
    // Traffic alerts
    if (data.traffic.congestionIndex > 75) {
      newAlerts.push({
        id: 'traffic_high',
        type: 'warning',
        title: 'Congestión Alta',
        message: `Índice de congestión: ${data.traffic.congestionIndex}%`,
        severity: 'high',
      });
    }
    
    // Air quality alerts
    if (data.environment.airQualityIndex > 100) {
      newAlerts.push({
        id: 'air_quality',
        type: 'error',
        title: 'Calidad del Aire Deteriorada',
        message: `AQI: ${data.environment.airQualityIndex}`,
        severity: 'critical',
      });
    }
    
    // Energy alerts
    if (data.energy.efficiency < 70) {
      newAlerts.push({
        id: 'energy_low',
        type: 'warning',
        title: 'Eficiencia Energética Baja',
        message: `Eficiencia: ${data.energy.efficiency}%`,
        severity: 'medium',
      });
    }
    
    setAlerts(newAlerts);
  };

  const getKPITrend = (current: number, previous: number) => {
    const diff = current - previous;
    const percentage = Math.abs((diff / previous) * 100);
    
    if (diff > 0) {
      return {
        icon: <TrendingUpIcon sx={{ color: 'success.main' }} />,
        text: `+${percentage.toFixed(1)}%`,
        color: 'success.main',
      };
    } else if (diff < 0) {
      return {
        icon: <TrendingDownIcon sx={{ color: 'error.main' }} />,
        text: `-${percentage.toFixed(1)}%`,
        color: 'error.main',
      };
    } else {
      return {
        icon: <SpeedIcon sx={{ color: 'info.main' }} />,
        text: '0%',
        color: 'info.main',
      };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const kpiCards = metrics ? [
    {
      title: 'Población Activa',
      value: metrics.population.total.toLocaleString(),
      unit: 'habitantes',
      icon: <PeopleIcon />,
      color: '#2196f3',
      trend: getKPITrend(metrics.population.total, 3070000),
    },
    {
      title: 'Velocidad Promedio',
      value: `${metrics.traffic.averageSpeed}`,
      unit: 'km/h',
      icon: <TrafficIcon />,
      color: '#ff9800',
      trend: getKPITrend(metrics.traffic.averageSpeed, 28.5),
    },
    {
      title: 'Calidad del Aire',
      value: `${metrics.environment.airQualityIndex}`,
      unit: 'AQI',
      icon: <EcoIcon />,
      color: metrics.environment.airQualityIndex > 100 ? '#f44336' : '#4caf50',
      trend: getKPITrend(metrics.environment.airQualityIndex, 85),
    },
    {
      title: 'Eficiencia Energética',
      value: `${metrics.energy.efficiency}`,
      unit: '%',
      icon: <EnergyIcon />,
      color: '#9c27b0',
      trend: getKPITrend(metrics.energy.efficiency, 78),
    },
  ] : [];

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
          Dashboard Administrativo
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Control y monitoreo del gemelo digital urbano
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<AdminIcon />}
            label="Administrador"
            color="primary"
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <IconButton size="small" onClick={loadDashboardData} disabled={loading}>
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

      {/* System Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Alertas del Sistema
          </Typography>
          <Grid container spacing={2}>
            {alerts.map(alert => (
              <Grid item xs={12} md={6} key={alert.id}>
                <Alert
                  severity={alert.type}
                  action={
                    <Button size="small" color="inherit">
                      Ver Detalles
                    </Button>
                  }
                >
                  <Typography variant="subtitle2">{alert.title}</Typography>
                  {alert.message}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* KPI Cards */}
      {metrics && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Indicadores Clave (KPI)
          </Typography>
          <Grid container spacing={3}>
            {kpiCards.map((kpi, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: kpi.color,
                          width: 40,
                          height: 40,
                          mr: 2,
                        }}
                      >
                        {kpi.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ lineHeight: 1 }}>
                          {kpi.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {kpi.unit}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {kpi.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {kpi.trend.icon}
                      <Typography
                        variant="body2"
                        sx={{ color: kpi.trend.color }}
                      >
                        {kpi.trend.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        vs. anterior
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Reports Management */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Gestión de Reportes Ciudadanos
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Prioridad</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.slice(0, 8).map((report) => (
              <TableRow key={report.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {report.id.slice(-8)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={report.type}
                    size="small"
                    sx={{
                      textTransform: 'capitalize',
                      backgroundColor: `${getSeverityColor('medium')}20`,
                      color: getSeverityColor('medium'),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{report.title}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={report.status}
                    size="small"
                    sx={{
                      backgroundColor: `${getSeverityColor(report.priority)}20`,
                      color: getSeverityColor(report.priority),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={report.priority}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" title="Ver detalles">
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small" title="Editar">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* System Status */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Estado del Sistema
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Servicios Activos</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              12/12
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Todos los servicios funcionando correctamente
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Alertas Activas</Typography>
            </Box>
            <Typography variant="h3" color="warning.main">
              {alerts.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requieren atención
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SpeedIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Rendimiento</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
              98%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Uptime del sistema
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;