/**
 * CRS Middleware - EPSG:32718 (UTM 18S) enforcement for Chancay, Peru
 * 
 * Ensures all geometric input is in the correct coordinate reference system
 * and applies Area of Interest (AOI) bounds to prevent insertions outside Chancay region.
 * 
 * Target CRS: EPSG:32718 (UTM Zone 18S) 
 * AOI Bounds: Chancay region approximately (-11.7, -77.4) to (-11.4, -77.1) in WGS84
 * Converted to UTM18S: approximately (270000, 8703000) to (295000, 8736000)
 */

import { Request, Response, NextFunction } from 'express';
import proj4 from 'proj4';

// Define CRS projections
proj4.defs("EPSG:32718", "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:5387", "+proj=utm +zone=18 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

interface GeometryInput {
  vertices: number[][];
  crs?: string;
  attributes?: any;
}

interface CRSValidationOptions {
  enforceChancayAOI: boolean;
  allowReprojection: boolean;
  logTransformations: boolean;
}

/**
 * Chancay AOI bounds in UTM18S (EPSG:32718) meters
 * Covers the main urban development area of Chancay
 */
const CHANCAY_AOI_UTM18S = {
  minX: 270000,  // Western bound
  maxX: 295000,  // Eastern bound  
  minY: 8703000, // Southern bound (~-11.7°)
  maxY: 8736000, // Northern bound (~-11.4°)
};

/**
 * CRS Middleware class for geometric coordinate validation and transformation
 */
export class CRSMiddleware {
  private static readonly TARGET_CRS = "EPSG:32718";
  private static readonly SUPPORTED_INPUT_CRS = ["EPSG:32718", "EPSG:5387", "EPSG:4326"];

  /**
   * Express middleware function for CRS validation and transformation
   */
  static validate(options: CRSValidationOptions = {
    enforceChancayAOI: true,
    allowReprojection: true,
    logTransformations: true
  }) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check if request contains geometry data
        if (!req.body || !req.body.geometry) {
          return next(); // No geometry to validate
        }

        const geometry: GeometryInput = req.body.geometry;

        console.log('🗺️  CRS Middleware: Validating geometry input...');

        // 1. Detect or use provided CRS
        const inputCRS = geometry.crs || CRSMiddleware.detectCRS(geometry.vertices);
        console.log(`📍 Input CRS: ${inputCRS}`);

        // 2. Validate supported CRS
        if (!CRSMiddleware.SUPPORTED_INPUT_CRS.includes(inputCRS)) {
          return res.status(400).json({
            success: false,
            error: 'UNSUPPORTED_CRS',
            message: `CRS '${inputCRS}' is not supported. Supported CRS: ${CRSMiddleware.SUPPORTED_INPUT_CRS.join(', ')}`,
            supportedCRS: CRSMiddleware.SUPPORTED_INPUT_CRS,
            suggestion: 'Please provide coordinates in EPSG:32718 (UTM 18S) for Chancay region'
          });
        }

        // 3. Transform to target CRS if needed
        let transformedVertices = geometry.vertices;
        let wasTransformed = false;

        if (inputCRS !== CRSMiddleware.TARGET_CRS) {
          if (!options.allowReprojection) {
            return res.status(400).json({
              success: false,
              error: 'CRS_MISMATCH',
              message: `Input CRS '${inputCRS}' does not match required CRS '${CRSMiddleware.TARGET_CRS}'. Reprojection is not allowed.`,
              required: CRSMiddleware.TARGET_CRS,
              received: inputCRS
            });
          }

          try {
            transformedVertices = CRSMiddleware.reprojectVertices(geometry.vertices, inputCRS, CRSMiddleware.TARGET_CRS);
            wasTransformed = true;

            if (options.logTransformations) {
              console.log(`🔄 Reprojected geometry: ${inputCRS} → ${CRSMiddleware.TARGET_CRS}`);
              console.log(`   First vertex: ${geometry.vertices[0]} → ${transformedVertices[0]}`);
            }
          } catch (reprojectionError) {
            return res.status(400).json({
              success: false,
              error: 'REPROJECTION_FAILED',
              message: `Failed to reproject from ${inputCRS} to ${CRSMiddleware.TARGET_CRS}`,
              details: reprojectionError instanceof Error ? reprojectionError.message : 'Unknown reprojection error'
            });
          }
        }

        // 4. Validate AOI bounds for Chancay region
        if (options.enforceChancayAOI) {
          const aoi = CRSMiddleware.validateChancayAOI(transformedVertices);
          if (!aoi.isValid) {
            return res.status(400).json({
              success: false,
              error: 'OUTSIDE_AOI',
              message: 'Geometry is outside the Chancay Area of Interest',
              details: {
                chancayBounds: CHANCAY_AOI_UTM18S,
                geometryBounds: aoi.geometryBounds,
                verticesOutside: aoi.verticesOutside,
                crs: CRSMiddleware.TARGET_CRS
              },
              suggestion: 'Ensure coordinates are within Chancay region bounds'
            });
          }
        }

        // 5. Update request with validated/transformed geometry
        req.body.geometry = {
          ...geometry,
          vertices: transformedVertices,
          crs: CRSMiddleware.TARGET_CRS,
          transformation: wasTransformed ? {
            from: inputCRS,
            to: CRSMiddleware.TARGET_CRS,
            transformedAt: new Date().toISOString()
          } : undefined
        };

        console.log('✅ CRS validation completed successfully');
        next();

      } catch (error) {
        console.error('❌ CRS Middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'CRS_VALIDATION_ERROR',
          message: 'Internal error during CRS validation',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  }

  /**
   * Detect CRS from vertex coordinate ranges
   */
  private static detectCRS(vertices: number[][]): string {
    if (vertices.length === 0) {
      return CRSMiddleware.TARGET_CRS; // Default assumption
    }

    const firstVertex = vertices[0];
    if (firstVertex.length < 2) {
      return CRSMiddleware.TARGET_CRS; // Default assumption
    }

    const x = firstVertex[0];
    const y = firstVertex[1];

    // UTM18S (EPSG:32718) ranges for Peru: X: 200,000-800,000, Y: 8,000,000-10,000,000
    if (x >= 200000 && x <= 800000 && y >= 8000000 && y <= 10000000) {
      return "EPSG:32718";
    }

    // EPSG:5387 (PSAD56 UTM18S) - similar ranges but different datum
    if (x >= 200000 && x <= 800000 && y >= 8000000 && y <= 10000000) {
      return "EPSG:5387"; // Will be reprojected to EPSG:32718
    }

    // WGS84 Geographic (EPSG:4326): longitude -180 to 180, latitude -90 to 90
    if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
      return "EPSG:4326";
    }

    // Default to target CRS with warning
    console.warn(`⚠️ Could not detect CRS for coordinates [${x}, ${y}], assuming ${CRSMiddleware.TARGET_CRS}`);
    return CRSMiddleware.TARGET_CRS;
  }

  /**
   * Reproject vertices from source CRS to target CRS
   */
  private static reprojectVertices(vertices: number[][], fromCRS: string, toCRS: string): number[][] {
    const transformer = proj4(fromCRS, toCRS);
    
    return vertices.map(vertex => {
      if (vertex.length < 2) {
        throw new Error(`Invalid vertex: requires at least X,Y coordinates, got ${vertex.length} coordinates`);
      }

      // Transform X,Y coordinates
      const [x, y] = transformer.forward([vertex[0], vertex[1]]);
      
      // Preserve Z coordinate if present
      const result = [x, y];
      if (vertex.length > 2) {
        result.push(vertex[2]); // Keep Z coordinate unchanged
      }

      return result;
    });
  }

  /**
   * Validate that geometry is within Chancay AOI bounds
   */
  private static validateChancayAOI(vertices: number[][]): {
    isValid: boolean;
    geometryBounds: { minX: number; maxX: number; minY: number; maxY: number; };
    verticesOutside: number;
  } {
    if (vertices.length === 0) {
      return { isValid: false, geometryBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 }, verticesOutside: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let verticesOutside = 0;

    for (const vertex of vertices) {
      const x = vertex[0];
      const y = vertex[1];

      // Update bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Check if vertex is outside Chancay AOI
      if (x < CHANCAY_AOI_UTM18S.minX || x > CHANCAY_AOI_UTM18S.maxX ||
          y < CHANCAY_AOI_UTM18S.minY || y > CHANCAY_AOI_UTM18S.maxY) {
        verticesOutside++;
      }
    }

    const geometryBounds = { minX, maxX, minY, maxY };

    // Consider valid if majority of vertices (>50%) are within AOI
    const isValid = verticesOutside <= (vertices.length / 2);

    return { isValid, geometryBounds, verticesOutside };
  }

  /**
   * Get Chancay AOI information
   */
  static getChancayAOI() {
    return {
      bounds: CHANCAY_AOI_UTM18S,
      crs: CRSMiddleware.TARGET_CRS,
      description: "Chancay urban development area, Peru"
    };
  }
}