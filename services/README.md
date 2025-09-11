# Services Directory

This directory contains backend services for the iTwin Urban Digital Twin platform.

## services/imodel-edit
Node.js backend service for:
- Real iModel geometry insertion and modification
- Named Version creation for scenario management
- Element persistence and iTwin SDK integration

## services/scenarios
Backend service for:
- Scenario management and comparison
- Changed Elements API integration
- A/B scenario diff visualization

## Architecture
Each service follows the pattern:
- `src/server.ts` - Express server setup
- `src/routes/` - API route handlers
- `src/services/` - Business logic
- `src/utils/` - Utility functions