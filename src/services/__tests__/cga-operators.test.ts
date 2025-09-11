import { CGAOperatorsService, CGAGeometry, CGAPolygon, CGARule } from '../CGAOperatorsService';

describe('CGA Operators Service', () => {
  let cgaService: CGAOperatorsService;

  beforeEach(() => {
    cgaService = CGAOperatorsService.getInstance();
  });

  describe('Basic Geometry Operations', () => {
    const testPolygon: CGAPolygon = {
      vertices: [
        [0, 0, 0],
        [10, 0, 0],
        [10, 10, 0],
        [0, 10, 0]
      ]
    };

    it('should extrude polygon to create 3D volume', async () => {
      const height = 25;
      const result = await cgaService.extrude(testPolygon, height);

      expect(result.success).toBe(true);
      expect(result.geometry.polygons.length).toBeGreaterThan(2); // Bottom + top + sides
      expect(result.geometry.attributes.height).toBe(height);
      expect(result.geometry.attributes.volume).toBe(100 * height); // 10x10 * height
      expect(result.geometry.attributes.operation).toBe('extrude');
      expect(result.message).toContain('25m height');
    });

    it('should offset polygon inward and outward', async () => {
      const insetResult = await cgaService.offset(testPolygon, -2);
      const outsetResult = await cgaService.offset(testPolygon, 2);

      expect(insetResult.success).toBe(true);
      expect(outsetResult.success).toBe(true);

      expect(insetResult.geometry.attributes.offsetDistance).toBe(-2);
      expect(outsetResult.geometry.attributes.offsetDistance).toBe(2);
      
      // Inset should have smaller area, outset should have larger area
      const originalArea = insetResult.geometry.attributes.originalArea;
      expect(insetResult.geometry.attributes.offsetArea).toBeLessThan(originalArea);
      expect(outsetResult.geometry.attributes.offsetArea).toBeGreaterThan(originalArea);
    });

    it('should apply setbacks from property boundaries', async () => {
      const setbacks = { front: 5, side: 3, back: 2 };
      const result = await cgaService.setback(testPolygon, setbacks);

      expect(result.success).toBe(true);
      expect(result.geometry.attributes.setbacks).toEqual(setbacks);
      expect(result.geometry.attributes.operation).toBe('setback');
      expect(result.message).toContain('setbacks');
    });

    it('should generate different roof types', async () => {
      const flatRoof = await cgaService.roof(testPolygon, 'flat', 3, 0.5);
      const gableRoof = await cgaService.roof(testPolygon, 'gable', 4, 1);
      const hipRoof = await cgaService.roof(testPolygon, 'hip', 3.5, 0.8);

      expect(flatRoof.success).toBe(true);
      expect(gableRoof.success).toBe(true);
      expect(hipRoof.success).toBe(true);

      expect(flatRoof.geometry.attributes.roofType).toBe('flat');
      expect(gableRoof.geometry.attributes.roofType).toBe('gable');
      expect(hipRoof.geometry.attributes.roofType).toBe('hip');

      expect(gableRoof.geometry.attributes.ridgeHeight).toBeGreaterThan(gableRoof.geometry.attributes.height);
    });
  });

  describe('Advanced Operations', () => {
    const buildingGeometry: CGAGeometry = {
      polygons: [{
        vertices: [
          [0, 0, 0],
          [15, 0, 0],
          [15, 15, 0],
          [0, 15, 0]
        ]
      }],
      attributes: {
        height: 30,
        category: 'Building'
      }
    };

    it('should split geometry along axes', async () => {
      const floors = [1, 1, 1, 1, 1]; // 5 floors
      const results = await cgaService.split(buildingGeometry, 'z', floors);

      expect(results.length).toBe(floors.length);
      expect(results.every(r => r.success)).toBe(true);

      // Check floor numbering
      results.forEach((result, index) => {
        expect(result.geometry.attributes.floorNumber).toBe(index + 1);
        expect(result.geometry.attributes.operation).toBe('split');
      });
    });

    it('should repeat geometry along axis', async () => {
      const count = 4;
      const spacing = 20;
      const results = await cgaService.repeat(buildingGeometry, 'x', count, spacing);

      expect(results.length).toBe(count);
      expect(results.every(r => r.success)).toBe(true);

      // Check positioning
      results.forEach((result, index) => {
        expect(result.geometry.attributes.repeatIndex).toBe(index);
        expect(result.geometry.attributes.repeatOffset).toBe(index * spacing);
      });
    });

    it('should handle invalid operations gracefully', async () => {
      const invalidPolygon: CGAPolygon = { vertices: [[0, 0]] }; // Only 1 vertex
      const result = await cgaService.extrude(invalidPolygon, 10);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid polygon');
    });
  });

  describe('Rule Sequences', () => {
    const lotGeometry: CGAGeometry = {
      polygons: [{
        vertices: [
          [0, 0, 0],
          [20, 0, 0],
          [20, 25, 0],
          [0, 25, 0]
        ]
      }],
      attributes: {
        lotId: 'L001',
        category: 'Lot'
      }
    };

    it('should apply complete building generation sequence', async () => {
      const buildingRules: CGARule[] = [
        {
          operator: 'setback',
          parameters: { setbacks: { all: 3 } }
        },
        {
          operator: 'extrude', 
          parameters: { height: 28 }
        },
        {
          operator: 'split',
          parameters: { axis: 'z', divisions: [1, 1, 1, 1] } // 4 floors
        },
        {
          operator: 'roof',
          parameters: { type: 'gable', height: 4, overhang: 1 }
        }
      ];

      const results = await cgaService.applyRuleSequence(lotGeometry, buildingRules);

      expect(results.length).toBeGreaterThan(0);
      
      // Verify rule application sequence
      const operations = results.map(r => r.geometry.attributes.operation).filter(Boolean);
      expect(operations).toContain('setback');
      expect(operations).toContain('extrude');
      expect(operations).toContain('split');
      expect(operations).toContain('roof');
    });

    it('should handle rule failures in sequence', async () => {
      const problematicRules: CGARule[] = [
        {
          operator: 'extrude',
          parameters: { height: 20 }
        },
        {
          operator: 'offset' as any, // This will fail in the sequence
          parameters: { distance: -50 } // Too large inset
        }
      ];

      const results = await cgaService.applyRuleSequence(lotGeometry, problematicRules);
      
      expect(results.length).toBeGreaterThan(0);
      // Should continue processing despite failures
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('should generate realistic urban planning metrics', async () => {
      const urbanRules: CGARule[] = [
        { operator: 'setback', parameters: { setbacks: { front: 5, side: 3, back: 4 } } },
        { operator: 'extrude', parameters: { height: 35 } }
      ];

      const results = await cgaService.applyRuleSequence(lotGeometry, urbanRules);
      const building = results.find(r => r.geometry.attributes.operation === 'extrude');

      expect(building).toBeDefined();
      expect(building!.geometry.attributes.height).toBe(35);
      expect(building!.geometry.attributes.volume).toBeGreaterThan(0);
      
      // Verify realistic urban metrics
      const footprintArea = 20 * 25; // Original lot size
      const setbackArea = building!.geometry.attributes.volume / 35; // Approximate footprint after setback
      expect(setbackArea).toBeLessThan(footprintArea); // Setback should reduce area
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large polygons efficiently', async () => {
      // Create complex polygon with many vertices
      const vertices: Array<[number, number, number?]> = [];
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * 2 * Math.PI;
        vertices.push([Math.cos(angle) * 50, Math.sin(angle) * 50, 0]);
      }

      const complexPolygon: CGAPolygon = { vertices };
      const startTime = Date.now();
      const result = await cgaService.extrude(complexPolygon, 15);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.geometry.polygons.length).toBeGreaterThan(100); // Many faces generated
    });

    it('should maintain geometric consistency', async () => {
      const square: CGAPolygon = {
        vertices: [[0, 0], [10, 0], [10, 10], [0, 10]]
      };

      const extruded = await cgaService.extrude(square, 20);
      expect(extruded.geometry.attributes.volume).toBe(100 * 20); // 10x10x20

      const offset = await cgaService.offset(square, 2);
      expect(offset.geometry.attributes.offsetArea).toBeGreaterThan(100); // Should be larger

      const inset = await cgaService.offset(square, -1);
      expect(inset.geometry.attributes.offsetArea).toBeLessThan(100); // Should be smaller
    });
  });
});