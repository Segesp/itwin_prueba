import { DistrictData, IoTSensor, TrafficData, EnvironmentalData } from '../types/common';

export class BuenosAiresDataService {
  private static instance: BuenosAiresDataService;

  // Buenos Aires geographic data
  private readonly CITY_BOUNDS = {
    north: -34.5265,
    south: -34.7051,
    east: -58.3275,
    west: -58.5314,
  };

  private readonly CITY_CENTER = {
    lat: -34.6118,
    lng: -58.3960,
  };

  // Buenos Aires neighborhoods (barrios) with real coordinates
  private readonly BARRIOS: DistrictData[] = [
    {
      id: 'puerto_madero',
      name: 'Puerto Madero',
      comuna: 1,
      population: 6467,
      area: 2.1,
      density: 3080,
      coordinates: {
        center: { lat: -34.6112, lng: -58.3631 },
        bounds: { north: -34.6053, south: -34.6170, east: -58.3568, west: -58.3695 },
      },
      demographics: { averageAge: 38, households: 2890, averageIncome: 85000 },
      services: { hospitals: 1, schools: 2, policeDepartments: 1, fireStations: 1, metroStations: 0, busStops: 8 },
      environment: { greenSpaceRatio: 0.25, airQualityIndex: 65, noiseLevel: 68 },
    },
    {
      id: 'san_telmo',
      name: 'San Telmo',
      comuna: 1,
      population: 25933,
      area: 1.2,
      density: 21611,
      coordinates: {
        center: { lat: -34.6214, lng: -58.3731 },
        bounds: { north: -34.6156, south: -34.6272, east: -58.3668, west: -58.3794 },
      },
      demographics: { averageAge: 42, households: 11247, averageIncome: 45000 },
      services: { hospitals: 2, schools: 8, policeDepartments: 1, fireStations: 1, metroStations: 2, busStops: 25 },
      environment: { greenSpaceRatio: 0.15, airQualityIndex: 78, noiseLevel: 72 },
    },
    {
      id: 'palermo',
      name: 'Palermo',
      comuna: 14,
      population: 256927,
      area: 17.4,
      density: 14767,
      coordinates: {
        center: { lat: -34.5722, lng: -58.4314 },
        bounds: { north: -34.5598, south: -34.5932, east: -58.4098, west: -58.4530 },
      },
      demographics: { averageAge: 36, households: 115876, averageIncome: 62000 },
      services: { hospitals: 5, schools: 28, policeDepartments: 3, fireStations: 2, metroStations: 8, busStops: 120 },
      environment: { greenSpaceRatio: 0.35, airQualityIndex: 58, noiseLevel: 65 },
    },
    {
      id: 'recoleta',
      name: 'Recoleta',
      comuna: 2,
      population: 164023,
      area: 5.6,
      density: 29290,
      coordinates: {
        center: { lat: -34.5875, lng: -58.3974 },
        bounds: { north: -34.5798, south: -34.5952, east: -58.3887, west: -58.4061 },
      },
      demographics: { averageAge: 44, households: 73456, averageIncome: 78000 },
      services: { hospitals: 8, schools: 15, policeDepartments: 2, fireStations: 2, metroStations: 6, busStops: 65 },
      environment: { greenSpaceRatio: 0.28, airQualityIndex: 62, noiseLevel: 70 },
    },
    {
      id: 'belgrano',
      name: 'Belgrano',
      comuna: 13,
      population: 133187,
      area: 7.7,
      density: 17297,
      coordinates: {
        center: { lat: -34.5627, lng: -58.4583 },
        bounds: { north: -34.5498, south: -34.5756, east: -58.4456, west: -58.4710 },
      },
      demographics: { averageAge: 41, households: 58942, averageIncome: 71000 },
      services: { hospitals: 4, schools: 22, policeDepartments: 2, fireStations: 2, metroStations: 4, busStops: 85 },
      environment: { greenSpaceRatio: 0.22, airQualityIndex: 55, noiseLevel: 64 },
    },
  ];

  private constructor() {}

  public static getInstance(): BuenosAiresDataService {
    if (!BuenosAiresDataService.instance) {
      BuenosAiresDataService.instance = new BuenosAiresDataService();
    }
    return BuenosAiresDataService.instance;
  }

  public getBarrios(): DistrictData[] {
    return this.BARRIOS;
  }

  public getBarrio(id: string): DistrictData | undefined {
    return this.BARRIOS.find(barrio => barrio.id === id);
  }

  public getCityBounds() {
    return this.CITY_BOUNDS;
  }

  public getCityCenter() {
    return this.CITY_CENTER;
  }

  public generateSensorData(): IoTSensor[] {
    const sensors: IoTSensor[] = [];
    let sensorId = 1;

    this.BARRIOS.forEach(barrio => {
      // Temperature sensors
      for (let i = 0; i < 3; i++) {
        sensors.push({
          id: `temp_${sensorId++}`,
          type: 'environment',
          name: `Sensor Temperatura ${barrio.name} ${i + 1}`,
          location: {
            lat: barrio.coordinates.center.lat + (Math.random() - 0.5) * 0.01,
            lng: barrio.coordinates.center.lng + (Math.random() - 0.5) * 0.01,
            address: `${barrio.name}, Buenos Aires`,
          },
          status: Math.random() > 0.1 ? 'online' : 'offline',
          data: {
            value: Math.round((15 + Math.random() * 20) * 10) / 10,
            unit: '°C',
            timestamp: new Date(Date.now() - Math.random() * 3600000),
          },
          thresholds: {
            min: 5,
            max: 40,
            warning: 35,
            critical: 38,
          },
        });
      }

      // Traffic sensors
      for (let i = 0; i < 2; i++) {
        sensors.push({
          id: `traffic_${sensorId++}`,
          type: 'traffic',
          name: `Sensor Tráfico ${barrio.name} ${i + 1}`,
          location: {
            lat: barrio.coordinates.center.lat + (Math.random() - 0.5) * 0.008,
            lng: barrio.coordinates.center.lng + (Math.random() - 0.5) * 0.008,
            address: `${barrio.name}, Buenos Aires`,
          },
          status: Math.random() > 0.05 ? 'online' : 'offline',
          data: {
            value: Math.round(Math.random() * 200),
            unit: 'veh/h',
            timestamp: new Date(Date.now() - Math.random() * 1800000),
          },
          thresholds: {
            warning: 150,
            critical: 180,
          },
        });
      }

      // Air quality sensors
      sensors.push({
        id: `air_${sensorId++}`,
        type: 'environment',
        name: `Sensor Calidad Aire ${barrio.name}`,
        location: {
          lat: barrio.coordinates.center.lat,
          lng: barrio.coordinates.center.lng,
          address: `${barrio.name}, Buenos Aires`,
        },
        status: Math.random() > 0.08 ? 'online' : 'offline',
        data: {
          value: Math.round((barrio.environment.airQualityIndex + (Math.random() - 0.5) * 20) * 10) / 10,
          unit: 'AQI',
          timestamp: new Date(Date.now() - Math.random() * 900000),
        },
        thresholds: {
          warning: 100,
          critical: 150,
        },
      });
    });

    return sensors;
  }

  public generateTrafficData(): TrafficData[] {
    const trafficData: TrafficData[] = [];
    
    // Major avenues in Buenos Aires
    const majorAvenues = [
      { name: 'Av. 9 de Julio', lat: -34.6037, lng: -58.3816 },
      { name: 'Av. Corrientes', lat: -34.6034, lng: -58.3959 },
      { name: 'Av. Santa Fe', lat: -34.5945, lng: -58.3974 },
      { name: 'Av. Cabildo', lat: -34.5627, lng: -58.4583 },
      { name: 'Av. Rivadavia', lat: -34.6097, lng: -58.3959 },
      { name: 'Av. Las Heras', lat: -34.5881, lng: -58.3959 },
      { name: 'Av. Libertador', lat: -34.5792, lng: -58.4058 },
    ];

    majorAvenues.forEach((avenue, index) => {
      // Generate traffic data for different times of day
      const baseSpeed = 35 + Math.random() * 20;
      const currentHour = new Date().getHours();
      let speedModifier = 1;
      
      // Rush hour effects
      if ((currentHour >= 7 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20)) {
        speedModifier = 0.6; // Slower during rush hours
      } else if (currentHour >= 0 && currentHour <= 6) {
        speedModifier = 1.3; // Faster during night
      }

      const vehicleCount = Math.floor(50 + Math.random() * 150);
      const averageSpeed = Math.round(baseSpeed * speedModifier * 10) / 10;
      
      let congestionLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (averageSpeed < 20) congestionLevel = 'critical';
      else if (averageSpeed < 30) congestionLevel = 'high';
      else if (averageSpeed < 40) congestionLevel = 'medium';

      trafficData.push({
        sensorId: `traffic_avenue_${index + 1}`,
        timestamp: new Date(),
        vehicleCount,
        averageSpeed,
        congestionLevel,
        vehicleTypes: {
          cars: Math.floor(vehicleCount * 0.7),
          buses: Math.floor(vehicleCount * 0.15),
          trucks: Math.floor(vehicleCount * 0.1),
          motorcycles: Math.floor(vehicleCount * 0.05),
        },
      });
    });

    return trafficData;
  }

  public generateEnvironmentalData(): EnvironmentalData[] {
    const environmentalData: EnvironmentalData[] = [];
    
    this.BARRIOS.forEach((barrio, index) => {
      // Base environmental conditions for Buenos Aires
      const baseTemp = 18; // Average temperature in Buenos Aires
      const seasonalVariation = Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * 8;
      const temperature = Math.round((baseTemp + seasonalVariation + (Math.random() - 0.5) * 6) * 10) / 10;
      
      environmentalData.push({
        sensorId: `env_${barrio.id}`,
        timestamp: new Date(),
        temperature,
        humidity: Math.round((60 + (Math.random() - 0.5) * 30) * 10) / 10,
        airQuality: {
          pm25: Math.round((barrio.environment.airQualityIndex * 0.4 + Math.random() * 10) * 10) / 10,
          pm10: Math.round((barrio.environment.airQualityIndex * 0.6 + Math.random() * 15) * 10) / 10,
          co2: Math.round((400 + Math.random() * 100) * 10) / 10,
          no2: Math.round((30 + Math.random() * 20) * 10) / 10,
          ozone: Math.round((50 + Math.random() * 30) * 10) / 10,
        },
        noiseLevel: Math.round((barrio.environment.noiseLevel + (Math.random() - 0.5) * 10) * 10) / 10,
        windSpeed: Math.round((8 + Math.random() * 12) * 10) / 10,
        windDirection: Math.round(Math.random() * 360),
      });
    });

    return environmentalData;
  }

  public getPopularLocations() {
    return [
      {
        id: 'obelisco',
        name: 'Obelisco',
        coordinates: { lat: -34.6037, lng: -58.3816 },
        type: 'monument',
        description: 'Símbolo icónico de Buenos Aires',
      },
      {
        id: 'puerto_madero_puente',
        name: 'Puente de la Mujer',
        coordinates: { lat: -34.6107, lng: -58.3626 },
        type: 'landmark',
        description: 'Puente giratorio en Puerto Madero',
      },
      {
        id: 'plaza_mayo',
        name: 'Plaza de Mayo',
        coordinates: { lat: -34.6083, lng: -58.3712 },
        type: 'plaza',
        description: 'Plaza histórica y sede del gobierno',
      },
      {
        id: 'caminito',
        name: 'Caminito',
        coordinates: { lat: -34.6345, lng: -58.3634 },
        type: 'tourist_attraction',
        description: 'Museo a cielo abierto en La Boca',
      },
      {
        id: 'palermo_bosques',
        name: 'Bosques de Palermo',
        coordinates: { lat: -34.5739, lng: -58.4175 },
        type: 'park',
        description: 'Principal espacio verde de la ciudad',
      },
      {
        id: 'microcentro',
        name: 'Microcentro',
        coordinates: { lat: -34.6059, lng: -58.3756 },
        type: 'business_district',
        description: 'Centro financiero y comercial',
      },
    ];
  }

  public getTransportationNetwork() {
    return {
      subway: {
        lines: [
          {
            id: 'linea_a',
            name: 'Línea A',
            color: '#00BFFF',
            stations: 18,
            length: 11.5, // km
            avgFrequency: 4, // minutes
          },
          {
            id: 'linea_b',
            name: 'Línea B',
            color: '#DC143C',
            stations: 17,
            length: 11.8,
            avgFrequency: 3.5,
          },
          {
            id: 'linea_c',
            name: 'Línea C',
            color: '#0000FF',
            stations: 9,
            length: 4.4,
            avgFrequency: 5,
          },
          {
            id: 'linea_d',
            name: 'Línea D',
            color: '#32CD32',
            stations: 16,
            length: 10.4,
            avgFrequency: 4,
          },
          {
            id: 'linea_e',
            name: 'Línea E',
            color: '#800080',
            stations: 15,
            length: 9.6,
            avgFrequency: 4.5,
          },
          {
            id: 'linea_h',
            name: 'Línea H',
            color: '#FFFF00',
            stations: 12,
            length: 7.8,
            avgFrequency: 5,
          },
        ],
      },
      buses: {
        totalLines: 138,
        totalStops: 12500,
        avgFrequency: 8, // minutes
        dailyRidership: 4200000,
      },
      metrobus: {
        lines: [
          { id: 'mb_9_julio', name: '9 de Julio', length: 3.6, stations: 17 },
          { id: 'mb_juan_b_justo', name: 'Juan B. Justo', length: 12.3, stations: 21 },
          { id: 'mb_norte', name: 'Norte', length: 8.5, stations: 13 },
        ],
      },
      bikes: {
        stations: 400,
        bikes: 4000,
        dailyTrips: 25000,
      },
    };
  }

  public calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public isWithinCityBounds(coordinates: { lat: number; lng: number }): boolean {
    return (
      coordinates.lat >= this.CITY_BOUNDS.south &&
      coordinates.lat <= this.CITY_BOUNDS.north &&
      coordinates.lng >= this.CITY_BOUNDS.west &&
      coordinates.lng <= this.CITY_BOUNDS.east
    );
  }

  public findNearestBarrio(coordinates: { lat: number; lng: number }): DistrictData | null {
    let nearest: DistrictData | null = null;
    let minDistance = Infinity;

    this.BARRIOS.forEach(barrio => {
      const distance = this.calculateDistance(coordinates, barrio.coordinates.center);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = barrio;
      }
    });

    return nearest;
  }

  public generateUrbanEvents() {
    const eventTypes = [
      'traffic_congestion',
      'public_event',
      'construction',
      'emergency',
      'weather_alert',
      'public_transport_delay',
    ];

    return Array.from({ length: 5 }, (_, i) => ({
      id: `event_${i + 1}`,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      title: `Evento Urbano ${i + 1}`,
      description: 'Descripción del evento que afecta el área urbana.',
      location: {
        lat: this.CITY_CENTER.lat + (Math.random() - 0.5) * 0.05,
        lng: this.CITY_CENTER.lng + (Math.random() - 0.5) * 0.05,
      },
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      startTime: new Date(Date.now() - Math.random() * 7200000), // Last 2 hours
      estimatedDuration: Math.floor(30 + Math.random() * 180), // 30-210 minutes
      affectedArea: Math.round((0.5 + Math.random() * 2) * 100) / 100, // km²
      status: ['active', 'resolved', 'monitoring'][Math.floor(Math.random() * 3)],
    }));
  }

  public getWeatherData() {
    const currentHour = new Date().getHours();
    const baseTemp = 18; // Buenos Aires average
    const seasonalAdj = Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * 8;
    const dailyAdj = Math.sin(((currentHour - 6) / 24) * 2 * Math.PI) * 5;
    
    return {
      current: {
        temperature: Math.round((baseTemp + seasonalAdj + dailyAdj) * 10) / 10,
        humidity: Math.round((65 + Math.random() * 20) * 10) / 10,
        pressure: Math.round((1013 + (Math.random() - 0.5) * 20) * 10) / 10,
        windSpeed: Math.round((8 + Math.random() * 15) * 10) / 10,
        windDirection: Math.round(Math.random() * 360),
        visibility: Math.round((8 + Math.random() * 2) * 10) / 10,
        uvIndex: Math.max(0, Math.round((5 + Math.random() * 6) * 10) / 10),
        conditions: ['Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvia ligera'][Math.floor(Math.random() * 4)],
      },
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 3600000),
        maxTemp: Math.round((baseTemp + seasonalAdj + Math.random() * 8) * 10) / 10,
        minTemp: Math.round((baseTemp + seasonalAdj - 5 + Math.random() * 5) * 10) / 10,
        humidity: Math.round((60 + Math.random() * 25) * 10) / 10,
        precipitationChance: Math.round(Math.random() * 100),
        conditions: ['Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvia'][Math.floor(Math.random() * 4)],
      })),
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}