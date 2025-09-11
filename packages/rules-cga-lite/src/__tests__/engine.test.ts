import { RulesEngine } from '../engine';
import { RuleProgram, GeometryContext } from '../types';
import { COMMON_CRS } from '../utils/crs';

describe('CGA-lite Rules Engine', () => {
  let engine: RulesEngine;
  let baseGeometry: GeometryContext;

  beforeEach(() => {
    engine = new RulesEngine();
    
    // Simple square footprint (10m x 10m)
    baseGeometry = {
      polygon: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0] // Closed polygon
      ],
      attributes: {},
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 10, y: 10, z: 0 }
      }
    };
  });

  describe('Extrude Operation', () => {
    test('should extrude polygon vertically', async () => {
      const rule: RuleProgram = {
        name: 'Simple Extrude',
        rules: [
          { op: 'extrude', h: 15 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.geometry).toBeDefined();
      expect(result.geometry?.type).toBe('solid');
      expect(result.attributes.height).toBe(15);
      expect(result.metadata?.operationCount).toBe(1);
    });

    test('should handle zero height extrusion', async () => {
      const rule: RuleProgram = {
        name: 'Zero Extrude',
        rules: [
          { op: 'extrude', h: 0 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.height).toBe(0);
    });

    test('should reject negative height', async () => {
      const rule: RuleProgram = {
        name: 'Negative Extrude',
        rules: [
          { op: 'extrude', h: -5 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-negative');
    });
  });

  describe('Offset Operation', () => {
    test('should offset inward by default', async () => {
      const rule: RuleProgram = {
        name: 'Inward Offset',
        rules: [
          { op: 'offset', d: 2 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.geometry).toBeDefined();
      
      // Inward offset should reduce polygon area
      const originalArea = 10 * 10; // 100 sq units
      const expectedArea = 6 * 6; // (10-2*2) * (10-2*2) = 36 sq units
      expect(result.attributes.area).toBeCloseTo(expectedArea, 1);
    });

    test('should offset outward when specified', async () => {
      const rule: RuleProgram = {
        name: 'Outward Offset',
        rules: [
          { op: 'offset', d: 3, mode: 'out' }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      
      // Outward offset should increase polygon area
      const expectedArea = 16 * 16; // (10+2*3) * (10+2*3) = 256 sq units
      expect(result.attributes.area).toBeCloseTo(expectedArea, 1);
    });

    test('should handle offset larger than geometry', async () => {
      const rule: RuleProgram = {
        name: 'Large Offset',
        rules: [
          { op: 'offset', d: 6 } // Larger than half the polygon width
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(false);
      expect(result.error).toContain('offset too large');
    });
  });

  describe('Split Operation', () => {
    test('should split along X axis with equal parts', async () => {
      const rule: RuleProgram = {
        name: 'X Split Equal',
        rules: [
          { op: 'split', axis: 'x', sizes: [5, 5] }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.splitParts).toBe(2);
      expect(result.attributes.splitAxis).toBe('x');
    });

    test('should split with flexible sizing', async () => {
      const rule: RuleProgram = {
        name: 'X Split Flexible',
        rules: [
          { op: 'split', axis: 'x', sizes: [3, '*', 2] }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.splitParts).toBe(3);
      // Middle part should be 10 - 3 - 2 = 5 units
      expect(result.attributes.flexibleSize).toBe(5);
    });

    test('should handle Y axis split', async () => {
      const rule: RuleProgram = {
        name: 'Y Split',
        rules: [
          { op: 'split', axis: 'y', sizes: [4, 6] }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.splitAxis).toBe('y');
    });

    test('should reject invalid split sizes', async () => {
      const rule: RuleProgram = {
        name: 'Invalid Split',
        rules: [
          { op: 'split', axis: 'x', sizes: [15] } // Larger than polygon
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  describe('Repeat Operation', () => {
    test('should repeat along Y axis', async () => {
      const extrudedGeometry = { 
        ...baseGeometry, 
        attributes: { height: 20 } 
      };

      const rule: RuleProgram = {
        name: 'Y Repeat',
        rules: [
          { op: 'repeat', axis: 'y', step: 3 }
        ]
      };

      const result = await engine.executeRules(rule, extrudedGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.repeatCount).toBeGreaterThan(1);
      expect(result.attributes.repeatAxis).toBe('y');
    });

    test('should respect repeat limit', async () => {
      const extrudedGeometry = { 
        ...baseGeometry, 
        attributes: { height: 100 } 
      };

      const rule: RuleProgram = {
        name: 'Limited Repeat',
        rules: [
          { op: 'repeat', axis: 'z', step: 5, limit: 10 }
        ]
      };

      const result = await engine.executeRules(rule, extrudedGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.repeatCount).toBeLessThanOrEqual(10);
    });
  });

  describe('Setback Operation', () => {
    test('should apply setback to all faces by default', async () => {
      const rule: RuleProgram = {
        name: 'Full Setback',
        rules: [
          { op: 'setback', d: 1.5 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.setbackDistance).toBe(1.5);
      expect(result.attributes.setbackFaces).toEqual(['front', 'back', 'left', 'right']);
    });

    test('should apply selective setback', async () => {
      const rule: RuleProgram = {
        name: 'Selective Setback',
        rules: [
          { op: 'setback', d: 2, faces: ['front', 'back'] }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.setbackFaces).toEqual(['front', 'back']);
    });
  });

  describe('Roof Operation', () => {
    test('should create flat roof', async () => {
      const rule: RuleProgram = {
        name: 'Flat Roof',
        rules: [
          { op: 'extrude', h: 10 },
          { op: 'roof', kind: 'flat' }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.roofType).toBe('flat');
    });

    test('should create gable roof with pitch', async () => {
      const rule: RuleProgram = {
        name: 'Gable Roof',
        rules: [
          { op: 'extrude', h: 10 },
          { op: 'roof', kind: 'gable', pitch: 30 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.roofType).toBe('gable');
      expect(result.attributes.roofPitch).toBe(30);
    });

    test('should create hip roof', async () => {
      const rule: RuleProgram = {
        name: 'Hip Roof',
        rules: [
          { op: 'extrude', h: 10 },
          { op: 'roof', kind: 'hip', pitch: 25 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.roofType).toBe('hip');
    });

    test('should reject invalid pitch angle', async () => {
      const rule: RuleProgram = {
        name: 'Invalid Pitch',
        rules: [
          { op: 'roof', kind: 'gable', pitch: 95 } // > 90 degrees
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(false);
      expect(result.error).toContain('pitch');
    });
  });

  describe('Complex Rule Programs', () => {
    test('should execute stepped building program', async () => {
      const rule: RuleProgram = {
        name: 'Stepped Building',
        rules: [
          { op: 'extrude', h: 20 },
          { op: 'setback', d: 3, faces: ['front', 'back'] },
          { op: 'extrude', h: 20 },
          { op: 'setback', d: 2, faces: ['left', 'right'] },
          { op: 'extrude', h: 20 },
          { op: 'roof', kind: 'flat' }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.metadata?.operationCount).toBe(6);
      expect(result.attributes.totalHeight).toBe(60);
      expect(result.attributes.roofType).toBe('flat');
    });

    test('should handle mixed operations with attributes', async () => {
      const rule: RuleProgram = {
        name: 'Mixed Operations',
        attrs: { buildingType: 'office', maxHeight: 50 },
        rules: [
          { op: 'attr', name: 'zoning', value: 'commercial' },
          { op: 'offset', d: 1, mode: 'in' },
          { op: 'extrude', h: 25 },
          { op: 'textureTag', tag: 'office_facade', faces: ['front'] },
          { op: 'roof', kind: 'gable', pitch: 20 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.buildingType).toBe('office');
      expect(result.attributes.zoning).toBe('commercial');
      expect(result.attributes.textureTags).toContain('office_facade');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty rule program', async () => {
      const rule: RuleProgram = {
        name: 'Empty Rules',
        rules: []
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.metadata?.operationCount).toBe(0);
    });

    test('should validate rule program schema', async () => {
      const invalidRule = {
        name: 'Invalid Rule',
        rules: [
          { op: 'invalid_operation', param: 'test' }
        ]
      } as any;

      const result = await engine.executeRules(invalidRule, baseGeometry);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('should handle invalid geometry', async () => {
      const invalidGeometry = {
        polygon: [[0, 0]], // Too few points
        attributes: {},
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 }
        }
      };

      const rule: RuleProgram = {
        name: 'Test Rule',
        rules: [{ op: 'extrude', h: 10 }]
      };

      const result = await engine.executeRules(rule, invalidGeometry);

      expect(result.success).toBe(false);
      expect(result.error).toContain('geometry');
    });
  });

  describe('Performance and Metrics', () => {
    test('should track execution time', async () => {
      const rule: RuleProgram = {
        name: 'Performance Test',
        rules: [
          { op: 'extrude', h: 10 },
          { op: 'offset', d: 1 },
          { op: 'roof', kind: 'gable', pitch: 30 }
        ]
      };

      const start = Date.now();
      const result = await engine.executeRules(rule, baseGeometry);
      const actualTime = Date.now() - start;

      expect(result.success).toBe(true);
      expect(result.metadata?.executionTimeMs).toBeDefined();
      expect(result.metadata?.executionTimeMs).toBeCloseTo(actualTime, -1); // Within ~10ms
    });

    test('should calculate geometry area correctly', async () => {
      const rule: RuleProgram = {
        name: 'Area Test',
        rules: [
          { op: 'extrude', h: 5 }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.baseArea).toBe(100); // 10x10 square
      expect(result.attributes.volume).toBe(500); // 100 * 5
    });
  });

  describe('Golden Tests - Known Results', () => {
    test('L-shaped polygon extrusion', async () => {
      const lShapeGeometry: GeometryContext = {
        polygon: [
          [0, 0],
          [10, 0],
          [10, 6],
          [4, 6],
          [4, 10],
          [0, 10],
          [0, 0]
        ],
        attributes: {},
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 10, y: 10, z: 0 }
        }
      };

      const rule: RuleProgram = {
        name: 'L-Shape Extrude',
        rules: [
          { op: 'extrude', h: 12 }
        ]
      };

      const result = await engine.executeRules(rule, lShapeGeometry);

      expect(result.success).toBe(true);
      // L-shape area: 10*6 + 4*4 = 60 + 16 = 76
      expect(result.attributes.baseArea).toBeCloseTo(76, 1);
      expect(result.attributes.volume).toBeCloseTo(912, 1); // 76 * 12
    });

    test('Complex office building with known metrics', async () => {
      const rule: RuleProgram = {
        name: 'Office Building Golden Test',
        rules: [
          { op: 'offset', d: 2, mode: 'in' },  // 6x6 = 36 sq units
          { op: 'extrude', h: 30 },             // Volume: 36 * 30 = 1080
          { op: 'setback', d: 1, faces: ['front', 'back'] }, // 6x4 = 24 sq units  
          { op: 'extrude', h: 20 },             // Additional volume: 24 * 20 = 480
          { op: 'roof', kind: 'flat' }
        ]
      };

      const result = await engine.executeRules(rule, baseGeometry);

      expect(result.success).toBe(true);
      expect(result.attributes.totalHeight).toBe(50);
      expect(result.attributes.totalVolume).toBeCloseTo(1560, 10); // 1080 + 480
    });
  });
});