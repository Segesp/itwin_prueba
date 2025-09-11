// Main exports for the rules-cga-lite package

export * from './types';
export * from './engine';
export * from './samples';

// Main rule engine instance
export { RulesEngine } from './engine';

// Default export
import { RulesEngine } from './engine';
export default RulesEngine;