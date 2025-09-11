// Jest setup for testing environment
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.REACT_APP_CESIUM_ACCESS_TOKEN = 'test-token';
process.env.REACT_APP_ENABLE_WORLD_TERRAIN = 'true';
process.env.REACT_APP_ENABLE_OSM_BUILDINGS = 'true';