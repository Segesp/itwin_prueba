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
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Height as HeightIcon,
  BusinessCenter as FARIcon,
  GridOn as GSIIcon,
  Nature as GreenIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as ChartIcon,
  Assessment as AssessmentIcon,
  Apartment as BuildingIcon,
  Park as ParkIcon,
} from '@mui/icons-material';
import { UrbanKPIService } from '../../services/UrbanKPIService';

interface UrbanMetrics {
  far: number; // Floor Area Ratio
  gsi: number; // Ground Space Index  
  osr: number; // Open Space Ratio
  averageHeight: number;
  maxHeight: number;
  buildingCount: number;
  totalFloorArea: number;
  totalSiteArea: number;
  greenSpaceArea: number;
  populationDensity: number;
  parkingRatio: number;
}

interface BlockMetrics extends UrbanMetrics {
  blockId: string;
  blockName: string;
  lotCount: number;
}

const UrbanKPIDashboard: React.FC = () => {
  const [overallMetrics, setOverallMetrics] = useState<UrbanMetrics | null>(null);
  const [blockMetrics, setBlockMetrics] = useState<BlockMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | 'historical'>('current');

  useEffect(() => {
    loadUrbanMetrics();
    
    // Set up periodic updates every 2 minutes
    const interval = setInterval(loadUrbanMetrics, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUrbanMetrics = async () => {
    try {
      setLoading(true);
      const kpiService = UrbanKPIService.getInstance();
      
      // Load overall project metrics
      const overall = await kpiService.calculateOverallMetrics();
      setOverallMetrics(overall);
      
      // Load block-by-block metrics
      const blocks = await kpiService.calculateBlockMetrics();
      setBlockMetrics(blocks);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading urban KPI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value: number, suffix: string = '', decimals: number = 2): string => {
    return `${value.toFixed(decimals)}${suffix}`;
  };

  const getFARColor = (far: number): string => {
    // FAR color coding based on urban planning standards
    if (far < 1.0) return '#4caf50'; // Green - Low density
    if (far < 2.0) return '#8bc34a'; // Light green
    if (far < 3.0) return '#ffeb3b'; // Yellow - Medium density
    if (far < 4.0) return '#ff9800'; // Orange
    return '#f44336'; // Red - High density
  };

  const getGSIColor = (gsi: number): string => {
    // GSI color coding (lower is better for urban quality)
    if (gsi < 0.3) return '#4caf50'; // Green - Good coverage
    if (gsi < 0.5) return '#8bc34a'; // Light green
    if (gsi < 0.7) return '#ffeb3b'; // Yellow
    if (gsi < 0.8) return '#ff9800'; // Orange
    return '#f44336'; // Red - Too dense
  };

  const getComplianceStatus = (metric: string, value: number): { status: string; color: string } => {
    // Buenos Aires / Chancay urban planning compliance
    switch (metric) {
      case 'far':
        if (value <= 2.5) return { status: 'Cumple', color: '#4caf50' };
        if (value <= 3.5) return { status: 'Límite', color: '#ff9800' };
        return { status: 'Excede', color: '#f44336' };
      case 'gsi':
        if (value <= 0.6) return { status: 'Cumple', color: '#4caf50' };
        if (value <= 0.75) return { status: 'Límite', color: '#ff9800' };
        return { status: 'Excede', color: '#f44336' };
      case 'osr':
        if (value >= 0.25) return { status: 'Cumple', color: '#4caf50' };
        if (value >= 0.15) return { status: 'Límite', color: '#ff9800' };
        return { status: 'Deficiente', color: '#f44336' };
      default:
        return { status: 'N/A', color: '#9e9e9e' };
    }
  };

  if (loading || !overallMetrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Calculando métricas urbanas con ECSQL...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 2, fontSize: 40 }} />
          Dashboard de KPIs Urbanos
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <IconButton onClick={loadUrbanMetrics} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Overall Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    FAR (Coeficiente de Ocupación)
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: getFARColor(overallMetrics.far) }}>
                    {formatMetric(overallMetrics.far)}
                  </Typography>
                  <Chip 
                    label={getComplianceStatus('far', overallMetrics.far).status}
                    size="small"
                    sx={{ 
                      mt: 1, 
                      backgroundColor: getComplianceStatus('far', overallMetrics.far).color,
                      color: 'white'
                    }}
                  />
                </Box>
                <FARIcon sx={{ fontSize: 40, color: getFARColor(overallMetrics.far) }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    GSI (Ground Space Index)
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: getGSIColor(overallMetrics.gsi) }}>
                    {formatMetric(overallMetrics.gsi * 100, '%', 1)}
                  </Typography>
                  <Chip 
                    label={getComplianceStatus('gsi', overallMetrics.gsi).status}
                    size="small"
                    sx={{ 
                      mt: 1, 
                      backgroundColor: getComplianceStatus('gsi', overallMetrics.gsi).color,
                      color: 'white'
                    }}
                  />
                </Box>
                <GSIIcon sx={{ fontSize: 40, color: getGSIColor(overallMetrics.gsi) }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Altura Promedio
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatMetric(overallMetrics.averageHeight, 'm', 1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Máx: {formatMetric(overallMetrics.maxHeight, 'm', 1)}
                  </Typography>
                </Box>
                <HeightIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Ratio Espacio Verde
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#4caf50' }}>
                    {formatMetric(overallMetrics.osr * 100, '%', 1)}
                  </Typography>
                  <Chip 
                    label={getComplianceStatus('osr', overallMetrics.osr).status}
                    size="small"
                    sx={{ 
                      mt: 1, 
                      backgroundColor: getComplianceStatus('osr', overallMetrics.osr).color,
                      color: 'white'
                    }}
                  />
                </Box>
                <GreenIcon sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Stats Row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BuildingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Estadísticas de Edificación
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total de Edificios</Typography>
                  <Typography variant="h6">{overallMetrics.buildingCount}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Área Total de Pisos</Typography>
                  <Typography variant="h6">{formatMetric(overallMetrics.totalFloorArea / 1000, 'k m²', 1)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Área del Sitio</Typography>
                  <Typography variant="h6">{formatMetric(overallMetrics.totalSiteArea / 1000, 'k m²', 1)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Densidad Poblacional</Typography>
                  <Typography variant="h6">{formatMetric(overallMetrics.populationDensity, ' hab/ha', 0)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ParkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Espacios Verdes y Servicios
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Área Verde</Typography>
                  <Typography variant="h6">{formatMetric(overallMetrics.greenSpaceArea / 1000, 'k m²', 1)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Ratio de Estacionamiento</Typography>
                  <Typography variant="h6">{formatMetric(overallMetrics.parkingRatio, ':1', 2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Distribución de Espacio Verde</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={overallMetrics.osr * 100} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 1, 
                      mt: 1,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#4caf50'
                      }
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {formatMetric(overallMetrics.osr * 100, '%', 1)} del área total
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Block-by-Block Analysis */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Análisis por Manzana (ECSQL Detallado)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Manzana</strong></TableCell>
                  <TableCell align="right"><strong>FAR</strong></TableCell>
                  <TableCell align="right"><strong>GSI</strong></TableCell>
                  <TableCell align="right"><strong>OSR</strong></TableCell>
                  <TableCell align="right"><strong>Altura Prom.</strong></TableCell>
                  <TableCell align="right"><strong>Edificios</strong></TableCell>
                  <TableCell align="center"><strong>Cumplimiento</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blockMetrics.map((block) => {
                  const farStatus = getComplianceStatus('far', block.far);
                  const gsiStatus = getComplianceStatus('gsi', block.gsi);
                  const osrStatus = getComplianceStatus('osr', block.osr);
                  
                  return (
                    <TableRow key={block.blockId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {block.blockName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {block.lotCount} lotes
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: getFARColor(block.far) }}>
                          {formatMetric(block.far)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: getGSIColor(block.gsi) }}>
                          {formatMetric(block.gsi * 100, '%', 1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: '#4caf50' }}>
                          {formatMetric(block.osr * 100, '%', 1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatMetric(block.averageHeight, 'm', 1)}
                      </TableCell>
                      <TableCell align="right">
                        {block.buildingCount}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title={`FAR: ${farStatus.status}`}>
                            <Chip 
                              size="small" 
                              label="F" 
                              sx={{ 
                                minWidth: 24, 
                                backgroundColor: farStatus.color, 
                                color: 'white',
                                fontSize: '0.7rem'
                              }} 
                            />
                          </Tooltip>
                          <Tooltip title={`GSI: ${gsiStatus.status}`}>
                            <Chip 
                              size="small" 
                              label="G" 
                              sx={{ 
                                minWidth: 24, 
                                backgroundColor: gsiStatus.color, 
                                color: 'white',
                                fontSize: '0.7rem'
                              }} 
                            />
                          </Tooltip>
                          <Tooltip title={`OSR: ${osrStatus.status}`}>
                            <Chip 
                              size="small" 
                              label="O" 
                              sx={{ 
                                minWidth: 24, 
                                backgroundColor: osrStatus.color, 
                                color: 'white',
                                fontSize: '0.7rem'
                              }} 
                            />
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Datos calculados mediante consultas ECSQL en tiempo real desde el iModel
            </Typography>
            <Typography variant="caption" color="text.secondary">
              F=FAR, G=GSI, O=OSR compliance status
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UrbanKPIDashboard;