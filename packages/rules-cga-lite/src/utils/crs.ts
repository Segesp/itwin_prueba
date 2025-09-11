import { z } from 'zod';

// Coordinate Reference System validation and utilities
export const CRSSchema = z.object({
  epsg: z.number().int().positive(),
  name: z.string(),
  units: z.enum(['meters', 'feet', 'degrees']),
  type: z.enum(['projected', 'geographic', 'compound'])
});

export type CRS = z.infer<typeof CRSSchema>;

// Common CRS definitions for urban modeling
export const COMMON_CRS: Record<string, CRS> = {
  // Buenos Aires - UTM Zone 21S
  BUENOS_AIRES_UTM: {
    epsg: 32721,
    name: 'WGS 84 / UTM zone 21S',
    units: 'meters',
    type: 'projected'
  },
  // Argentina - Geographic
  ARGENTINA_GEO: {
    epsg: 4326,
    name: 'WGS 84',
    units: 'degrees',
    type: 'geographic'
  },
  // Argentina - POSGAR 2007
  POSGAR_2007: {
    epsg: 5348,
    name: 'POSGAR 2007 / Argentina 4',
    units: 'meters',
    type: 'projected'
  }
};

// Point with CRS information
export interface CRSPoint {
  x: number;
  y: number;
  z?: number;
  crs: CRS;
}

// Polygon with CRS validation
export interface CRSPolygon {
  coordinates: number[][];
  crs: CRS;
  windingOrder?: 'ccw' | 'cw';
}

/**
 * Validate coordinate reference system
 */
export function validateCRS(crs: unknown): CRS {
  return CRSSchema.parse(crs);
}

/**
 * Validate that coordinates are in expected units
 */
export function validateCoordinateUnits(
  coordinates: number[][],
  expectedCRS: CRS
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (expectedCRS.units === 'meters') {
    // For projected coordinates in meters, check if coordinates are reasonable
    // Allow both UTM-style large coordinates and local coordinate systems
    const minX = Math.min(...coordinates.map(c => c[0]));
    const maxX = Math.max(...coordinates.map(c => c[0]));
    const minY = Math.min(...coordinates.map(c => c[1]));
    const maxY = Math.max(...coordinates.map(c => c[1]));
    
    // Only flag if coordinates are negative or extremely large (likely incorrect)
    if (minX < -1000000 || maxX > 10000000) {
      errors.push(`X coordinates out of reasonable range: ${minX} - ${maxX}`);
    }
    
    if (minY < -1000000 || maxY > 20000000) {
      errors.push(`Y coordinates out of reasonable range: ${minY} - ${maxY}`);
    }
  }
  
  if (expectedCRS.units === 'degrees') {
    // For geographic coordinates, expect lat/lon bounds
    const lons = coordinates.map(c => c[0]);
    const lats = coordinates.map(c => c[1]);
    
    if (Math.min(...lons) < -180 || Math.max(...lons) > 180) {
      errors.push(`Longitude out of bounds: ${Math.min(...lons)} - ${Math.max(...lons)}`);
    }
    
    if (Math.min(...lats) < -90 || Math.max(...lats) > 90) {
      errors.push(`Latitude out of bounds: ${Math.min(...lats)} - ${Math.max(...lats)}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate polygon winding order
 */
export function validateWindingOrder(coordinates: number[][]): 'ccw' | 'cw' {
  if (coordinates.length < 3) {
    throw new Error('Polygon must have at least 3 vertices');
  }
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += (coordinates[j][0] - coordinates[i][0]) * (coordinates[j][1] + coordinates[i][1]);
  }
  
  return area < 0 ? 'ccw' : 'cw';
}

/**
 * Ensure polygon has counter-clockwise winding (exterior ring standard)
 */
export function ensureCounterClockwise(coordinates: number[][]): number[][] {
  const winding = validateWindingOrder(coordinates);
  
  if (winding === 'cw') {
    return [...coordinates].reverse();
  }
  
  return coordinates;
}

/**
 * Calculate polygon area in appropriate units
 */
export function calculatePolygonArea(polygon: CRSPolygon): number {
  const coords = polygon.coordinates;
  
  if (coords.length < 3) {
    return 0;
  }
  
  let area = 0;
  const n = coords.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Return area with unit information
  return area; // square units of the CRS
}

/**
 * Validate geometry for CGA rule application
 */
export function validateGeometryForRules(
  coordinates: number[][],
  crs: CRS
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (coordinates.length < 3) {
    errors.push('Polygon must have at least 3 vertices');
  }
  
  // Check for duplicate consecutive points
  for (let i = 0; i < coordinates.length - 1; i++) {
    const curr = coordinates[i];
    const next = coordinates[i + 1];
    
    const distance = Math.sqrt(
      Math.pow(curr[0] - next[0], 2) + Math.pow(curr[1] - next[1], 2)
    );
    
    if (distance < 1e-6) {
      warnings.push(`Duplicate consecutive vertices at index ${i}`);
    }
  }
  
  // Validate CRS and units
  const unitsValidation = validateCoordinateUnits(coordinates, crs);
  errors.push(...unitsValidation.errors);
  
  // Check winding order
  try {
    const winding = validateWindingOrder(coordinates);
    if (winding === 'cw') {
      warnings.push('Polygon has clockwise winding - will be reversed for processing');
    }
  } catch (error) {
    errors.push(`Winding order validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Check for self-intersections (basic check)
  if (hasBasicSelfIntersections(coordinates)) {
    errors.push('Polygon appears to have self-intersections');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Basic self-intersection detection
 */
function hasBasicSelfIntersections(coordinates: number[][]): boolean {
  // Simple O(n²) check for obvious self-intersections
  for (let i = 0; i < coordinates.length - 1; i++) {
    for (let j = i + 2; j < coordinates.length - 1; j++) {
      if (j === coordinates.length - 2 && i === 0) continue; // Skip closing edge
      
      const line1 = [coordinates[i], coordinates[i + 1]];
      const line2 = [coordinates[j], coordinates[j + 1]];
      
      if (linesIntersect(line1[0], line1[1], line2[0], line2[1])) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if two line segments intersect
 */
function linesIntersect(
  p1: number[], p2: number[],
  p3: number[], p4: number[]
): boolean {
  const denominator = (p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1]);
  
  if (Math.abs(denominator) < 1e-10) {
    return false; // Lines are parallel
  }
  
  const ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / denominator;
  const ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / denominator;
  
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Convert coordinates to standard format for iTwin.js
 */
export function toITwinCoordinates(
  coordinates: number[][],
  sourceCRS: CRS,
  heightReference: 'ellipsoidal' | 'orthometric' = 'ellipsoidal'
): number[][] {
  // In a real implementation, this would:
  // 1. Transform coordinates to iTwin's expected CRS
  // 2. Handle height reference conversions
  // 3. Apply any necessary scaling factors
  
  // For now, ensure counter-clockwise winding and return
  return ensureCounterClockwise(coordinates);
}