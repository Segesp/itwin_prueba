import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SCENARIOS_PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));

// Validation schemas
const CreateScenarioSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  baseVersionId: z.string().optional(),
  iModelId: z.string()
});

const ScenariosDiffSchema = z.object({
  fromVersionId: z.string(),
  toVersionId: z.string(),
  iModelId: z.string()
});

const ApplyRulesToScenarioSchema = z.object({
  scenarioId: z.string(),
  targetElementIds: z.array(z.string()),
  ruleProgram: z.object({
    name: z.string(),
    rules: z.array(z.any())
  })
});

// In-memory scenario storage (in production, use a proper database)
interface Scenario {
  id: string;
  name: string;
  description?: string;
  iModelId: string;
  baseVersionId?: string;
  currentVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'archived';
}

class ScenarioManager {
  private static scenarios = new Map<string, Scenario>();

  static create(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Scenario {
    const scenario: Scenario = {
      ...data,
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };

    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  static getById(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  static getByIModel(iModelId: string): Scenario[] {
    return Array.from(this.scenarios.values()).filter(s => s.iModelId === iModelId);
  }

  static update(id: string, updates: Partial<Scenario>): Scenario | null {
    const scenario = this.scenarios.get(id);
    if (!scenario) return null;

    const updated = { ...scenario, ...updates, updatedAt: new Date() };
    this.scenarios.set(id, updated);
    return updated;
  }

  static delete(id: string): boolean {
    return this.scenarios.delete(id);
  }

  static getAll(): Scenario[] {
    return Array.from(this.scenarios.values());
  }
}

// Routes

/**
 * POST /scenarios/create
 * Create a new scenario
 */
app.post("/scenarios/create", async (req, res) => {
  try {
    const { name, description, baseVersionId, iModelId } = CreateScenarioSchema.parse(req.body);

    const scenario = ScenarioManager.create({
      name,
      description,
      baseVersionId,
      iModelId
    });

    res.json({
      success: true,
      scenario,
      message: "Scenario created successfully"
    });
  } catch (error) {
    console.error("Error creating scenario:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /scenarios/:id
 * Get scenario by ID
 */
app.get("/scenarios/:id", (req, res) => {
  try {
    const scenario = ScenarioManager.getById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: "Scenario not found"
      });
    }

    res.json({
      success: true,
      scenario
    });
  } catch (error) {
    console.error("Error getting scenario:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /scenarios
 * List all scenarios, optionally filtered by iModelId
 */
app.get("/scenarios", (req, res) => {
  try {
    const { iModelId } = req.query;
    
    let scenarios: Scenario[];
    if (iModelId && typeof iModelId === 'string') {
      scenarios = ScenarioManager.getByIModel(iModelId);
    } else {
      scenarios = ScenarioManager.getAll();
    }

    res.json({
      success: true,
      scenarios,
      count: scenarios.length
    });
  } catch (error) {
    console.error("Error listing scenarios:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /scenarios/diff
 * Get differences between two versions (Changed Elements API)
 */
app.get("/scenarios/diff", async (req, res) => {
  try {
    const { fromVersionId, toVersionId, iModelId } = ScenariosDiffSchema.parse(req.query);

    // In a real implementation, this would use the Changed Elements API:
    // 1. Query changed elements between versions
    // 2. Categorize changes (inserted, updated, deleted)
    // 3. Calculate metrics and statistics
    
    // For MVP, simulate the response
    const mockChangedElements = [
      {
        elementId: "0x1234",
        changeType: "insert",
        elementClass: "Generic:GenericPhysicalObject",
        parentId: "0x5678"
      },
      {
        elementId: "0x5678",
        changeType: "update", 
        elementClass: "Generic:GenericPhysicalObject",
        properties: ["geometry", "userLabel"]
      },
      {
        elementId: "0x9ABC",
        changeType: "delete",
        elementClass: "Generic:GenericPhysicalObject"
      }
    ];

    const metrics = {
      totalChanges: mockChangedElements.length,
      inserted: mockChangedElements.filter(e => e.changeType === "insert").length,
      updated: mockChangedElements.filter(e => e.changeType === "update").length,
      deleted: mockChangedElements.filter(e => e.changeType === "delete").length,
      affectedModels: ["0x1", "0x10"],
      affectedCategories: ["0x17"]
    };

    res.json({
      success: true,
      fromVersionId,
      toVersionId,
      iModelId,
      changedElements: mockChangedElements,
      metrics,
      message: "Diff calculated successfully"
    });
  } catch (error) {
    console.error("Error calculating diff:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /scenarios/:id/applyRules
 * Apply CGA rules to elements within a scenario
 */
app.post("/scenarios/:id/applyRules", async (req, res) => {
  try {
    const scenarioId = req.params.id;
    const { targetElementIds, ruleProgram } = ApplyRulesToScenarioSchema.parse({
      scenarioId,
      ...req.body
    });

    const scenario = ScenarioManager.getById(scenarioId);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: "Scenario not found"
      });
    }

    // Forward the request to the imodel-edit service
    // In a real implementation, this would make an HTTP request or use a service mesh
    console.log(`Applying rules in scenario ${scenarioId}:`, {
      ruleProgram: ruleProgram.name,
      targetElementIds: targetElementIds.length
    });

    // Mock rule application results
    const applicationResults = {
      scenarioId,
      ruleProgram: ruleProgram.name,
      appliedToElements: targetElementIds.length,
      success: true,
      newVersionId: `${scenario.currentVersionId || scenario.baseVersionId}_updated_${Date.now()}`
    };

    // Update scenario with new version
    ScenarioManager.update(scenarioId, {
      currentVersionId: applicationResults.newVersionId,
      status: 'active'
    });

    res.json({
      success: true,
      scenario: ScenarioManager.getById(scenarioId),
      applicationResults,
      message: "Rules applied to scenario successfully"
    });
  } catch (error) {
    console.error("Error applying rules to scenario:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PUT /scenarios/:id
 * Update scenario details
 */
app.put("/scenarios/:id", (req, res) => {
  try {
    const scenarioId = req.params.id;
    const updates = req.body;

    const scenario = ScenarioManager.update(scenarioId, updates);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: "Scenario not found"
      });
    }

    res.json({
      success: true,
      scenario,
      message: "Scenario updated successfully"
    });
  } catch (error) {
    console.error("Error updating scenario:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * DELETE /scenarios/:id
 * Delete a scenario
 */
app.delete("/scenarios/:id", (req, res) => {
  try {
    const scenarioId = req.params.id;
    const deleted = ScenarioManager.delete(scenarioId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Scenario not found"
      });
    }

    res.json({
      success: true,
      message: "Scenario deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "scenarios-service",
    timestamp: new Date().toISOString(),
    scenarios: ScenarioManager.getAll().length
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
function startServer() {
  app.listen(PORT, () => {
    console.log(`Scenarios Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, ScenarioManager };