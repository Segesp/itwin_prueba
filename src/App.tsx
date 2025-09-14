import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, Alert, Snackbar } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';

// Components
import Sidebar from './components/Sidebar/Sidebar';
import Home from './components/Home/Home';
import UrbanViewer from './components/UrbanViewer/UrbanViewer';
import RealITwinViewer from './components/RealITwinViewer';
import CitizenDashboard from './components/CitizenDashboard/CitizenDashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import UrbanKPIDashboard from './components/UrbanKPIDashboard/UrbanKPIDashboard';
import ScenarioSimulator from './components/ScenarioSimulator/ScenarioSimulator';
import RealTimeData from './components/RealTimeData/RealTimeData';
import SettingsPanel from './components/Settings/SettingsPanel';

// Services
import { ConnectionService } from './services/ConnectionService';
import { NotificationService } from './services/NotificationService';
import { shouldUseSimulationFallback, getFeatureFlag } from './utils/env-validation';

// Types
import { AppNotification } from './types/common';

// Styles
import './styles/App.css';

const DRAWER_WIDTH = 280;

/**
 * Smart Viewer Component - Chooses between Real iTwin Viewer and Simulation
 */
const SmartViewer: React.FC = () => {
  const useSimulation = shouldUseSimulationFallback();
  const enableITwinViewer = getFeatureFlag('REACT_APP_ENABLE_ITWIN_VIEWER', true);

  console.log('🎯 Smart Viewer Configuration:', {
    useSimulation,
    enableITwinViewer,
    viewerChoice: useSimulation ? 'Simulation' : 'Real iTwin'
  });

  if (!enableITwinViewer) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        color: '#6c757d'
      }}>
        <h3>3D Viewer Disabled</h3>
        <p>Enable REACT_APP_ENABLE_ITWIN_VIEWER to use the viewer</p>
      </div>
    );
  }

  if (useSimulation) {
    console.log('🎮 Using simulation viewer (UrbanViewer)');
    return <UrbanViewer />;
  } else {
    console.log('🏗️ Using real iTwin viewer');
    return (
      <RealITwinViewer
        onIModelConnected={(iModel) => {
          console.log('📋 iModel connected to Smart Viewer:', iModel.name);
        }}
        onViewerReady={() => {
          console.log('✅ Real iTwin Viewer ready');
        }}
        onError={(error) => {
          console.error('❌ Real iTwin Viewer error:', error);
          // Could fall back to simulation here if needed
        }}
        onTelemetry={(data) => {
          console.log('📊 Viewer telemetry:', data);
        }}
        style={{ height: '100%', width: '100%' }}
      />
    );
  }
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    // Initialize services
    const connectionService = ConnectionService.getInstance();
    const notificationService = NotificationService.getInstance();

    // Setup connection monitoring
    connectionService.onConnectionChange((isConnected) => {
      setConnected(isConnected);
      if (isConnected) {
        notificationService.addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Conexión Establecida',
          message: 'Conectado al gemelo digital urbano de Buenos Aires',
          timestamp: new Date(),
        });
      } else {
        notificationService.addNotification({
          id: Date.now().toString(),
          type: 'warning',
          title: 'Conexión Perdida',
          message: 'Reintentando conexión...',
          timestamp: new Date(),
        });
      }
    });

    // Setup notification listener
    notificationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
      setCurrentNotification(notification);
    });

    // Initial connection attempt
    connectionService.connect();

    return () => {
      connectionService.disconnect();
    };
  }, []);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseNotification = () => {
    setCurrentNotification(null);
  };

  const getConnectionStatusColor = () => {
    return connected ? '#4caf50' : '#f44336';
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
          ml: { sm: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: 'width 0.3s, margin 0.3s',
          backgroundColor: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gemelo Digital Urbano - Buenos Aires
          </Typography>
          
          {/* Connection Status Indicator */}
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getConnectionStatusColor(),
              mr: 1,
              animation: connected ? 'none' : 'pulse 2s infinite',
            }}
          />
          <Typography variant="body2" sx={{ mr: 2 }}>
            {connected ? 'Conectado' : 'Desconectado'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: sidebarOpen ? DRAWER_WIDTH : 0 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </Drawer>
        
        <Drawer
          variant="persistent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open={sidebarOpen}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
          transition: 'width 0.3s',
          overflow: 'hidden',
        }}
      >
        <Toolbar /> {/* Space for AppBar */}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/viewer" element={<SmartViewer />} />
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/kpi" element={<UrbanKPIDashboard />} />
          <Route path="/simulator" element={<ScenarioSimulator />} />
          <Route path="/data" element={<RealTimeData />} />
          <Route path="/settings" element={<SettingsPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!currentNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={currentNotification?.type || 'info'}
          variant="filled"
          action={
            <IconButton
              size="small"
              aria-label="cerrar"
              color="inherit"
              onClick={handleCloseNotification}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="subtitle2">{currentNotification?.title}</Typography>
            <Typography variant="body2">{currentNotification?.message}</Typography>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;