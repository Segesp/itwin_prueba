// Common types for the Urban Digital Twin platform

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    callback: () => void;
  };
}

export interface UrbanElement {
  id: string;
  type: 'building' | 'road' | 'park' | 'infrastructure';
  name: string;
  coordinates: {
    lat: number;
    lng: number;
    elevation?: number;
  };
  properties: Record<string, any>;
  status: 'active' | 'inactive' | 'maintenance' | 'planned';
  lastUpdated: Date;
}

export interface IoTSensor {
  id: string;
  type: 'traffic' | 'environment' | 'energy' | 'water' | 'waste' | 'security';
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'online' | 'offline' | 'error';
  data: {
    value: number;
    unit: string;
    timestamp: Date;
  };
  thresholds: {
    min?: number;
    max?: number;
    warning?: number;
    critical?: number;
  };
}

export interface TrafficData {
  sensorId: string;
  timestamp: Date;
  vehicleCount: number;
  averageSpeed: number; // km/h
  congestionLevel: 'low' | 'medium' | 'high' | 'critical';
  vehicleTypes: {
    cars: number;
    buses: number;
    trucks: number;
    motorcycles: number;
  };
}

export interface EnvironmentalData {
  sensorId: string;
  timestamp: Date;
  temperature: number; // °C
  humidity: number; // %
  airQuality: {
    pm25: number; // μg/m³
    pm10: number; // μg/m³
    co2: number; // ppm
    no2: number; // μg/m³
    ozone: number; // μg/m³
  };
  noiseLevel: number; // dB
  windSpeed: number; // km/h
  windDirection: number; // degrees
}

export interface CitizenReport {
  id: string;
  type: 'infrastructure' | 'safety' | 'environment' | 'traffic' | 'services';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reporter: {
    id?: string;
    name?: string;
    email?: string;
    anonymous: boolean;
  };
  attachments?: {
    type: 'image' | 'video' | 'document';
    url: string;
    description: string;
  }[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type: 'traffic' | 'emergency' | 'development' | 'environment' | 'event';
  parameters: Record<string, any>;
  area: {
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    center: {
      lat: number;
      lng: number;
    };
  };
  duration: number; // minutes
  status: 'draft' | 'running' | 'completed' | 'failed';
  results?: {
    metrics: Record<string, number>;
    visualizations: string[];
    recommendations: string[];
  };
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
}

export interface UrbanMetrics {
  timestamp: Date;
  population: {
    total: number;
    density: number; // per km²
    demographics: {
      age_0_14: number;
      age_15_64: number;
      age_65_plus: number;
    };
  };
  traffic: {
    totalVehicles: number;
    averageSpeed: number;
    congestionIndex: number;
    publicTransportUsage: number;
  };
  environment: {
    airQualityIndex: number;
    averageTemperature: number;
    energyConsumption: number; // MWh
    waterConsumption: number; // m³
    wasteGeneration: number; // tons
  };
  economy: {
    gdpPerCapita: number;
    unemploymentRate: number;
    businessActivity: number;
  };
  infrastructure: {
    roadConditionIndex: number;
    publicSpaceQuality: number;
    digitalConnectivity: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'planner' | 'administrator' | 'analyst' | 'emergency';
  permissions: string[];
  preferences: {
    language: 'es' | 'en';
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      types: string[];
    };
  };
  profile: {
    avatar?: string;
    organization?: string;
    department?: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
  };
  lastLogin: Date;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ViewerConfig {
  iModelId?: string;
  contextId?: string;
  mapLayersUrl?: string;
  realityDataUrl?: string;
  viewDefinitionId?: string;
  enableTerrain: boolean;
  enableShadows: boolean;
  enableAmbientOcclusion: boolean;
  backgroundColor: string;
  viewFlags: {
    renderMode: 'wireframe' | 'hiddenLine' | 'solidFill' | 'smoothShade';
    showGrid: boolean;
    showSkybox: boolean;
    showEnvironment: boolean;
  };
}

// Buenos Aires specific types
export interface BarrioData {
  id: string;
  name: string;
  comuna: number;
  population: number;
  area: number; // km²
  density: number; // per km²
  coordinates: {
    center: { lat: number; lng: number };
    bounds: { north: number; south: number; east: number; west: number };
  };
  demographics: {
    averageAge: number;
    households: number;
    averageIncome: number;
  };
  services: {
    hospitals: number;
    schools: number;
    policeDepartments: number;
    fireStations: number;
    metroStations: number;
    busStops: number;
  };
  environment: {
    greenSpaceRatio: number;
    airQualityIndex: number;
    noiseLevel: number;
  };
}

export type EventType = 
  | 'user_interaction'
  | 'data_update' 
  | 'system_alert'
  | 'simulation_start'
  | 'simulation_end'
  | 'connection_change'
  | 'error_occurred';

export interface SystemEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  source: string;
  data: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  processed: boolean;
}