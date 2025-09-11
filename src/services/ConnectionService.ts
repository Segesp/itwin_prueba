export class ConnectionService {
  private static instance: ConnectionService;
  private connected: boolean = false;
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: ((connected: boolean) => void)[] = [];
  private websocket: WebSocket | null = null;

  private constructor() {
    // Monitor browser connectivity
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  public static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  public async connect(): Promise<void> {
    try {
      // Simulate connection to backend services
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        // In a real implementation, this would connect to your backend
        // For now, we'll simulate a connection
        await this.simulateConnection();
        this.setConnectionStatus(true);
        
        // Initialize WebSocket connection (simulated)
        this.initializeWebSocket();
      } else {
        this.setConnectionStatus(false);
        this.scheduleReconnect();
      }
    } catch (error) {
      console.error('Connection failed:', error);
      this.setConnectionStatus(false);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.setConnectionStatus(false);
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current status
    listener(this.connected);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private setConnectionStatus(connected: boolean): void {
    if (this.connected !== connected) {
      this.connected = connected;
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(connected);
        } catch (error) {
          console.error('Error in connection listener:', error);
        }
      });
      
      console.log(`🔗 Connection status: ${connected ? 'Connected' : 'Disconnected'}`);
    }
  }

  private async simulateConnection(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional connection failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Simulated connection failure');
    }
  }

  private initializeWebSocket(): void {
    try {
      // In a real implementation, this would connect to your WebSocket server
      // For demonstration, we'll simulate WebSocket events
      this.simulateWebSocketConnection();
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  }

  private simulateWebSocketConnection(): void {
    // Simulate periodic data updates
    const sendSimulatedData = () => {
      if (this.connected) {
        // Simulate real-time data updates
        this.broadcastData({
          type: 'sensor_update',
          timestamp: new Date(),
          data: {
            temperature: 15 + Math.random() * 20, // 15-35°C
            humidity: 40 + Math.random() * 40, // 40-80%
            airQuality: 50 + Math.random() * 100, // AQI 50-150
            traffic: Math.floor(Math.random() * 100), // 0-100%
          }
        });
        
        // Schedule next update
        setTimeout(sendSimulatedData, 30000 + Math.random() * 30000); // 30-60 seconds
      }
    };
    
    // Start sending data after initial delay
    setTimeout(sendSimulatedData, 5000);
  }

  private broadcastData(data: any): void {
    // In a real implementation, this would emit events for data updates
    // For now, we'll just log the data
    console.log('📊 Real-time data update:', data);
    
    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('urbandata', { detail: data }));
  }

  private handleOnline(): void {
    console.log('📶 Browser is online');
    this.connect();
  }

  private handleOffline(): void {
    console.log('📵 Browser is offline');
    this.setConnectionStatus(false);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      this.connect();
    }, this.reconnectInterval);
    
    // Exponential backoff (max 60 seconds)
    this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, 60000);
  }

  // Public method to send data (for future API integration)
  public async sendData(endpoint: string, data: any): Promise<any> {
    if (!this.connected) {
      throw new Error('No connection available');
    }
    
    try {
      // In a real implementation, this would make HTTP requests
      // For now, we'll simulate API calls
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      console.log(`📤 Sending data to ${endpoint}:`, data);
      
      // Simulate response
      return {
        success: true,
        data: { id: Date.now().toString(), ...data },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Failed to send data to ${endpoint}:`, error);
      throw error;
    }
  }

  // Public method to fetch data (for future API integration)
  public async fetchData(endpoint: string, params?: any): Promise<any> {
    if (!this.connected) {
      throw new Error('No connection available');
    }
    
    try {
      // In a real implementation, this would make HTTP requests
      // For now, we'll simulate API calls
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      
      console.log(`📥 Fetching data from ${endpoint} with params:`, params);
      
      // Simulate response based on endpoint
      return this.getSimulatedData(endpoint, params);
    } catch (error) {
      console.error(`Failed to fetch data from ${endpoint}:`, error);
      throw error;
    }
  }

  private getSimulatedData(endpoint: string, params?: any): any {
    // Generate simulated data based on endpoint
    switch (endpoint) {
      case 'sensors':
        return this.generateSensorData();
      case 'traffic':
        return this.generateTrafficData();
      case 'reports':
        return this.generateCitizenReports();
      case 'metrics':
        return this.generateUrbanMetrics();
      default:
        return { message: 'Simulated data', endpoint, params, timestamp: new Date() };
    }
  }

  private generateSensorData(): any {
    const barrios = ['Palermo', 'Recoleta', 'San Telmo', 'Puerto Madero', 'Belgrano', 'Villa Crespo'];
    const sensorTypes = ['temperature', 'humidity', 'air_quality', 'noise', 'traffic'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `sensor_${i + 1}`,
      type: sensorTypes[Math.floor(Math.random() * sensorTypes.length)],
      location: {
        lat: -34.6118 + (Math.random() - 0.5) * 0.1,
        lng: -58.3960 + (Math.random() - 0.5) * 0.1,
        barrio: barrios[Math.floor(Math.random() * barrios.length)],
      },
      value: Math.round((Math.random() * 100) * 100) / 100,
      status: Math.random() > 0.1 ? 'online' : 'offline',
      lastUpdate: new Date(Date.now() - Math.random() * 3600000), // Last hour
    }));
  }

  private generateTrafficData(): any {
    const streets = ['Av. 9 de Julio', 'Av. Corrientes', 'Av. Santa Fe', 'Av. Cabildo', 'Av. Rivadavia'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: `traffic_${i + 1}`,
      street: streets[Math.floor(Math.random() * streets.length)],
      vehicleCount: Math.floor(Math.random() * 200),
      averageSpeed: Math.round((20 + Math.random() * 40) * 10) / 10,
      congestionLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      timestamp: new Date(),
    }));
  }

  private generateCitizenReports(): any {
    const reportTypes = ['infrastructure', 'safety', 'environment', 'traffic', 'services'];
    const priorities = ['low', 'medium', 'high'];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `report_${i + 1}`,
      type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
      title: `Reporte ciudadano #${i + 1}`,
      description: 'Descripción del problema reportado por el ciudadano.',
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: ['pending', 'in_progress', 'resolved'][Math.floor(Math.random() * 3)],
      location: {
        lat: -34.6118 + (Math.random() - 0.5) * 0.1,
        lng: -58.3960 + (Math.random() - 0.5) * 0.1,
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600000), // Last week
    }));
  }

  private generateUrbanMetrics(): any {
    return {
      timestamp: new Date(),
      population: {
        total: 3075646,
        density: 15057,
        growth: 0.4,
      },
      traffic: {
        totalVehicles: Math.floor(800000 + Math.random() * 200000),
        averageSpeed: Math.round((25 + Math.random() * 15) * 10) / 10,
        congestionIndex: Math.round(Math.random() * 100),
        publicTransportUsage: Math.round((40 + Math.random() * 20) * 10) / 10,
      },
      environment: {
        airQualityIndex: Math.round(50 + Math.random() * 100),
        averageTemperature: Math.round((18 + Math.random() * 12) * 10) / 10,
        humidity: Math.round((50 + Math.random() * 30) * 10) / 10,
        windSpeed: Math.round(Math.random() * 20 * 10) / 10,
      },
      energy: {
        consumption: Math.round((2500 + Math.random() * 500) * 10) / 10, // MWh
        renewable: Math.round((15 + Math.random() * 10) * 10) / 10, // %
        efficiency: Math.round((75 + Math.random() * 15) * 10) / 10, // %
      },
    };
  }
}