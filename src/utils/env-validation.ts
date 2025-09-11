import { z } from 'zod';

// Environment variables validation schema
const EnvironmentSchema = z.object({
  // iTwin.js Configuration - REQUIRED for production
  IMJS_AUTH_CLIENT_CLIENT_ID: z.string().min(1, 'iTwin client ID is required'),
  IMJS_ITWIN_ID: z.string().min(1, 'iTwin ID is required'),
  IMJS_IMODEL_ID: z.string().min(1, 'iModel ID is required'),
  IMJS_AUTH_CLIENT_REDIRECT_URI: z.string().url('Invalid redirect URI').optional(),
  IMJS_AUTH_CLIENT_LOGOUT_URI: z.string().url('Invalid logout URI').optional(),
  IMJS_AUTH_CLIENT_SCOPE: z.string().optional(),
  IMJS_AUTH_AUTHORITY: z.string().url('Invalid auth authority').optional(),
  
  // Application Configuration
  REACT_APP_NAME: z.string().optional(),
  REACT_APP_VERSION: z.string().optional(),
  REACT_APP_API_BASE_URL: z.string().url('Invalid API base URL').optional(),
  REACT_APP_WEBSOCKET_URL: z.string().optional(),
  
  // Buenos Aires Configuration
  REACT_APP_CITY_NAME: z.string().optional(),
  REACT_APP_CITY_LAT: z.string().optional(),
  REACT_APP_CITY_LNG: z.string().optional(),
  REACT_APP_CITY_ZOOM: z.string().optional(),
  
  // Feature Flags
  REACT_APP_ENABLE_3D_VIEWER: z.string().optional(),
  REACT_APP_ENABLE_ITWIN_VIEWER: z.string().optional(),
  REACT_APP_ENABLE_RULES_ENGINE: z.string().optional(),
  REACT_APP_ENABLE_SCENARIOS: z.string().optional(),
  REACT_APP_ENABLE_SIMULATION_FALLBACK: z.string().optional(),
  
  // External Services (optional)
  REACT_APP_MAPBOX_TOKEN: z.string().optional(),
  REACT_APP_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Security
  REACT_APP_ENABLE_HTTPS: z.string().optional(),
  REACT_APP_SESSION_TIMEOUT: z.string().optional(),
});

type Environment = z.infer<typeof EnvironmentSchema>;

// Environment validation result
export interface EnvironmentValidation {
  isValid: boolean;
  isTwinConfigured: boolean;
  canUseLiveViewer: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<Environment>;
}

/**
 * Validate environment variables and iTwin.js configuration
 */
export function validateEnvironment(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get environment variables (safely handle both Node.js and browser)
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  
  let config: Partial<Environment> = {};
  let isValid = true;
  
  try {
    // Validate environment schema
    config = EnvironmentSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      isValid = false;
    } else {
      errors.push(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      isValid = false;
    }
    
    // Still capture partial config for analysis
    config = env as Partial<Environment>;
  }
  
  // Check iTwin.js configuration
  const isTwinConfigured = !!(
    config.IMJS_AUTH_CLIENT_CLIENT_ID &&
    config.IMJS_ITWIN_ID &&
    config.IMJS_IMODEL_ID
  );
  
  if (!isTwinConfigured) {
    warnings.push('iTwin.js not fully configured - will use simulation fallback');
  }
  
  // Validate PKCE configuration for SPA
  if (isTwinConfigured && config.IMJS_AUTH_CLIENT_REDIRECT_URI) {
    const redirectUri = config.IMJS_AUTH_CLIENT_REDIRECT_URI;
    if (!redirectUri.includes('localhost') && !redirectUri.startsWith('https://')) {
      errors.push('Redirect URI must use HTTPS in production');
      isValid = false;
    }
  }
  
  // Check simulation fallback configuration
  const simulationFallbackEnabled = config.REACT_APP_ENABLE_SIMULATION_FALLBACK !== 'false';
  const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  
  if (isProduction && simulationFallbackEnabled) {
    warnings.push('Simulation fallback is enabled in production - consider disabling for live deployment');
  }
  
  // Validate coordinate system for Buenos Aires
  if (config.REACT_APP_CITY_LAT && config.REACT_APP_CITY_LNG) {
    const lat = parseFloat(config.REACT_APP_CITY_LAT);
    const lng = parseFloat(config.REACT_APP_CITY_LNG);
    
    // Buenos Aires bounds check
    if (lat < -35 || lat > -34 || lng < -59 || lng > -58) {
      warnings.push('City coordinates appear to be outside Buenos Aires region');
    }
  }
  
  // Check for sensitive data in client build
  const sensitiveKeys = [
    'IMJS_AUTH_CLIENT_CLIENT_SECRET', // Should never be in client
    'PRIVATE_KEY',
    'SECRET_KEY',
    'PASSWORD'
  ];
  
  sensitiveKeys.forEach(key => {
    if (config[key as keyof Environment]) {
      errors.push(`Sensitive data detected in client environment: ${key}`);
      isValid = false;
    }
  });
  
  return {
    isValid,
    isTwinConfigured,
    canUseLiveViewer: isTwinConfigured && isValid,
    errors,
    warnings,
    config
  };
}

/**
 * Get feature flag value with proper type conversion
 */
export function getFeatureFlag(key: string, defaultValue: boolean = false): boolean {
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const value = env[key];
  
  if (value === undefined) return defaultValue;
  
  return value.toLowerCase() === 'true';
}

/**
 * Get configuration for iTwin.js authentication
 */
export function getITwinAuthConfig() {
  const validation = validateEnvironment();
  
  if (!validation.isTwinConfigured) {
    return null;
  }
  
  return {
    clientId: validation.config.IMJS_AUTH_CLIENT_CLIENT_ID!,
    redirectUri: validation.config.IMJS_AUTH_CLIENT_REDIRECT_URI || `${window.location.origin}/signin-callback`,
    postSignoutRedirectUri: validation.config.IMJS_AUTH_CLIENT_LOGOUT_URI || window.location.origin,
    scope: validation.config.IMJS_AUTH_CLIENT_SCOPE || 'imodels:read imodels:modify itwin-platform',
    authority: validation.config.IMJS_AUTH_AUTHORITY || 'https://ims.bentley.com',
    // Enable PKCE for SPA security
    responseType: 'code',
    pkce: true
  };
}

/**
 * Get iTwin platform configuration
 */
export function getITwinPlatformConfig() {
  const validation = validateEnvironment();
  
  if (!validation.isTwinConfigured) {
    return null;
  }
  
  return {
    iTwinId: validation.config.IMJS_ITWIN_ID!,
    iModelId: validation.config.IMJS_IMODEL_ID!
  };
}

/**
 * Check if simulation fallback should be used
 */
export function shouldUseSimulationFallback(): boolean {
  const validation = validateEnvironment();
  
  // Use simulation fallback if:
  // 1. iTwin not configured, OR
  // 2. Validation failed, OR  
  // 3. Explicitly enabled via feature flag
  return !validation.canUseLiveViewer || getFeatureFlag('REACT_APP_ENABLE_SIMULATION_FALLBACK', true);
}

/**
 * Validate environment on application startup
 */
export function validateEnvironmentOnStartup(): void {
  const validation = validateEnvironment();
  
  console.group('🔧 Environment Validation');
  
  if (validation.isValid) {
    console.log('✅ Environment configuration is valid');
  } else {
    console.error('❌ Environment configuration has errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log(`📱 iTwin.js configured: ${validation.isTwinConfigured ? '✅' : '❌'}`);
  console.log(`🎮 Simulation fallback: ${shouldUseSimulationFallback() ? '✅' : '❌'}`);
  
  const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  if (isProduction) {
    console.log('🚀 Production mode detected');
    
    if (shouldUseSimulationFallback()) {
      console.warn('⚠️ Simulation fallback enabled in production - consider configuring iTwin.js for live data');
    }
  }
  
  console.groupEnd();
  
  // Throw error if critical validation fails
  if (!validation.isValid) {
    throw new Error('Environment validation failed - check console for details');
  }
}