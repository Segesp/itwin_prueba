import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Toolbar,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Public as PublicIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  PlayCircle as SimulatorIcon,
  Analytics as DataIcon,
  Settings as SettingsIcon,
  LocationCity as CityIcon,
  Traffic as TrafficIcon,
  Park as EcoIcon,
  Security as SecurityIcon,
  LocalFireDepartment as EmergencyIcon,
} from '@mui/icons-material';

interface SidebarProps {
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  category: string;
  description: string;
  badge?: string;
  color?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    icon: <HomeIcon />,
    path: '/',
    category: 'principal',
    description: 'Vista general del gemelo digital',
  },
  {
    id: 'viewer',
    label: 'Visor 3D',
    icon: <PublicIcon />,
    path: '/viewer',
    category: 'principal',
    description: 'Visualización tridimensional de Buenos Aires',
    badge: '3D',
    color: '#4caf50',
  },
  {
    id: 'citizen',
    label: 'Portal Ciudadano',
    icon: <PeopleIcon />,
    path: '/citizen',
    category: 'interfaces',
    description: 'Herramientas para participación ciudadana',
  },
  {
    id: 'admin',
    label: 'Dashboard Administrativo',
    icon: <AdminIcon />,
    path: '/admin',
    category: 'interfaces',
    description: 'Panel de control para gestión urbana',
    badge: 'Admin',
    color: '#ff9800',
  },
  {
    id: 'simulator',
    label: 'Simulador de Escenarios',
    icon: <SimulatorIcon />,
    path: '/simulator',
    category: 'herramientas',
    description: 'Simulación de situaciones urbanas',
    badge: 'SIM',
    color: '#9c27b0',
  },
  {
    id: 'data',
    label: 'Datos en Tiempo Real',
    icon: <DataIcon />,
    path: '/data',
    category: 'herramientas',
    description: 'Monitoreo de sensores IoT y métricas',
    badge: 'Live',
    color: '#f44336',
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <SettingsIcon />,
    path: '/settings',
    category: 'sistema',
    description: 'Configuración del sistema',
  },
];

const quickActions = [
  {
    id: 'traffic',
    label: 'Tráfico',
    icon: <TrafficIcon />,
    action: () => console.log('Traffic analysis'),
    color: '#ff5722',
  },
  {
    id: 'environment',
    label: 'Ambiente',
    icon: <EcoIcon />,
    action: () => console.log('Environmental data'),
    color: '#4caf50',
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: <SecurityIcon />,
    action: () => console.log('Security monitoring'),
    color: '#2196f3',
  },
  {
    id: 'emergency',
    label: 'Emergencias',
    icon: <EmergencyIcon />,
    action: () => console.log('Emergency management'),
    color: '#f44336',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isSelected = (path: string) => {
    return location.pathname === path;
  };

  const getMenuItemsByCategory = (category: string) => {
    return menuItems.filter(item => item.category === category);
  };

  const renderMenuItem = (item: MenuItem) => (
    <ListItem key={item.id} disablePadding>
      <ListItemButton
        selected={isSelected(item.path)}
        onClick={() => handleNavigation(item.path)}
        sx={{
          borderRadius: 1,
          mx: 1,
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: isSelected(item.path) ? 'white' : 'text.secondary',
            minWidth: 40,
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          secondary={item.description}
          primaryTypographyProps={{
            fontSize: '0.9rem',
            fontWeight: isSelected(item.path) ? 600 : 400,
          }}
          secondaryTypographyProps={{
            fontSize: '0.75rem',
            color: isSelected(item.path) ? 'rgba(255,255,255,0.7)' : 'text.secondary',
          }}
        />
        {item.badge && (
          <Chip
            label={item.badge}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              backgroundColor: item.color || 'primary.main',
              color: 'white',
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          flexDirection: 'column',
          alignItems: 'flex-start',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              mr: 1,
              backgroundColor: 'primary.light',
            }}
          >
            <CityIcon />
          </Avatar>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Gemelo Digital
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
          Buenos Aires
        </Typography>
      </Toolbar>

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1, py: 1 }}>
        {/* Principal */}
        <Typography
          variant="overline"
          sx={{
            px: 1,
            py: 0.5,
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Principal
        </Typography>
        <List dense>
          {getMenuItemsByCategory('principal').map(renderMenuItem)}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Interfaces */}
        <Typography
          variant="overline"
          sx={{
            px: 1,
            py: 0.5,
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Interfaces
        </Typography>
        <List dense>
          {getMenuItemsByCategory('interfaces').map(renderMenuItem)}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Herramientas */}
        <Typography
          variant="overline"
          sx={{
            px: 1,
            py: 0.5,
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Herramientas
        </Typography>
        <List dense>
          {getMenuItemsByCategory('herramientas').map(renderMenuItem)}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Quick Actions */}
        <Typography
          variant="overline"
          sx={{
            px: 1,
            py: 0.5,
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Acceso Rápido
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, px: 1, py: 1 }}>
          {quickActions.map(action => (
            <Chip
              key={action.id}
              icon={action.icon}
              label={action.label}
              clickable
              size="small"
              onClick={action.action}
              sx={{
                backgroundColor: `${action.color}20`,
                color: action.color,
                border: `1px solid ${action.color}40`,
                '&:hover': {
                  backgroundColor: `${action.color}30`,
                },
                '& .MuiChip-icon': {
                  color: action.color,
                },
              }}
            />
          ))}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Sistema */}
        <Typography
          variant="overline"
          sx={{
            px: 1,
            py: 0.5,
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Sistema
        </Typography>
        <List dense>
          {getMenuItemsByCategory('sistema').map(renderMenuItem)}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}>
          iTwin.js Platform
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary' }}>
          v1.0.0 - Segesp
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;