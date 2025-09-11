import {
  validateCRS,
  validateCoordinateUnits,
  validateWindingOrder,
  ensureCounterClockwise,
  calculatePolygonArea,
  validateGeometryForRules,
  COMMON_CRS,
  CRSPolygon
} from '../utils/crs';

describe('CRS Validation and Utilities', () => {
  describe('CRS Schema Validation', () => {
    test('should validate Buenos Aires UTM CRS', () => {
      const crs = COMMON_CRS.BUENOS_AIRES_UTM;
      
      expect(() => validateCRS(crs)).not.toThrow();
      expect(crs.epsg).toBe(32721);
      expect(crs.units).toBe('meters');
      expect(crs.type).toBe('projected');
    });

    test('should validate geographic CRS', () => {
      const crs = COMMON_CRS.ARGENTINA_GEO;
      
      expect(() => validateCRS(crs)).not.toThrow();
      expect(crs.epsg).toBe(4326);
      expect(crs.units).toBe('degrees');
      expect(crs.type).toBe('geographic');
    });

    test('should reject invalid CRS', () => {
      const invalidCRS = {
        epsg: 'invalid',
        name: 'Test',
        units: 'invalid_unit',
        type: 'invalid_type'
      };

      expect(() => validateCRS(invalidCRS)).toThrow();
    });
  });

  describe('Coordinate Units Validation', () => {
    test('should validate Buenos Aires UTM coordinates', () => {
      // Typical Buenos Aires UTM coordinates
      const coordinates = [
        [394000, 6135000], // Puerto Madero area
        [395000, 6135000],
        [395000, 6136000],
        [394000, 6136000],
        [394000, 6135000]
      ];

      const result = validateCoordinateUnits(coordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject coordinates out of range for meters', () => {
      const invalidCoordinates = [
        [50, 60], // Too small for UTM
        [100, 80],
        [100, 100],
        [50, 100],
        [50, 60]
      ];

      const result = validateCoordinateUnits(invalidCoordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('X coordinates out of expected range');
    });

    test('should validate geographic coordinates', () => {
      // Buenos Aires lat/lng coordinates
      const coordinates = [
        [-58.3816, -34.6037], // lng, lat (GeoJSON order)
        [-58.3800, -34.6037],
        [-58.3800, -34.6020],
        [-58.3816, -34.6020],
        [-58.3816, -34.6037]
      ];

      const result = validateCoordinateUnits(coordinates, COMMON_CRS.ARGENTINA_GEO);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject coordinates out of lat/lng bounds', () => {
      const invalidCoordinates = [
        [-200, -34.6037], // Invalid longitude
        [-58.3800, -95],  // Invalid latitude
        [-58.3800, -34.6020],
        [-200, -34.6020],
        [-200, -34.6037]
      ];

      const result = validateCoordinateUnits(invalidCoordinates, COMMON_CRS.ARGENTINA_GEO);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Winding Order Validation', () => {
    test('should detect counter-clockwise winding', () => {
      const ccwPolygon = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0]
      ];

      const winding = validateWindingOrder(ccwPolygon);
      expect(winding).toBe('ccw');
    });

    test('should detect clockwise winding', () => {
      const cwPolygon = [
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 0],
        [0, 0]
      ];

      const winding = validateWindingOrder(cwPolygon);
      expect(winding).toBe('cw');
    });

    test('should ensure counter-clockwise winding', () => {
      const cwPolygon = [
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 0],
        [0, 0]
      ];

      const corrected = ensureCounterClockwise(cwPolygon);
      const winding = validateWindingOrder(corrected);
      
      expect(winding).toBe('ccw');
      expect(corrected).not.toEqual(cwPolygon); // Should be reversed
    });

    test('should leave counter-clockwise polygons unchanged', () => {
      const ccwPolygon = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0]
      ];

      const result = ensureCounterClockwise(ccwPolygon);
      
      expect(result).toEqual(ccwPolygon);
    });

    test('should reject polygon with too few vertices', () => {
      const invalidPolygon = [
        [0, 0],
        [10, 0]
      ];

      expect(() => validateWindingOrder(invalidPolygon)).toThrow('at least 3 vertices');
    });
  });

  describe('Polygon Area Calculation', () => {
    test('should calculate simple rectangle area', () => {
      const rectangle: CRSPolygon = {
        coordinates: [
          [0, 0],
          [10, 0],
          [10, 5],
          [0, 5],
          [0, 0]
        ],
        crs: COMMON_CRS.BUENOS_AIRES_UTM
      };

      const area = calculatePolygonArea(rectangle);
      expect(area).toBe(50); // 10 * 5 = 50 square meters
    });

    test('should calculate L-shaped polygon area', () => {
      const lShape: CRSPolygon = {
        coordinates: [
          [0, 0],
          [10, 0],
          [10, 6],
          [4, 6],
          [4, 10],
          [0, 10],
          [0, 0]
        ],
        crs: COMMON_CRS.BUENOS_AIRES_UTM
      };

      const area = calculatePolygonArea(lShape);
      // L-shape area: 10*6 + 4*4 = 60 + 16 = 76
      expect(area).toBeCloseTo(76, 1);
    });

    test('should handle degenerate polygon (line)', () => {
      const line: CRSPolygon = {
        coordinates: [
          [0, 0],
          [10, 0],
          [0, 0]
        ],
        crs: COMMON_CRS.BUENOS_AIRES_UTM
      };

      const area = calculatePolygonArea(line);
      expect(area).toBe(0);
    });
  });

  describe('Geometry Validation for Rules', () => {
    test('should validate correct geometry', () => {
      const coordinates = [
        [394000, 6135000],
        [394100, 6135000],
        [394100, 6135100],
        [394000, 6135100],
        [394000, 6135000]
      ];

      const result = validateGeometryForRules(coordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should detect clockwise winding and warn', () => {
      const coordinates = [
        [394000, 6135000],
        [394000, 6135100], // Clockwise order
        [394100, 6135100],
        [394100, 6135000],
        [394000, 6135000]
      ];

      const result = validateGeometryForRules(coordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Polygon has clockwise winding - will be reversed for processing');
    });

    test('should detect duplicate consecutive vertices', () => {
      const coordinates = [
        [394000, 6135000],
        [394100, 6135000],
        [394100, 6135000], // Exact duplicate
        [394100, 6135100],
        [394000, 6135100],
        [394000, 6135000]
      ];

      const result = validateGeometryForRules(coordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('Duplicate consecutive vertices'))).toBe(true);
    });

    test('should reject polygon with too few vertices', () => {
      const coordinates = [
        [394000, 6135000],
        [394100, 6135000]
      ];

      const result = validateGeometryForRules(coordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Polygon must have at least 3 vertices');
    });

    test('should detect basic self-intersections', () => {
      // Figure-8 shaped polygon (self-intersecting)
      const coordinates = [
        [0, 0],
        [10, 10],
        [10, 0],
        [0, 10],
        [0, 0]
      ];

      const result = validateGeometryForRules(coordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('self-intersections'))).toBe(true);
    });

    test('should validate complex real-world polygon', () => {
      // Simplified building footprint from Buenos Aires
      const coordinates = [
        [394123.45, 6135234.67],
        [394156.78, 6135234.67],
        [394156.78, 6135267.89],
        [394140.12, 6135267.89],
        [394140.12, 6135256.34],
        [394123.45, 6135256.34],
        [394123.45, 6135234.67]
      ];

      const result = validateGeometryForRules(coordinates, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Buenos Aires Specific Tests', () => {
    test('should validate typical Buenos Aires parcel', () => {
      // 8.66m x 50m typical Buenos Aires lot (PH standard)
      const buenosAiresLot = [
        [394000.00, 6135000.00],
        [394008.66, 6135000.00],
        [394008.66, 6135050.00],
        [394000.00, 6135050.00],
        [394000.00, 6135000.00]
      ];

      const result = validateGeometryForRules(buenosAiresLot, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      
      const polygon: CRSPolygon = {
        coordinates: buenosAiresLot,
        crs: COMMON_CRS.BUENOS_AIRES_UTM
      };
      
      const area = calculatePolygonArea(polygon);
      expect(area).toBeCloseTo(433, 1); // 8.66 * 50 = 433 sq meters
    });

    test('should handle Puerto Madero coordinates', () => {
      // Puerto Madero area coordinates
      const puertoMaderoCoords = [
        [395500, 6135800],
        [395600, 6135800],
        [395600, 6135900],
        [395500, 6135900],
        [395500, 6135800]
      ];

      const result = validateGeometryForRules(puertoMaderoCoords, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle coordinates near Rio de la Plata', () => {
      // Coordinates close to the river (might have elevation issues)
      const riverCoords = [
        [394000, 6134000], // Close to river
        [394100, 6134000],
        [394100, 6134100],
        [394000, 6134100],
        [394000, 6134000]
      ];

      const result = validateGeometryForRules(riverCoords, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      // Should still validate as it's within the UTM zone bounds
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle very small polygons', () => {
      const microPolygon = [
        [394000.000, 6135000.000],
        [394000.001, 6135000.000], // 1mm edge
        [394000.001, 6135000.001],
        [394000.000, 6135000.001],
        [394000.000, 6135000.000]
      ];

      const result = validateGeometryForRules(microPolygon, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      // Should handle micro-geometries without error
    });

    test('should handle very large polygons', () => {
      const largePolygon = [
        [300000, 6100000], // Covers significant portion of Buenos Aires
        [500000, 6100000],
        [500000, 6200000],
        [300000, 6200000],
        [300000, 6100000]
      ];

      const result = validateGeometryForRules(largePolygon, COMMON_CRS.BUENOS_AIRES_UTM);

      expect(result.valid).toBe(true);
      // Should handle large geometries
    });

    test('should handle nearly degenerate cases', () => {
      const nearlyDegenerate = [
        [394000, 6135000],
        [394000.000001, 6135000], // Very small but not quite duplicate
        [394000, 6135000.000001],
        [394000, 6135000]
      ];

      const result = validateGeometryForRules(nearlyDegenerate, COMMON_CRS.BUENOS_AIRES_UTM);

      // Should still be valid but might have warnings
      expect(result.valid).toBe(true);
    });
  });
});