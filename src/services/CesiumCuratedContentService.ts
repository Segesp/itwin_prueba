/**
 * Cesium Curated Content Service - Proper 3D Tiles Integration
 * 
 * Implements proper integration with Cesium Curated Content API for iTwin.js
 * - World Terrain tiles for realistic terrain context
 * - OSM Buildings for city-scale 3D building context
 * - Region filtering for Chancay, Peru performance optimization
 * - Proper authorization using iTwin Platform tokens
 * 
 * @see https://developer.bentley.com/apis/cesium-curated-content/overview/
 * @see https://developer.bentley.com/apis/cesium-curated-content/operations/list-content/
 */

export interface CuratedContentConfig {
  worldTerrain: {
    enabled: boolean;
    regionFilter?: {
      south: number;
      north: number;
      west: number;
      east: number;
    };
  };
  osmBuildings: {
    enabled: boolean;
    regionFilter?: {
      south: number;
      north: number;
      west: number;
      east: number;
    };
  };
  token: string;
  scope: string;
}

export interface ContentItem {
  id: string;
  type: 'terrain' | 'buildings' | 'imagery';
  name: string;
  description: string;
  url: string;
  attribution: string;
  boundingVolume?: {
    region: [number, number, number, number, number, number]; // [west, south, east, north, minHeight, maxHeight]
  };
}

export interface DisplayStyleAttachment {
  contentId: string;
  displayStyleId: string;
  success: boolean;
  message?: string;
}

/**
 * Cesium Curated Content Service for proper 3D Tiles integration
 */
export class CesiumCuratedContentService {
  private static instance: CesiumCuratedContentService;
  private baseUrl = 'https://api.bentley.com/cesium-curated-content';
  private config: CuratedContentConfig;

  private constructor() {
    // Default configuration for Chancay, Peru
    this.config = {
      worldTerrain: {
        enabled: true,
        regionFilter: {
          south: -11.7,   // Chancay region bounds
          north: -11.4,
          west: -77.4,
          east: -77.1
        }
      },
      osmBuildings: {
        enabled: true,
        regionFilter: {
          south: -11.7,
          north: -11.4,
          west: -77.4,
          east: -77.1
        }
      },
      token: '', // To be set by application
      scope: 'itwin-platform'
    };
  }

  public static getInstance(): CesiumCuratedContentService {
    if (!CesiumCuratedContentService.instance) {
      CesiumCuratedContentService.instance = new CesiumCuratedContentService();
    }
    return CesiumCuratedContentService.instance;
  }

  /**
   * Configure the service with authentication token and settings
   */
  public configure(config: Partial<CuratedContentConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Cesium Curated Content configured for region:', this.config.worldTerrain.regionFilter);
  }

  /**
   * List available curated content from Cesium
   * Uses proper Bentley API authentication with itwin-platform scope
   */
  public async listContent(): Promise<ContentItem[]> {
    try {
      if (!this.config.token) {
        console.warn('No authentication token provided for Cesium Curated Content API');
        return this.getMockContentItems();
      }

      const headers = {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/vnd.bentley.itwin-platform.v1+json',
        'Content-Type': 'application/json'
      };

      // Call list-content operation
      const response = await fetch(`${this.baseUrl}/content`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter content for our region and requirements
      const filteredContent = this.filterContentForChancay(data.content || []);
      
      console.log(`Retrieved ${filteredContent.length} curated content items for Chancay region`);
      return filteredContent;

    } catch (error) {
      console.error('Failed to list curated content:', error);
      console.log('Using mock content items for development');
      return this.getMockContentItems();
    }
  }

  /**
   * Attach content to a DisplayStyle3d in iTwin Viewer
   * This integrates the 3D Tiles into the viewer's scene
   */
  public async attachToDisplayStyle(contentId: string, displayStyleId: string): Promise<DisplayStyleAttachment> {
    try {
      if (!this.config.token) {
        return {
          contentId,
          displayStyleId,
          success: false,
          message: 'No authentication token provided'
        };
      }

      const headers = {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/vnd.bentley.itwin-platform.v1+json',
        'Content-Type': 'application/json'
      };

      // Attach content to display style
      const response = await fetch(`${this.baseUrl}/content/${contentId}/attach`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          displayStyleId: displayStyleId,
          regionFilter: this.config.worldTerrain.regionFilter
        })
      });

      if (!response.ok) {
        throw new Error(`Attachment failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`Successfully attached content ${contentId} to display style ${displayStyleId}`);
      
      return {
        contentId,
        displayStyleId,
        success: true,
        message: 'Content attached successfully'
      };

    } catch (error) {
      console.error(`Failed to attach content ${contentId}:`, error);
      return {
        contentId,
        displayStyleId,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Setup Chancay-specific 3D context with World Terrain and OSM Buildings
   * This is the main integration point for the iTwin Viewer
   */
  public async setupChancayContext(displayStyleId: string): Promise<DisplayStyleAttachment[]> {
    try {
      const availableContent = await this.listContent();
      const attachments: DisplayStyleAttachment[] = [];

      // Attach World Terrain if enabled
      if (this.config.worldTerrain.enabled) {
        const terrainContent = availableContent.find(item => item.type === 'terrain');
        if (terrainContent) {
          const terrainAttachment = await this.attachToDisplayStyle(terrainContent.id, displayStyleId);
          attachments.push(terrainAttachment);
        }
      }

      // Attach OSM Buildings if enabled
      if (this.config.osmBuildings.enabled) {
        const buildingsContent = availableContent.find(item => item.type === 'buildings' && item.name.includes('OSM'));
        if (buildingsContent) {
          const buildingsAttachment = await this.attachToDisplayStyle(buildingsContent.id, displayStyleId);
          attachments.push(buildingsAttachment);
        }
      }

      const successCount = attachments.filter(a => a.success).length;
      console.log(`Chancay 3D context setup: ${successCount}/${attachments.length} content items attached successfully`);

      return attachments;

    } catch (error) {
      console.error('Failed to setup Chancay 3D context:', error);
      return [];
    }
  }

  /**
   * Filter content items for Chancay region and performance
   */
  private filterContentForChancay(contentItems: any[]): ContentItem[] {
    const chancayBounds = this.config.worldTerrain.regionFilter;
    if (!chancayBounds) return contentItems;

    return contentItems
      .filter(item => {
        // Filter by type (terrain and buildings only)
        if (!['terrain', 'buildings'].includes(item.type)) return false;

        // Filter by region if bounding volume is available
        if (item.boundingVolume?.region) {
          const [west, south, east, north] = item.boundingVolume.region;
          return !(
            east < chancayBounds.west ||
            west > chancayBounds.east ||
            north < chancayBounds.south ||
            south > chancayBounds.north
          );
        }

        return true; // Include if no bounding volume (global content)
      })
      .map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        url: item.url,
        attribution: item.attribution,
        boundingVolume: item.boundingVolume
      }));
  }

  /**
   * Mock content items for development when API is not available
   */
  private getMockContentItems(): ContentItem[] {
    return [
      {
        id: 'cesium-world-terrain',
        type: 'terrain',
        name: 'Cesium World Terrain',
        description: 'High-resolution global terrain based on various data sources',
        url: 'https://world-terrain.cesium.com/tiles',
        attribution: 'Cesium World Terrain',
        boundingVolume: {
          region: [-180, -90, 180, 90, -11000, 9000] // Global coverage
        }
      },
      {
        id: 'osm-buildings',
        type: 'buildings',
        name: 'OSM Buildings',
        description: '3D buildings derived from OpenStreetMap data',
        url: 'https://osm-buildings.cesium.com/tiles',
        attribution: 'OpenStreetMap contributors',
        boundingVolume: {
          region: [-180, -90, 180, 90, 0, 500] // Global coverage, up to 500m height
        }
      }
    ];
  }

  /**
   * Get the current configuration
   */
  public getConfig(): CuratedContentConfig {
    return { ...this.config };
  }

  /**
   * Validate that the service is properly configured
   */
  public isConfigured(): boolean {
    return Boolean(this.config.token && this.config.scope);
  }
}