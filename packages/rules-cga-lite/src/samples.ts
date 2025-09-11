// Sample rule programs for testing and examples

import { RuleProgram } from './types';

/**
 * Simple tower rule - extrude polygon to create a basic building
 */
export const TOWER_RULE: RuleProgram = {
  name: 'Simple Tower',
  description: 'Basic extrusion to create a tower/building mass',
  attrs: {
    buildingType: 'residential',
    floors: 10
  },
  rules: [
    { op: 'extrude', h: 30 },
    { op: 'textureTag', tag: 'building_facade' },
    { op: 'attr', name: 'buildingHeight', value: 30 }
  ]
};

/**
 * Stepped building rule - setback and extrude multiple times
 */
export const STEPPED_BUILDING_RULE: RuleProgram = {
  name: 'Stepped Building',
  description: 'Building with setbacks creating stepped profile',
  attrs: {
    buildingType: 'office',
    maxHeight: 60
  },
  rules: [
    { op: 'extrude', h: 20 },
    { op: 'setback', d: 3, faces: ['front', 'back'] },
    { op: 'extrude', h: 20 },
    { op: 'setback', d: 2, faces: ['left', 'right'] },
    { op: 'extrude', h: 20 },
    { op: 'roof', kind: 'flat' },
    { op: 'textureTag', tag: 'office_facade' }
  ]
};

/**
 * House with gable roof rule
 */
export const HOUSE_WITH_ROOF_RULE: RuleProgram = {
  name: 'House with Gable Roof',
  description: 'Residential house with gabled roof',
  attrs: {
    buildingType: 'residential',
    stories: 2
  },
  rules: [
    { op: 'setback', d: 1.5, faces: ['front', 'back', 'left', 'right'] },
    { op: 'extrude', h: 8 },
    { op: 'roof', kind: 'gable', pitch: 35, height: 4 },
    { op: 'textureTag', tag: 'residential_facade', faces: ['front', 'back', 'left', 'right'] },
    { op: 'textureTag', tag: 'roof_tiles', faces: ['top'] },
    { op: 'attr', name: 'dwellingUnits', value: 1 }
  ]
};

/**
 * Commercial strip rule - offset and low extrusion
 */
export const COMMERCIAL_STRIP_RULE: RuleProgram = {
  name: 'Commercial Strip',
  description: 'Low-rise commercial building with parking setback',
  attrs: {
    buildingType: 'commercial',
    parkingSpaces: 20
  },
  rules: [
    { op: 'setback', d: 8, faces: ['front'] }, // Parking setback
    { op: 'extrude', h: 6 },
    { op: 'roof', kind: 'flat' },
    { op: 'textureTag', tag: 'commercial_facade' },
    { op: 'attr', name: 'floorArea', value: 500 }
  ]
};

/**
 * Mixed-use building rule - split and different treatments
 */
export const MIXED_USE_RULE: RuleProgram = {
  name: 'Mixed Use Building',
  description: 'Ground floor commercial with residential above',
  attrs: {
    buildingType: 'mixed',
    groundFloorUse: 'commercial',
    upperFloorUse: 'residential'
  },
  rules: [
    { op: 'split', axis: 'z', sizes: [4, '*'] },
    { op: 'extrude', h: 4 }, // Ground floor
    { op: 'textureTag', tag: 'commercial_ground_floor' },
    { op: 'extrude', h: 24 }, // Upper floors
    { op: 'setback', d: 2, faces: ['front', 'back'] },
    { op: 'textureTag', tag: 'residential_upper' },
    { op: 'roof', kind: 'flat' }
  ]
};

/**
 * All available sample rules
 */
export const SAMPLE_RULES = {
  TOWER_RULE,
  STEPPED_BUILDING_RULE,
  HOUSE_WITH_ROOF_RULE,
  COMMERCIAL_STRIP_RULE,
  MIXED_USE_RULE
};

/**
 * Get rule by name
 */
export function getRuleByName(name: string): RuleProgram | undefined {
  return Object.values(SAMPLE_RULES).find(rule => rule.name === name);
}

/**
 * Get all rule names
 */
export function getAllRuleNames(): string[] {
  return Object.values(SAMPLE_RULES).map(rule => rule.name);
}