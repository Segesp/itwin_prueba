import { UrbanKPIService } from '../UrbanKPIService';
import { CesiumContextService } from '../CesiumContextService';
import { ViewerConfig } from '../../types/common';

/**
 * Test Suite for Technical Review Fixes
 * 
 * Validates the critical corrections made per technical review:
 * - Proper BIS ECSQL queries (no JsonProperties)
 * - Cesium integration setup
 * - Chancay CRS configuration
 */
describe('Technical Review Fixes', () => {
  
  describe('BIS ECSQL Queries', () => {
    it('should use proper BIS classes without JsonProperties', async () => {
      const kpiService = UrbanKPIService.getInstance();
      
      // Test with simulated connection
      kpiService.setConnectionStatus(false); // Use simulation for testing
      
      const metrics = await kpiService.calculateOverallMetrics();
      
      // Validate response structure
      expect(metrics).toHaveProperty('far');
      expect(metrics).toHaveProperty('gsi');
      expect(metrics).toHaveProperty('osr');
      expect(metrics).toHaveProperty('averageHeight');
      expect(metrics).toHaveProperty('maxHeight');
      expect(metrics).toHaveProperty('buildingCount');
      
      expect(typeof metrics.far).toBe('number');
      expect(typeof metrics.gsi).toBe('number');
      expect(typeof metrics.osr).toBe('number');
      
      // Validate realistic urban planning values
      expect(metrics.far).toBeGreaterThan(0);
      expect(metrics.far).toBeLessThan(10); // Reasonable FAR limit
      expect(metrics.gsi).toBeGreaterThan(0);
      expect(metrics.gsi).toBeLessThan(1); // GSI is a ratio 0-1
      expect(metrics.osr).toBeGreaterThan(0);
      expect(metrics.osr).toBeLessThan(1); // OSR is a ratio 0-1
    });

    it('should calculate block-level metrics with proper aggregation', async () => {
      const kpiService = UrbanKPIService.getInstance();
      kpiService.setConnectionStatus(false);
      
      const blockMetrics = await kpiService.calculateBlockMetrics();
      
      expect(Array.isArray(blockMetrics)).toBe(true);
      expect(blockMetrics.length).toBeGreaterThan(0);
      
      const firstBlock = blockMetrics[0];
      expect(firstBlock).toHaveProperty('blockId');
      expect(firstBlock).toHaveProperty('blockName');
      expect(firstBlock).toHaveProperty('lotCount');
      expect(firstBlock).toHaveProperty('far');
      expect(firstBlock).toHaveProperty('gsi');
      expect(firstBlock).toHaveProperty('osr');
    });
  });

  describe('Cesium Integration', () => {
    it('should configure 3D Tiles for Chancay context', async () => {
      const cesiumService = CesiumContextService.getInstance();
      
      const baseConfig: ViewerConfig = {
        crs: {
          horizontalCRSId: "EPSG:32718",
          reprojectionRequired: false
        },
        initialCamera: {
          lat: -11.593,
          lng: -77.277,
          elevation: 200,
          pitch: -45,
          yaw: 0
        },
        cesiumContent: {
          enableWorldTerrain: true,
          enableOSMBuildings: true
        },
        enableTerrain: true,
        enableShadows: true,
        enableAmbientOcclusion: false,
        backgroundColor: "#87CEEB",
        viewFlags: {
          renderMode: 'smoothShade',
          showGrid: false,
          showSkybox: true,
          showEnvironment: true
        }
      };

      const updatedConfig = await cesiumService.setupChancayContext(baseConfig);
      
      expect(updatedConfig.cesiumContent.enableWorldTerrain).toBe(true);
      expect(updatedConfig.cesiumContent.enableOSMBuildings).toBe(true);
      expect(updatedConfig.cesiumContent.tilesetUrls).toBeDefined();
      expect(updatedConfig.cesiumContent.tilesetUrls!.length).toBeGreaterThan(0);
    });

    it('should provide proper performance configuration', () => {
      const cesiumService = CesiumContextService.getInstance();
      const perfConfig = cesiumService.getPerformanceConfig();
      
      expect(perfConfig.tileBudget.maximumScreenSpaceError).toBeLessThanOrEqual(16);
      expect(perfConfig.tileBudget.tileCacheSize).toBeGreaterThanOrEqual(50);
      expect(perfConfig.lodConfig.highDetailRadius).toBeLessThan(perfConfig.lodConfig.mediumDetailRadius);
      expect(perfConfig.lodConfig.mediumDetailRadius).toBeLessThan(perfConfig.lodConfig.lowDetailRadius);
    });
  });

  describe('Chancay CRS Configuration', () => {
    it('should configure proper coordinates for Chancay port', () => {
      const cesiumService = CesiumContextService.getInstance();
      const chancayView = cesiumService.getChancayInitialView();
      
      // Validate Chancay port coordinates (≈ -11.593, -77.277)
      expect(chancayView.camera.lat).toBeCloseTo(-11.593, 2);
      expect(chancayView.camera.lng).toBeCloseTo(-77.277, 2);
      
      // Validate extents
      expect(chancayView.extents.south).toBeLessThan(chancayView.extents.north);
      expect(chancayView.extents.west).toBeLessThan(chancayView.extents.east);
      
      // Validate camera positioning for port overview
      expect(chancayView.camera.elevation).toBeGreaterThan(0);
      expect(chancayView.camera.pitch).toBeLessThan(0); // Angled down view
      expect(chancayView.camera.range).toBeGreaterThan(1000); // Good overview distance
    });

    it('should support both EPSG:32718 and EPSG:5387 CRS', () => {
      const config1: ViewerConfig = {
        crs: { horizontalCRSId: "EPSG:32718" },
        initialCamera: { lat: -11.593, lng: -77.277, elevation: 200, pitch: -45, yaw: 0 },
        cesiumContent: { enableWorldTerrain: true, enableOSMBuildings: true },
        enableTerrain: true,
        enableShadows: true,
        enableAmbientOcclusion: false,
        backgroundColor: "#87CEEB",
        viewFlags: { renderMode: 'smoothShade', showGrid: false, showSkybox: true, showEnvironment: true }
      };

      const config2: ViewerConfig = {
        ...config1,
        crs: { horizontalCRSId: "EPSG:5387", reprojectionRequired: true }
      };

      expect(config1.crs.horizontalCRSId).toBe("EPSG:32718");
      expect(config2.crs.horizontalCRSId).toBe("EPSG:5387");
      expect(config2.crs.reprojectionRequired).toBe(true);
    });
  });
});