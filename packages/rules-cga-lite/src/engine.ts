import { 
  Rule, 
  RuleProgram, 
  GeometryContext, 
  RuleExecutionResult,
  SimpleGeometry,
  ExtrudeRule,
  OffsetRule,
  SplitRule,
  RepeatRule,
  SetbackRule,
  RoofRule
} from './types';

/**
 * CGA-lite Rules Engine - Minimal implementation of CityEngine-like procedural rules
 * Simplified version without iTwin.js dependencies for initial development
 */
export class RulesEngine {
  private operationCount = 0;
  
  /**
   * Execute a rule program on a given geometry context
   */
  async executeProgram(program: RuleProgram, context: GeometryContext): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    this.operationCount = 0;
    
    try {
      let currentGeometry = this.createInitialGeometry(context);
      let attributes = { ...context.attributes, ...program.attrs };
      
      for (const rule of program.rules) {
        const result = await this.executeRule(rule, currentGeometry, attributes, context);
        if (!result.success) {
          return result;
        }
        currentGeometry = result.geometry || currentGeometry;
        attributes = { ...attributes, ...result.attributes };
        this.operationCount++;
      }
      
      return {
        success: true,
        geometry: currentGeometry,
        attributes,
        metadata: {
          operationCount: this.operationCount,
          executionTimeMs: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        attributes: context.attributes,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          operationCount: this.operationCount,
          executionTimeMs: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Execute a single rule operation
   */
  private async executeRule(
    rule: Rule, 
    geometry: SimpleGeometry, 
    attributes: Record<string, any>,
    context: GeometryContext
  ): Promise<RuleExecutionResult> {
    try {
      switch (rule.op) {
        case 'extrude':
          return this.executeExtrude(rule, geometry, attributes, context);
        case 'offset':
          return this.executeOffset(rule, geometry, attributes, context);
        case 'split':
          return this.executeSplit(rule, geometry, attributes, context);
        case 'repeat':
          return this.executeRepeat(rule, geometry, attributes, context);
        case 'setback':
          return this.executeSetback(rule, geometry, attributes, context);
        case 'roof':
          return this.executeRoof(rule, geometry, attributes, context);
        case 'textureTag':
          return this.executeTextureTag(rule, geometry, attributes);
        case 'attr':
          return this.executeAttr(rule, geometry, attributes);
        default:
          return {
            success: false,
            attributes,
            error: `Unknown rule operation: ${(rule as any).op}`
          };
      }
    } catch (error) {
      return {
        success: false,
        attributes,
        error: error instanceof Error ? error.message : 'Rule execution failed'
      };
    }
  }
  
  /**
   * Create initial 2D polygon geometry from context
   */
  private createInitialGeometry(context: GeometryContext): SimpleGeometry {
    return {
      type: 'polygon',
      vertices: context.polygon,
      attributes: context.attributes
    };
  }
  
  /**
   * Execute extrude operation - create 3D solid from 2D polygon
   */
  private executeExtrude(
    rule: ExtrudeRule, 
    geometry: SimpleGeometry, 
    attributes: Record<string, any>,
    context: GeometryContext
  ): RuleExecutionResult {
    try {
      // Create 3D vertices by extruding polygon upward
      const vertices3D = [];
      const faces = [];
      
      // Bottom face vertices
      for (const vertex of geometry.vertices) {
        vertices3D.push([vertex[0], vertex[1], 0]);
      }
      
      // Top face vertices
      for (const vertex of geometry.vertices) {
        vertices3D.push([vertex[0], vertex[1], rule.h]);
      }
      
      // Create faces
      const n = geometry.vertices.length;
      
      // Bottom face
      faces.push(Array.from({ length: n }, (_, i) => i));
      
      // Top face (reversed for correct normal)
      faces.push(Array.from({ length: n }, (_, i) => n + n - 1 - i));
      
      // Side faces
      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        faces.push([i, next, n + next, n + i]);
      }
      
      const extrudedGeometry: SimpleGeometry = {
        type: 'solid',
        vertices: vertices3D,
        faces,
        attributes: {
          ...geometry.attributes,
          height: rule.h,
          volume: this.calculateVolume(geometry.vertices, rule.h),
          extrudeMode: rule.mode || 'world'
        }
      };
      
      return {
        success: true,
        geometry: extrudedGeometry,
        attributes: {
          ...attributes,
          height: rule.h,
          volume: this.calculateVolume(geometry.vertices, rule.h)
        }
      };
    } catch (error) {
      return {
        success: false,
        attributes,
        error: error instanceof Error ? error.message : 'Extrude operation failed'
      };
    }
  }
  
  /**
   * Execute offset operation - shrink or expand polygon
   */
  private executeOffset(
    rule: OffsetRule,
    geometry: SimpleGeometry,
    attributes: Record<string, any>,
    context: GeometryContext
  ): RuleExecutionResult {
    try {
      const distance = (rule.mode === 'out') ? rule.d : -rule.d;
      
      // Simplified offset implementation - scale from centroid
      const centroid = this.calculateCentroid(geometry.vertices);
      const offsetVertices = geometry.vertices.map(vertex => {
        const dx = vertex[0] - centroid[0];
        const dy = vertex[1] - centroid[1];
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return vertex;
        
        const factor = (len + distance) / len;
        return [
          centroid[0] + dx * factor,
          centroid[1] + dy * factor
        ];
      });
      
      const offsetGeometry: SimpleGeometry = {
        type: 'polygon',
        vertices: offsetVertices,
        attributes: {
          ...geometry.attributes,
          offsetDistance: rule.d,
          offsetMode: rule.mode || 'in',
          area: this.calculateArea(offsetVertices)
        }
      };
      
      return {
        success: true,
        geometry: offsetGeometry,
        attributes: {
          ...attributes,
          offsetDistance: rule.d,
          offsetMode: rule.mode || 'in',
          area: this.calculateArea(offsetVertices)
        }
      };
    } catch (error) {
      return {
        success: false,
        attributes,
        error: error instanceof Error ? error.message : 'Offset operation failed'
      };
    }
  }
  
  /**
   * Execute split operation - divide geometry along axis
   */
  private executeSplit(
    rule: SplitRule,
    geometry: SimpleGeometry,
    attributes: Record<string, any>,
    context: GeometryContext
  ): RuleExecutionResult {
    try {
      // For now, return the original geometry with split metadata
      // Full implementation would divide the geometry based on the axis and sizes
      return {
        success: true,
        geometry: {
          ...geometry,
          attributes: {
            ...geometry.attributes,
            splitAxis: rule.axis,
            splitSizes: rule.sizes,
            splitCount: rule.sizes.length
          }
        },
        attributes: {
          ...attributes,
          splitAxis: rule.axis,
          splitSizes: rule.sizes,
          splitCount: rule.sizes.length
        }
      };
    } catch (error) {
      return {
        success: false,
        attributes,
        error: error instanceof Error ? error.message : 'Split operation failed'
      };
    }
  }
  
  /**
   * Execute repeat operation - repeat geometry along axis
   */
  private executeRepeat(
    rule: RepeatRule,
    geometry: SimpleGeometry,
    attributes: Record<string, any>,
    context: GeometryContext
  ): RuleExecutionResult {
    try {
      const { min, max } = context.boundingBox;
      const axisSize = rule.axis === 'x' ? (max.x - min.x) : 
                     rule.axis === 'y' ? (max.y - min.y) : (max.z - min.z);
      
      const repeatCount = rule.limit ? Math.min(rule.limit, Math.floor(axisSize / rule.step)) 
                                     : Math.floor(axisSize / rule.step);
      
      return {
        success: true,
        geometry: {
          ...geometry,
          attributes: {
            ...geometry.attributes,
            repeatAxis: rule.axis,
            repeatStep: rule.step,
            repeatCount
          }
        },
        attributes: {
          ...attributes,
          repeatAxis: rule.axis,
          repeatStep: rule.step,
          repeatCount
        }
      };
    } catch (error) {
      return {
        success: false,
        attributes,
        error: error instanceof Error ? error.message : 'Repeat operation failed'
      };
    }
  }
  
  /**
   * Execute setback operation - inset specific faces
   */
  private executeSetback(
    rule: SetbackRule,
    geometry: SimpleGeometry,
    attributes: Record<string, any>,
    context: GeometryContext
  ): RuleExecutionResult {
    try {
      return {
        success: true,
        geometry: {
          ...geometry,
          attributes: {
            ...geometry.attributes,
            setbackDistance: rule.d,
            setbackFaces: rule.faces || ['front']
          }
        },
        attributes: {
          ...attributes,
          setbackDistance: rule.d,
          setbackFaces: rule.faces || ['front']
        }
      };
    } catch (error) {
      return {
        success: false,
        attributes,
        error: error instanceof Error ? error.message : 'Setback operation failed'
      };
    }
  }
  
  /**
   * Execute roof operation - add roof geometry
   */
  private executeRoof(
    rule: RoofRule,
    geometry: SimpleGeometry,
    attributes: Record<string, any>,
    context: GeometryContext
  ): RuleExecutionResult {
    try {
      const roofHeight = rule.height || ((rule.pitch || 30) * Math.PI / 180) * 10;
      
      return {
        success: true,
        geometry: {
          ...geometry,
          attributes: {
            ...geometry.attributes,
            roofType: rule.kind,
            roofPitch: rule.pitch || 30,
            roofHeight
          }
        },
        attributes: {
          ...attributes,
          roofType: rule.kind,
          roofPitch: rule.pitch || 30,
          roofHeight
        }
      };
    } catch (error) {
      return {
        success: false,
        attributes,
        error: error instanceof Error ? error.message : 'Roof operation failed'
      };
    }
  }
  
  /**
   * Execute texture tag operation - assign material/texture
   */
  private executeTextureTag(
    rule: { op: 'textureTag'; tag: string; faces?: string[] },
    geometry: SimpleGeometry,
    attributes: Record<string, any>
  ): RuleExecutionResult {
    return {
      success: true,
      geometry: {
        ...geometry,
        attributes: {
          ...geometry.attributes,
          textureTag: rule.tag,
          textureFaces: rule.faces || ['all']
        }
      },
      attributes: {
        ...attributes,
        textureTag: rule.tag,
        textureFaces: rule.faces || ['all']
      }
    };
  }
  
  /**
   * Execute attribute operation - set custom attribute
   */
  private executeAttr(
    rule: { op: 'attr'; name: string; value: string | number | boolean },
    geometry: SimpleGeometry,
    attributes: Record<string, any>
  ): RuleExecutionResult {
    return {
      success: true,
      geometry: {
        ...geometry,
        attributes: {
          ...geometry.attributes,
          [rule.name]: rule.value
        }
      },
      attributes: {
        ...attributes,
        [rule.name]: rule.value
      }
    };
  }
  
  /**
   * Helper: Calculate polygon centroid
   */
  private calculateCentroid(vertices: number[][]): [number, number] {
    const sum = vertices.reduce((acc, vertex) => [acc[0] + vertex[0], acc[1] + vertex[1]], [0, 0]);
    return [sum[0] / vertices.length, sum[1] / vertices.length];
  }
  
  /**
   * Helper: Calculate polygon area using shoelace formula
   */
  private calculateArea(vertices: number[][]): number {
    let area = 0;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i][0] * vertices[j][1];
      area -= vertices[j][0] * vertices[i][1];
    }
    return Math.abs(area) / 2;
  }
  
  /**
   * Helper: Calculate volume for extruded polygon
   */
  private calculateVolume(vertices: number[][], height: number): number {
    return this.calculateArea(vertices) * height;
  }
}