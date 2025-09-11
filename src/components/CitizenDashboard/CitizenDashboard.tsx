import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Fab,
  Snackbar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Report as ReportIcon,
  Construction as ConstructionIcon,
  LocalPolice as SafetyIcon,
  Park as EnvironmentIcon,
  DirectionsCar as TrafficIcon,
  Business as ServicesIcon,
  Send as SendIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { ConnectionService } from '../../services/ConnectionService';
import { NotificationService } from '../../services/NotificationService';

interface CitizenReport {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: string;
  createdAt: Date;
}

const CitizenDashboard: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [newReport, setNewReport] = useState({
    type: '',
    title: '',
    description: '',
    location: '',
    priority: 'medium',
  });

  const reportTypes = [
    { id: 'infrastructure', name: 'Infraestructura', icon: <ConstructionIcon />, color: '#ff9800' },
    { id: 'safety', name: 'Seguridad', icon: <SafetyIcon />, color: '#f44336' },
    { id: 'environment', name: 'Ambiente', icon: <EnvironmentIcon />, color: '#4caf50' },
    { id: 'traffic', name: 'Tráfico', icon: <TrafficIcon />, color: '#2196f3' },
    { id: 'services', name: 'Servicios', icon: <ServicesIcon />, color: '#9c27b0' },
  ];

  const statusColors: Record<string, string> = {
    pending: '#ff9800',
    in_progress: '#2196f3',
    resolved: '#4caf50',
    rejected: '#f44336',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Proceso',
    resolved: 'Resuelto',
    rejected: 'Rechazado',
  };

  const priorityColors: Record<string, string> = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
    urgent: '#9c27b0',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const connectionService = ConnectionService.getInstance();
      const data = await connectionService.fetchData('reports');
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      const notificationService = NotificationService.getInstance();
      notificationService.error('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!newReport.type || !newReport.title || !newReport.description) {
      const notificationService = NotificationService.getInstance();
      notificationService.warning('Campos Requeridos', 'Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const connectionService = ConnectionService.getInstance();
      
      const reportData = {
        ...newReport,
        id: `report_${Date.now()}`,
        status: 'pending',
        createdAt: new Date(),
      };

      await connectionService.sendData('reports', reportData);
      
      // Reset form
      setNewReport({
        type: '',
        title: '',
        description: '',
        location: '',
        priority: 'medium',
      });
      
      setOpenReportDialog(false);
      setShowSuccess(true);
      
      // Reload reports
      await loadReports();
      
      const notificationService = NotificationService.getInstance();
      notificationService.success('Reporte Enviado', 'Su reporte ha sido enviado exitosamente');
      
    } catch (error) {
      console.error('Error submitting report:', error);
      const notificationService = NotificationService.getInstance();
      notificationService.error('Error', 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeIcon = (type: string) => {
    const reportType = reportTypes.find(rt => rt.id === type);
    return reportType ? reportType.icon : <ReportIcon />;
  };

  const getReportTypeColor = (type: string) => {
    const reportType = reportTypes.find(rt => rt.id === type);
    return reportType ? reportType.color : '#666';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckIcon sx={{ color: statusColors[status] }} />;
      case 'rejected':
        return <ErrorIcon sx={{ color: statusColors[status] }} />;
      default:
        return <TimeIcon sx={{ color: statusColors[status] }} />;
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
          Portal Ciudadano
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Participe en la construcción de su ciudad
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          A través de este portal puede reportar problemas, consultar proyectos urbanos y participar en la planificación de Buenos Aires.
        </Alert>
      </Box>

      {/* Report Types Cards */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Tipos de Reportes
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {reportTypes.map(type => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={type.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
              onClick={() => {
                setNewReport(prev => ({ ...prev, type: type.id }));
                setOpenReportDialog(true);
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar
                  sx={{
                    backgroundColor: type.color,
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {type.icon}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {type.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Reports */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Reportes Recientes
      </Typography>
      
      {reports.length === 0 ? (
        <Alert severity="info">
          No hay reportes disponibles. ¡Sea el primero en reportar!
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {reports.slice(0, 6).map(report => (
            <Grid item xs={12} md={6} key={report.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: getReportTypeColor(report.type),
                        width: 32,
                        height: 32,
                        mr: 2,
                      }}
                    >
                      {getReportTypeIcon(report.type)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {report.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.location || 'Ubicación no especificada'}
                      </Typography>
                    </Box>
                    {getStatusIcon(report.status)}
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {report.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={statusLabels[report.status] || report.status}
                        size="small"
                        sx={{
                          backgroundColor: `${statusColors[report.status] || '#666'}20`,
                          color: statusColors[report.status] || '#666',
                        }}
                      />
                      <Chip
                        label={priorityLabels[report.priority] || report.priority}
                        size="small"
                        sx={{
                          backgroundColor: `${priorityColors[report.priority] || '#666'}20`,
                          color: priorityColors[report.priority] || '#666',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => setOpenReportDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* New Report Dialog */}
      <Dialog
        open={openReportDialog}
        onClose={() => setOpenReportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Nuevo Reporte Ciudadano</Typography>
            <IconButton onClick={() => setOpenReportDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Reporte</InputLabel>
                  <Select
                    value={newReport.type}
                    label="Tipo de Reporte"
                    onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {reportTypes.map(type => (
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
                <TextField
                  fullWidth
                  label="Título del Reporte"
                  value={newReport.title}
                  onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Describa brevemente el problema"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción Detallada"
                  value={newReport.description}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describa el problema en detalle, incluya cualquier información relevante"
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  value={newReport.location}
                  onChange={(e) => setNewReport(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ej: Av. Corrientes 1234, Balvanera"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={newReport.priority}
                    label="Prioridad"
                    onChange={(e) => setNewReport(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="urgent">Urgente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenReportDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReport}
            disabled={loading || !newReport.type || !newReport.title || !newReport.description}
            startIcon={<SendIcon />}
          >
            {loading ? 'Enviando...' : 'Enviar Reporte'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          variant="filled"
        >
          ¡Reporte enviado exitosamente! Recibirá notificaciones sobre el progreso.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenDashboard;