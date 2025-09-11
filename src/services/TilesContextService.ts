import axios from 'axios';

/**
 * 3D Tiles Context Service for Cesium World Terrain and OSM Buildings
 * Integrates with iTwin Platform's Cesium Curated Content API 
 */

export interface TilesContextConfig {
  enableWorldTerrain: boolean;
  enableOSMBuildings: boolean;
  bbox?: [number, number, number, number]; // [west, south, east, north]
  maxZoom?: number;
}

export interface TilesetInfo {
  url: string;
  type: 'terrain' | 'buildings' | 'imagery';
  provider: 'cesium' | 'osm' | 'custom';
  bounds?: [number, number, number, number];
  attribution?: string;
}

/**
 * Service for managing 3D Tiles context data for urban digital twins
 */
export class TilesContextService {
  private cesiumAccessToken: string;
  private iTwinApiBase: string;
  private config: TilesContextConfig;

  constructor(
    cesiumAccessToken: string,
    iTwinApiBase: string = 'https://api.bentley.com',
    config: TilesContextConfig = { enableWorldTerrain: true, enableOSMBuildings: true }
  ) {
    this.cesiumAccessToken = cesiumAccessToken;
    this.iTwinApiBase = iTwinApiBase;
    this.config = config;
  }

  /**
   * Get Cesium World Terrain tileset for global context
   */
  async getWorldTerrainTileset(bounds?: [number, number, number, number]): Promise<TilesetInfo> {
    if (!this.config.enableWorldTerrain) {
      throw new Error('World Terrain is disabled in configuration');
    }

    // Use Cesium Ion's World Terrain asset
    const worldTerrainAssetId = 1; // Cesium World Terrain asset ID
    
    try {
      // Get access to Cesium Ion asset via iTwin Platform integration
      const response = await axios.get(
        `${this.iTwinApiBase}/cesium/assets/${worldTerrainAssetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.cesiumAccessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        url: `https://assets.cesium.com/1/tileset.json?access_token=${this.cesiumAccessToken}`,
        type: 'terrain',
        provider: 'cesium',
        bounds: bounds || [-180, -90, 180, 90],
        attribution: 'Cesium World Terrain'
      };
    } catch (error) {
      console.warn('Failed to access Cesium World Terrain via iTwin API, using direct access');
      
      // Fallback to direct Cesium Ion access
      return {
        url: `https://assets.cesium.com/1/tileset.json?access_token=${this.cesiumAccessToken}`,
        type: 'terrain',
        provider: 'cesium',
        bounds: bounds || [-180, -90, 180, 90],
        attribution: 'Cesium World Terrain'
      };
    }
  }

  /**
   * Get OSM Buildings 3D tileset for urban context
   */
  async getOSMBuildingsTileset(bounds?: [number, number, number, number]): Promise<TilesetInfo> {
    if (!this.config.enableOSMBuildings) {
      throw new Error('OSM Buildings is disabled in configuration');
    }

    // Use Cesium OSM Buildings asset
    const osmBuildingsAssetId = 96188; // Cesium OSM Buildings asset ID
    
    try {
      const response = await axios.get(
        `${this.iTwinApiBase}/cesium/assets/${osmBuildingsAssetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.cesiumAccessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        url: `https://assets.cesium.com/96188/tileset.json?access_token=${this.cesiumAccessToken}`,
        type: 'buildings',
        provider: 'cesium',
        bounds: bounds || [-180, -90, 180, 90],
        attribution: 'OpenStreetMap, Cesium OSM Buildings'
      };
    } catch (error) {
      console.warn('Failed to access OSM Buildings via iTwin API, using direct access');
      
      return {
        url: `https://assets.cesium.com/96188/tileset.json?access_token=${this.cesiumAccessToken}`,
        type: 'buildings', 
        provider: 'cesium',
        bounds: bounds || [-180, -90, 180, 90],
        attribution: 'OpenStreetMap, Cesium OSM Buildings'
      };
    }
  }

  /**
   * Get context tilesets for specific region (e.g., Chancay, Lima)
   */
  async getRegionalContextTilesets(region: 'chancay' | 'buenos-aires'): Promise<TilesetInfo[]> {
    const tilesets: TilesetInfo[] = [];
    
    // Define regional bounds
    const regionalBounds = this.getRegionalBounds(region);
    
    // Add terrain if enabled
    if (this.config.enableWorldTerrain) {
      try {
        const terrain = await this.getWorldTerrainTileset(regionalBounds);
        tilesets.push(terrain);
      } catch (error) {
        console.error('Failed to load terrain tileset:', error);
      }
    }
    
    // Add buildings if enabled
    if (this.config.enableOSMBuildings) {
      try {
        const buildings = await this.getOSMBuildingsTileset(regionalBounds);
        tilesets.push(buildings);
      } catch (error) {
        console.error('Failed to load buildings tileset:', error);
      }
    }
    
    return tilesets;
  }

  /**
   * Get bounds for specific regions
   */
  private getRegionalBounds(region: 'chancay' | 'buenos-aires'): [number, number, number, number] {
    switch (region) {
      case 'chancay':
        // Chancay, Lima bounds: approximately 11.4°S to 11.7°S, 77.4°W to 77.1°W
        return [-77.4, -11.7, -77.1, -11.4]; // [west, south, east, north]
      
      case 'buenos-aires':
        // Buenos Aires bounds: approximately 34.5°S to 34.7°S, 58.5°W to 58.3°W  
        return [-58.5, -34.7, -58.3, -34.5]; // [west, south, east, north]
      
      default:
        return [-180, -90, 180, 90]; // Global bounds
    }
  }

  /**
   * Validate 3D tileset accessibility and performance
   */
  async validateTileset(tilesetUrl: string): Promise<{ valid: boolean; error?: string; metadata?: any }> {
    try {
      const response = await axios.get(tilesetUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Check if it's a valid 3D Tiles tileset.json
      if (response.data.asset && response.data.geometricError !== undefined) {
        return {
          valid: true,
          metadata: {
            version: response.data.asset.version,
            geometricError: response.data.geometricError,
            refine: response.data.refine,
            boundingVolume: response.data.root?.boundingVolume
          }
        };
      } else {
        return {
          valid: false,
          error: 'Invalid 3D Tiles tileset format'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate tileset'
      };
    }
  }

  /**
   * Get recommended LOD (Level of Detail) configuration for urban analysis
   */
  getRecommendedLODConfig(analysisType: 'urban-planning' | 'infrastructure' | 'visualization'): any {
    switch (analysisType) {
      case 'urban-planning':
        return {
          terrain: { maxScreenSpaceError: 2, skipLevels: 0 },
          buildings: { maxScreenSpaceError: 16, skipLevels: 1 },
          enableCollision: false,
          enableShadows: true
        };
      
      case 'infrastructure':
        return {
          terrain: { maxScreenSpaceError: 1, skipLevels: 0 },
          buildings: { maxScreenSpaceError: 8, skipLevels: 0 },
          enableCollision: true,
          enableShadows: true
        };
      
      case 'visualization':
        return {
          terrain: { maxScreenSpaceError: 4, skipLevels: 1 },
          buildings: { maxScreenSpaceError: 32, skipLevels: 2 },
          enableCollision: false,
          enableShadows: false
        };
      
      default:
        return {
          terrain: { maxScreenSpaceError: 2, skipLevels: 0 },
          buildings: { maxScreenSpaceError: 16, skipLevels: 1 },
          enableCollision: false,
          enableShadows: true
        };
    }
  }
}

/**
 * Factory function to create TilesContextService with environment configuration
 */
export function createTilesContextService(): TilesContextService {
  const cesiumToken = process.env.REACT_APP_CESIUM_ACCESS_TOKEN || 
                     process.env.CESIUM_ACCESS_TOKEN;
  
  if (!cesiumToken) {
    throw new Error('Cesium access token not configured. Set REACT_APP_CESIUM_ACCESS_TOKEN or CESIUM_ACCESS_TOKEN');
  }

  const config: TilesContextConfig = {
    enableWorldTerrain: process.env.REACT_APP_ENABLE_WORLD_TERRAIN !== 'false',
    enableOSMBuildings: process.env.REACT_APP_ENABLE_OSM_BUILDINGS !== 'false',
    maxZoom: parseInt(process.env.REACT_APP_MAX_TERRAIN_ZOOM || '18')
  };

  return new TilesContextService(cesiumToken, undefined, config);
}