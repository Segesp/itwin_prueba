import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Chip,
  Paper,
  Slider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Language as LanguageIcon,
  Palette as ThemeIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Speed as PerformanceIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState({
    language: 'es',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      realTime: true,
      reports: true,
      alerts: true,
    },
    performance: {
      autoRefresh: true,
      refreshInterval: 30,
      highQuality: true,
      animations: true,
    },
    privacy: {
      analytics: true,
      location: true,
      crashReports: true,
    },
    advanced: {
      debugMode: false,
      developerTools: false,
      experimentalFeatures: false,
    },
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real implementation, this would save to backend
    localStorage.setItem('urbanTwinSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      language: 'es',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        realTime: true,
        reports: true,
        alerts: true,
      },
      performance: {
        autoRefresh: true,
        refreshInterval: 30,
        highQuality: true,
        animations: true,
      },
      privacy: {
        analytics: true,
        location: true,
        crashReports: true,
      },
      advanced: {
        debugMode: false,
        developerTools: false,
        experimentalFeatures: false,
      },
    });
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
          Configuración del Sistema
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Personalice su experiencia con el gemelo digital urbano
        </Typography>
        
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuración guardada exitosamente
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Configuración General</Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Idioma</InputLabel>
                <Select
                  value={settings.language}
                  label="Idioma"
                  onChange={(e) => updateSetting('language', e.target.value)}
                  startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tema</InputLabel>
                <Select
                  value={settings.theme}
                  label="Tema"
                  onChange={(e) => updateSetting('theme', e.target.value)}
                  startAdornment={<ThemeIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="light">Claro</MenuItem>
                  <MenuItem value="dark">Oscuro</MenuItem>
                  <MenuItem value="auto">Automático</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Notificaciones</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={(e) => updateSetting('notifications.email', e.target.checked)}
                  />
                }
                label="Notificaciones por Email"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.push}
                    onChange={(e) => updateSetting('notifications.push', e.target.checked)}
                  />
                }
                label="Notificaciones Push"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.realTime}
                    onChange={(e) => updateSetting('notifications.realTime', e.target.checked)}
                  />
                }
                label="Datos en Tiempo Real"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.alerts}
                    onChange={(e) => updateSetting('notifications.alerts', e.target.checked)}
                  />
                }
                label="Alertas del Sistema"
                sx={{ mb: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PerformanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Rendimiento</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performance.autoRefresh}
                    onChange={(e) => updateSetting('performance.autoRefresh', e.target.checked)}
                  />
                }
                label="Actualización Automática"
                sx={{ mb: 2 }}
              />
              
              <Typography gutterBottom>
                Intervalo de Actualización: {settings.performance.refreshInterval}s
              </Typography>
              <Slider
                value={settings.performance.refreshInterval}
                onChange={(_, value) => updateSetting('performance.refreshInterval', value)}
                min={10}
                max={300}
                step={10}
                marks={[
                  { value: 10, label: '10s' },
                  { value: 60, label: '1m' },
                  { value: 300, label: '5m' },
                ]}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performance.highQuality}
                    onChange={(e) => updateSetting('performance.highQuality', e.target.checked)}
                  />
                }
                label="Alta Calidad Visual"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performance.animations}
                    onChange={(e) => updateSetting('performance.animations', e.target.checked)}
                  />
                }
                label="Animaciones"
                sx={{ mb: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy & Security */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Privacidad y Seguridad</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.analytics}
                    onChange={(e) => updateSetting('privacy.analytics', e.target.checked)}
                  />
                }
                label="Análisis de Uso"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.location}
                    onChange={(e) => updateSetting('privacy.location', e.target.checked)}
                  />
                }
                label="Servicios de Ubicación"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.crashReports}
                    onChange={(e) => updateSetting('privacy.crashReports', e.target.checked)}
                  />
                }
                label="Reportes de Errores"
                sx={{ mb: 2 }}
              />
              
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Sus datos están protegidos y nunca se comparten con terceros sin su consentimiento.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Configuración Avanzada</Typography>
                <Chip label="Solo Desarrolladores" size="small" color="warning" sx={{ ml: 2 }} />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.debugMode}
                        onChange={(e) => updateSetting('advanced.debugMode', e.target.checked)}
                      />
                    }
                    label="Modo Debug"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.developerTools}
                        onChange={(e) => updateSetting('advanced.developerTools', e.target.checked)}
                      />
                    }
                    label="Herramientas de Desarrollo"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.experimentalFeatures}
                        onChange={(e) => updateSetting('advanced.experimentalFeatures', e.target.checked)}
                      />
                    }
                    label="Características Experimentales"
                  />
                </Grid>
              </Grid>
              
              <Alert severity="warning" sx={{ mt: 2, fontSize: '0.8rem' }}>
                Las configuraciones avanzadas pueden afectar el rendimiento del sistema. Use con precaución.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={handleReset}
        >
          Restablecer
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Guardar Configuración
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPanel;