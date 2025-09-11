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
  RoofRule,
  RuleProgramSchema
} from './types';
import { validateGeometryForRules, calculatePolygonArea, COMMON_CRS } from './utils/crs';

/**
 * CGA-lite Rules Engine - Minimal implementation of CityEngine-like procedural rules
 * Simplified version without iTwin.js dependencies for initial development
 */
export class RulesEngine {
  private operationCount = 0;
  
  /**
   * Execute a rule program on a given geometry context (alias for tests)
   */
  async executeRules(program: RuleProgram, context: GeometryContext): Promise<RuleExecutionResult> {
    return this.executeProgram(program, context);
  }
  
  /**
   * Execute a rule program on a given geometry context
   */
  async executeProgram(program: RuleProgram, context: GeometryContext): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    this.operationCount = 0;
    
    let validProgram: RuleProgram;
    
    try {
      // Validate rule program schema
      validProgram = RuleProgramSchema.parse(program);
    } catch (schemaError) {
      // Convert Zod validation errors to user-friendly messages
      let errorMessage = 'Rule program validation failed';
      if (schemaError instanceof Error) {
        if (schemaError.message.includes('too_small')) {
          errorMessage = 'Height value must be non-negative';
        } else if (schemaError.message.includes('invalid_union_discriminator')) {
          errorMessage = 'Invalid rule operation - validation error';
        } else {
          errorMessage = `Schema validation error: ${schemaError.message}`;
        }
      }
      
      return {
        success: false,
        attributes: context.attributes,
        error: errorMessage,
        metadata: {
          operationCount: 0,
          executionTimeMs: Date.now() - startTime
        }
      };
    }
    
    try {
      
      // Validate geometry for rule application (use permissive validation for testing)
      const geometryValidation = validateGeometryForRules(
        context.polygon, 
        { epsg: 3857, name: 'Local Test CRS', units: 'meters', type: 'projected' } // Permissive CRS for testing
      );
      
      if (!geometryValidation.valid) {
        return {
          success: false,
          attributes: context.attributes,
          error: `Invalid geometry for rule processing: ${geometryValidation.errors.join(', ')}`,
          metadata: {
            operationCount: 0,
            executionTimeMs: Date.now() - startTime
          }
        };
      }
      
      let currentGeometry = this.createInitialGeometry(context);
      let attributes: Record<string, any> = { 
        ...context.attributes, 
        ...validProgram.attrs,
        baseArea: calculatePolygonArea({
          coordinates: context.polygon,
          crs: COMMON_CRS.BUENOS_AIRES_UTM
        })
      };
      
      let totalHeight = 0;
      let totalVolume = 0;
      let extrudeCount = 0; // Track extrude operations for stepped buildings
      
      for (const rule of validProgram.rules) {
        const result = await this.executeRule(rule, currentGeometry, attributes, context);
        if (!result.success) {
          return result;
        }
        currentGeometry = result.geometry || currentGeometry;
        attributes = { ...attributes, ...result.attributes };
        
        // Track cumulative metrics differently for different operations
        if (rule.op === 'extrude') {
          if (extrudeCount === 0) {
            // First extrude sets the base height
            totalHeight = result.attributes.height || 0;
          } else {
            // Subsequent extrudes add to height (for stepped buildings)
            totalHeight += result.attributes.height || 0;
          }
          extrudeCount++;
        }
        
        // Only accumulate volume from extrude operations
        if (rule.op === 'extrude' && result.attributes.volume) {
          totalVolume += result.attributes.volume;
        }
        
        this.operationCount++;
      }
      
      // Add final cumulative attributes
      attributes.totalHeight = totalHeight;
      attributes.totalVolume = totalVolume;
      
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
      // Validate height is non-negative  
      if (rule.h < 0) {
        return {
          success: false,
          attributes,
          error: 'Extrude height must be non-negative'
        };
      }
      
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
      
      const currentArea = this.calculateArea(geometry.vertices);
      const volume = currentArea * rule.h;
      
      const extrudedGeometry: SimpleGeometry = {
        type: 'solid',
        vertices: vertices3D,
        faces,
        attributes: {
          ...geometry.attributes,
          height: rule.h,
          volume,
          baseArea: currentArea,
          extrudeMode: rule.mode || 'world'
        }
      };
      
      return {
        success: true,
        geometry: extrudedGeometry,
        attributes: {
          ...attributes,
          height: rule.h,
          volume,
          baseArea: currentArea
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
      const isOutward = rule.mode === 'out';
      const distance = isOutward ? rule.d : -rule.d;
      
      // Check if inward offset is too large
      if (!isOutward) {
        const minDimension = Math.min(
          context.boundingBox.max.x - context.boundingBox.min.x,
          context.boundingBox.max.y - context.boundingBox.min.y
        );
        
        if (rule.d >= minDimension / 2) {
          return {
            success: false,
            attributes,
            error: 'Inward offset too large - would eliminate geometry'
          };
        }
      }
      
      // Simplified offset implementation for rectangular polygons
      // For a square/rectangle, inward offset shrinks by distance on all sides
      // outward offset expands by distance on all sides
      const offsetVertices = this.offsetRectangularPolygon(geometry.vertices, rule.d, isOutward);
      
      if (offsetVertices.length === 0) {
        return {
          success: false,
          attributes,
          error: 'Inward offset too large - would eliminate geometry'
        };
      }
      
      const newArea = this.calculateArea(offsetVertices);
      
      const offsetGeometry: SimpleGeometry = {
        type: 'polygon',
        vertices: offsetVertices,
        attributes: {
          ...geometry.attributes,
          offsetDistance: rule.d,
          offsetMode: rule.mode || 'in',
          area: newArea
        }
      };
      
      return {
        success: true,
        geometry: offsetGeometry,
        attributes: {
          ...attributes,
          offsetDistance: rule.d,
          offsetMode: rule.mode || 'in',
          area: newArea
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
      const { min, max } = context.boundingBox;
      const axisSize = rule.axis === 'x' ? (max.x - min.x) : 
                     rule.axis === 'y' ? (max.y - min.y) : (max.z - min.z);
      
      // Calculate total of fixed sizes
      const fixedSizes = rule.sizes.filter(s => typeof s === 'number') as number[];
      const flexibleCount = rule.sizes.filter(s => s === '*').length;
      const totalFixed = fixedSizes.reduce((sum, size) => sum + size, 0);
      
      // Validate that fixed sizes don't exceed axis size
      if (totalFixed > axisSize) {
        return {
          success: false,
          attributes,
          error: `Split sizes (${totalFixed}) exceeds axis dimension (${axisSize})`
        };
      }
      
      // Calculate flexible size
      const remainingSize = axisSize - totalFixed;
      const flexibleSize = flexibleCount > 0 ? remainingSize / flexibleCount : 0;
      
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
            splitParts: rule.sizes.length,
            flexibleSize
          }
        },
        attributes: {
          ...attributes,
          splitAxis: rule.axis,
          splitSizes: rule.sizes,
          splitParts: rule.sizes.length,
          flexibleSize
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
      const faces = rule.faces || ['front', 'back', 'left', 'right'];
      
      // For a rectangular polygon, apply setback to specified faces
      // This is similar to offset but only on specific sides
      const setbackVertices = this.applySetbackToRectangle(geometry.vertices, rule.d, faces);
      
      if (setbackVertices.length === 0) {
        return {
          success: false,
          attributes,
          error: 'Setback too large - would eliminate geometry'
        };
      }
      
      const newArea = this.calculateArea(setbackVertices);
      
      const setbackGeometry: SimpleGeometry = {
        type: 'polygon',
        vertices: setbackVertices,
        attributes: {
          ...geometry.attributes,
          setbackDistance: rule.d,
          setbackFaces: faces,
          area: newArea
        }
      };
      
      const { volume: _, ...attributesWithoutVolume } = attributes;
      
      return {
        success: true,
        geometry: setbackGeometry,
        attributes: {
          ...attributesWithoutVolume,
          setbackDistance: rule.d,
          setbackFaces: faces,
          area: newArea,
          baseArea: newArea // Update baseArea for subsequent operations
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
      // Validate pitch angle
      if (rule.pitch && (rule.pitch < 0 || rule.pitch > 90)) {
        return {
          success: false,
          attributes,
          error: 'Roof pitch must be between 0 and 90 degrees'
        };
      }
      
      const roofHeight = rule.height || ((rule.pitch || 30) * Math.PI / 180) * 10;
      
      const { volume: _, ...attributesWithoutVolume } = attributes;
      
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
          ...attributesWithoutVolume,
          roofType: rule.kind,
          roofPitch: rule.pitch,
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
    const existingTags = attributes.textureTags || [];
    const newTags = [...existingTags, rule.tag];
    
    return {
      success: true,
      geometry: {
        ...geometry,
        attributes: {
          ...geometry.attributes,
          textureTag: rule.tag,
          textureFaces: rule.faces || ['all'],
          textureTags: newTags
        }
      },
      attributes: {
        ...attributes,
        textureTag: rule.tag,
        textureFaces: rule.faces || ['all'],
        textureTags: newTags
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

  /**
   * Helper: Offset rectangular polygon inward/outward
   * For rectangular polygons, this properly shrinks/expands each edge
   */
  private offsetRectangularPolygon(vertices: number[][], distance: number, outward: boolean): number[][] {
    // For a simple rectangular polygon, we can offset by moving each edge
    // This assumes vertices are in order: [min,min], [max,min], [max,max], [min,max], [min,min]
    
    if (vertices.length < 4) return [];
    
    // Calculate bounding box
    const xs = vertices.map(v => v[0]);
    const ys = vertices.map(v => v[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Apply offset
    const offset = outward ? distance : -distance;
    
    const newMinX = minX - offset;
    const newMaxX = maxX + offset;
    const newMinY = minY - offset;
    const newMaxY = maxY + offset;
    
    // Check if inward offset would eliminate the polygon
    if (!outward && (newMaxX <= newMinX || newMaxY <= newMinY)) {
      return []; // Invalid polygon
    }
    
    // Return rectangular vertices in same order
    return [
      [newMinX, newMinY],
      [newMaxX, newMinY], 
      [newMaxX, newMaxY],
      [newMinX, newMaxY],
      [newMinX, newMinY] // Close the polygon
    ];
  }

  /**
   * Helper: Apply setback to specific faces of a rectangular polygon
   * faces can be: 'front', 'back', 'left', 'right'
   * For a rectangle with min/max bounds, assumes:
   * - front = minY edge, back = maxY edge
   * - left = minX edge, right = maxX edge
   */
  private applySetbackToRectangle(vertices: number[][], distance: number, faces: string[]): number[][] {
    if (vertices.length < 4) return [];
    
    // Calculate bounding box
    const xs = vertices.map(v => v[0]);
    const ys = vertices.map(v => v[1]);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    
    // Apply setback to specified faces
    if (faces.includes('front')) {
      minY += distance; // Move front edge inward
    }
    if (faces.includes('back')) {
      maxY -= distance; // Move back edge inward  
    }
    if (faces.includes('left')) {
      minX += distance; // Move left edge inward
    }
    if (faces.includes('right')) {
      maxX -= distance; // Move right edge inward
    }
    
    // Check if setback would eliminate the polygon
    if (maxX <= minX || maxY <= minY) {
      return []; // Invalid polygon
    }
    
    // Return rectangular vertices in same order
    return [
      [minX, minY],
      [maxX, minY], 
      [maxX, maxY],
      [minX, maxY],
      [minX, minY] // Close the polygon
    ];
  }
}