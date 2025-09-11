import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './styles/global.css';

// Material-UI theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#4791db',
    },
    secondary: {
      main: '#dc004e',
      dark: '#9a0036',
      light: '#e33371',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 300,
    },
    h2: {
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Initialize Urban Digital Twin Platform
async function initializePlatform() {
  try {
    // Simulate iTwin.js initialization
    console.log('🏙️ Inicializando Plataforma de Gemelo Digital Urbano...');
    console.log('📍 Ubicación: Buenos Aires, Argentina');
    console.log('🔗 Conectando a servicios urbanos...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✅ Plataforma inicializada correctamente');
    console.log('🌟 Gemelo Digital Urbano Buenos Aires - Listo');
  } catch (error) {
    console.error('❌ Error inicializando plataforma:', error);
  }
}

// Initialize and render the app
async function renderApp() {
  await initializePlatform();
  
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Start the application
renderApp().catch(console.error);

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}