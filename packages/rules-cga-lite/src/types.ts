import { z } from 'zod';

// Rule operation types based on CityEngine CGA
export const RuleSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('extrude'),
    h: z.number().min(0), // Allow zero height
    mode: z.enum(['world', 'local']).optional()
  }),
  z.object({
    op: z.literal('offset'),
    d: z.number().positive(),
    mode: z.enum(['in', 'out']).optional()
  }),
  z.object({
    op: z.literal('split'),
    axis: z.enum(['x', 'y', 'z']),
    sizes: z.array(z.union([z.number().positive(), z.literal('*')]))
  }),
  z.object({
    op: z.literal('repeat'),
    axis: z.enum(['x', 'y', 'z']),
    step: z.number().positive(),
    limit: z.number().positive().optional()
  }),
  z.object({
    op: z.literal('setback'),
    d: z.number().positive(),
    faces: z.array(z.enum(['front', 'back', 'left', 'right'])).optional()
  }),
  z.object({
    op: z.literal('roof'),
    kind: z.enum(['flat', 'gable', 'hip', 'shed']),
    pitch: z.number().min(0).max(90).optional(),
    height: z.number().positive().optional()
  }),
  z.object({
    op: z.literal('textureTag'),
    tag: z.string(),
    faces: z.array(z.enum(['front', 'back', 'left', 'right', 'top', 'bottom'])).optional()
  }),
  z.object({
    op: z.literal('attr'),
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()])
  })
]);

export const RuleProgramSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  attrs: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  rules: z.array(RuleSchema)
});

// Type exports
export type Rule = z.infer<typeof RuleSchema>;
export type RuleProgram = z.infer<typeof RuleProgramSchema>;

// Rule operation types
export type ExtrudeRule = Extract<Rule, { op: 'extrude' }>;
export type OffsetRule = Extract<Rule, { op: 'offset' }>;
export type SplitRule = Extract<Rule, { op: 'split' }>;
export type RepeatRule = Extract<Rule, { op: 'repeat' }>;
export type SetbackRule = Extract<Rule, { op: 'setback' }>;
export type RoofRule = Extract<Rule, { op: 'roof' }>;
export type TextureTagRule = Extract<Rule, { op: 'textureTag' }>;
export type AttrRule = Extract<Rule, { op: 'attr' }>;

// Geometry context for rule execution
export interface GeometryContext {
  polygon: number[][];  // Array of [x, y] coordinates
  attributes: Record<string, any>;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

// Simple geometry representation (without iTwin.js dependencies)
export interface SimpleGeometry {
  type: 'polygon' | 'solid' | 'mesh';
  vertices: number[][];
  faces?: number[][];
  attributes: Record<string, any>;
}

// Result of rule execution
export interface RuleExecutionResult {
  success: boolean;
  geometry?: SimpleGeometry;
  attributes: Record<string, any>;
  error?: string;
  metadata?: {
    operationCount: number;
    executionTimeMs: number;
  };
}