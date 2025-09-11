import { ConnectionService } from './ConnectionService';

interface UrbanMetrics {
  far: number; // Floor Area Ratio
  gsi: number; // Ground Space Index  
  osr: number; // Open Space Ratio
  averageHeight: number;
  maxHeight: number;
  buildingCount: number;
  totalFloorArea: number;
  totalSiteArea: number;
  greenSpaceArea: number;
  populationDensity: number;
  parkingRatio: number;
}

interface BlockMetrics extends UrbanMetrics {
  blockId: string;
  blockName: string;
  lotCount: number;
}

interface BuildingData {
  elementId: string;
  height: number;
  footprintArea: number;
  floorArea: number;
  blockId?: string;
  lotId?: string;
  category: string;
  volume: number;
}

interface LotData {
  lotId: string;
  blockId: string;
  siteArea: number;
  greenSpaceArea: number;
  buildingFootprintArea: number;
  category: string;
}

/**
 * Urban KPI Service - Uses ECSQL queries to calculate urban planning metrics
 * This service provides real-time KPI calculations for urban development projects
 * 
 * In production, this would connect to iTwin.js IModelConnection for real ECSQL queries.
 * For development, it provides realistic simulated data based on urban planning standards.
 */
export class UrbanKPIService {
  private static instance: UrbanKPIService;
  private connectionService: ConnectionService;
  private hasRealConnection = false;

  private constructor() {
    this.connectionService = ConnectionService.getInstance();
  }

  public static getInstance(): UrbanKPIService {
    if (!UrbanKPIService.instance) {
      UrbanKPIService.instance = new UrbanKPIService();
    }
    return UrbanKPIService.instance;
  }

  /**
   * Set connection status for determining whether to use real ECSQL or simulation
   */
  public setConnectionStatus(hasConnection: boolean): void {
    this.hasRealConnection = hasConnection;
  }

  /**
   * Calculate overall urban metrics for the entire project
   * 
   * Production ECSQL Query Example:
   * ```sql
   * SELECT 
   *   COUNT(*) as buildingCount,
   *   AVG(json_extract(e.JsonProperties, '$.height')) as avgHeight,
   *   MAX(json_extract(e.JsonProperties, '$.height')) as maxHeight,
   *   SUM(json_extract(e.JsonProperties, '$.floorArea')) as totalFloorArea,
   *   SUM(json_extract(e.JsonProperties, '$.footprintArea')) as totalFootprint
   * FROM BisCore.PhysicalElement e 
   * JOIN BisCore.Category c ON e.Category.Id = c.ECInstanceId
   * WHERE c.CodeValue LIKE '%Building%'
   * ```
   */
  public async calculateOverallMetrics(): Promise<UrbanMetrics> {
    if (this.hasRealConnection) {
      try {
        // In production, this would execute real ECSQL queries
        const buildings = await this.queryBuildingDataFromiModel();
        const lots = await this.queryLotDataFromiModel();
        return this.calculateMetricsFromData(buildings, lots);
      } catch (error) {
        console.error('Error executing ECSQL queries:', error);
        return this.getSimulatedOverallMetrics();
      }
    } else {
      // Development mode: return realistic simulated data
      return this.getSimulatedOverallMetrics();
    }
  }

  /**
   * Calculate block-by-block urban metrics
   * 
   * Production ECSQL Query Example:
   * ```sql
   * SELECT 
   *   COALESCE(json_extract(e.JsonProperties, '$.blockId'), 'B1') as blockId,
   *   COUNT(*) as buildingCount,
   *   AVG(json_extract(e.JsonProperties, '$.height')) as avgHeight,
   *   SUM(json_extract(e.JsonProperties, '$.floorArea')) as blockFloorArea
   * FROM BisCore.PhysicalElement e 
   * JOIN BisCore.Category c ON e.Category.Id = c.ECInstanceId
   * WHERE c.CodeValue LIKE '%Building%'
   * GROUP BY json_extract(e.JsonProperties, '$.blockId')
   * ```
   */
  public async calculateBlockMetrics(): Promise<BlockMetrics[]> {
    if (this.hasRealConnection) {
      try {
        // In production, this would execute real ECSQL queries
        const buildings = await this.queryBuildingDataFromiModel();
        const lots = await this.queryLotDataFromiModel();
        return this.calculateBlockMetricsFromData(buildings, lots);
      } catch (error) {
        console.error('Error executing block ECSQL queries:', error);
        return this.getSimulatedBlockMetrics();
      }
    } else {
      // Development mode: return realistic simulated data
      return this.getSimulatedBlockMetrics();
    }
  }

  /**
   * Query building data from iModel using ECSQL (production implementation)
   * This would be called when connected to a real iTwin.js iModel
   */
  private async queryBuildingDataFromiModel(): Promise<BuildingData[]> {
    // Production implementation would use:
    // const reader = iModelConnection.createQueryReader(query);
    // for await (const row of reader) { ... }
    
    // For now, simulate the ECSQL query results
    console.log('Simulating ECSQL building query execution...');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate query time
    
    return this.getEstimatedBuildingData();
  }

  /**
   * Query lot/parcel data from iModel using ECSQL (production implementation)
   */
  private async queryLotDataFromiModel(): Promise<LotData[]> {
    // Production implementation would execute lot-specific ECSQL queries
    console.log('Simulating ECSQL lot query execution...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate query time
    
    return this.getEstimatedLotData();
  }

  /**
   * Calculate urban metrics from building and lot data
   */
  private calculateMetricsFromData(buildings: BuildingData[], lots: LotData[]): UrbanMetrics {
    const totalFloorArea = buildings.reduce((sum, b) => sum + b.floorArea, 0);
    const totalFootprintArea = buildings.reduce((sum, b) => sum + b.footprintArea, 0);
    const totalSiteArea = lots.reduce((sum, l) => sum + l.siteArea, 0) || 
                          buildings.length * 400; // Fallback estimate
    const totalGreenSpace = lots.reduce((sum, l) => sum + l.greenSpaceArea, 0) || 
                           totalSiteArea * 0.2; // 20% fallback
    
    const averageHeight = buildings.length > 0 ? 
      buildings.reduce((sum, b) => sum + b.height, 0) / buildings.length : 25;
    const maxHeight = buildings.length > 0 ? 
      Math.max(...buildings.map(b => b.height)) : 45;

    // Calculate key urban planning ratios
    const far = totalSiteArea > 0 ? totalFloorArea / totalSiteArea : 1.5;
    const gsi = totalSiteArea > 0 ? totalFootprintArea / totalSiteArea : 0.4;
    const osr = totalSiteArea > 0 ? totalGreenSpace / totalSiteArea : 0.2;

    // Estimate population density (assuming 40 m²/person average)
    const populationDensity = totalFloorArea > 0 ? (totalFloorArea / 40) / (totalSiteArea / 10000) : 120;
    
    // Estimate parking ratio (assuming 1 space per 100 m² floor area)
    const parkingRatio = totalFloorArea > 0 ? totalFloorArea / 100 / buildings.length : 1.2;

    return {
      far,
      gsi,
      osr,
      averageHeight,
      maxHeight,
      buildingCount: buildings.length,
      totalFloorArea,
      totalSiteArea,
      greenSpaceArea: totalGreenSpace,
      populationDensity,
      parkingRatio
    };
  }

  /**
   * Calculate block-by-block metrics from building and lot data
   */
  private calculateBlockMetricsFromData(buildings: BuildingData[], lots: LotData[]): BlockMetrics[] {
    // Group buildings by block
    const blockBuildings = new Map<string, BuildingData[]>();
    const blockLots = new Map<string, LotData[]>();

    buildings.forEach(building => {
      const blockId = building.blockId || 'B1';
      if (!blockBuildings.has(blockId)) {
        blockBuildings.set(blockId, []);
      }
      blockBuildings.get(blockId)!.push(building);
    });

    lots.forEach(lot => {
      const blockId = lot.blockId || 'B1';
      if (!blockLots.has(blockId)) {
        blockLots.set(blockId, []);
      }
      blockLots.get(blockId)!.push(lot);
    });

    // Calculate metrics for each block
    const blockMetrics: BlockMetrics[] = [];
    
    for (const [blockId, blockBuildingsList] of blockBuildings) {
      const blockLotsList = blockLots.get(blockId) || [];
      const blockData = this.calculateMetricsFromData(blockBuildingsList, blockLotsList);
      
      blockMetrics.push({
        ...blockData,
        blockId,
        blockName: `Manzana ${blockId}`,
        lotCount: blockLotsList.length || Math.ceil(blockBuildingsList.length / 3)
      });
    }

    return blockMetrics.sort((a, b) => a.blockId.localeCompare(b.blockId));
  }

  /**
   * Get estimated building data when ECSQL queries are not available
   */
  private getEstimatedBuildingData(): BuildingData[] {
    const buildings: BuildingData[] = [];
    
    // Generate realistic building data for urban area
    for (let i = 1; i <= 45; i++) {
      const blockId = `B${Math.ceil(i / 6)}`;
      const lotId = `L${i}`;
      const height = 15 + Math.random() * 30; // 15-45m
      const footprint = 80 + Math.random() * 120; // 80-200 m²
      const floors = Math.max(2, Math.floor(height / 3.5));
      
      buildings.push({
        elementId: `building_${i}`,
        height,
        footprintArea: footprint,
        floorArea: footprint * floors,
        volume: footprint * height,
        blockId,
        lotId,
        category: 'Building'
      });
    }
    
    return buildings;
  }

  /**
   * Get estimated lot data when ECSQL queries are not available
   */
  private getEstimatedLotData(): LotData[] {
    const lots: LotData[] = [];
    
    // Generate realistic lot data
    for (let i = 1; i <= 45; i++) {
      const blockId = `B${Math.ceil(i / 6)}`;
      const siteArea = 400 + Math.random() * 200; // 400-600 m²
      
      lots.push({
        lotId: `L${i}`,
        blockId,
        siteArea,
        greenSpaceArea: siteArea * (0.15 + Math.random() * 0.25), // 15-40% green
        buildingFootprintArea: siteArea * (0.3 + Math.random() * 0.2), // 30-50% built
        category: 'Lot'
      });
    }
    
    return lots;
  }

  /**
   * Fallback simulated overall metrics
   */
  private getSimulatedOverallMetrics(): UrbanMetrics {
    return {
      far: 2.1,
      gsi: 0.42,
      osr: 0.28,
      averageHeight: 28.5,
      maxHeight: 45.0,
      buildingCount: 45,
      totalFloorArea: 67500, // m²
      totalSiteArea: 32000, // m²
      greenSpaceArea: 8960, // m²
      populationDensity: 135, // hab/ha
      parkingRatio: 1.35 // spaces per unit
    };
  }

  /**
   * Fallback simulated block metrics
   */
  private getSimulatedBlockMetrics(): BlockMetrics[] {
    const blocks: BlockMetrics[] = [];
    
    for (let i = 1; i <= 8; i++) {
      const variationFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      
      blocks.push({
        blockId: `B${i}`,
        blockName: `Manzana ${i}`,
        lotCount: 5 + Math.floor(Math.random() * 3), // 5-7 lots per block
        far: (1.5 + Math.random() * 1.5) * variationFactor,
        gsi: (0.35 + Math.random() * 0.25) * variationFactor,
        osr: 0.2 + Math.random() * 0.15,
        averageHeight: (20 + Math.random() * 20) * variationFactor,
        maxHeight: (35 + Math.random() * 15) * variationFactor,
        buildingCount: 5 + Math.floor(Math.random() * 3),
        totalFloorArea: (7000 + Math.random() * 4000) * variationFactor,
        totalSiteArea: 4000 * variationFactor,
        greenSpaceArea: (800 + Math.random() * 400) * variationFactor,
        populationDensity: (100 + Math.random() * 60) * variationFactor,
        parkingRatio: 1.0 + Math.random() * 0.8
      });
    }

    return blocks;
  }
}