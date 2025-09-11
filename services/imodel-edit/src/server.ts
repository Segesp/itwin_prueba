import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { IModelHost, SnapshotDb, IModelDb, ElementProps } from "@itwin/core-backend";
import { BriefcaseDbArg, IModelError } from "@itwin/core-common";
import { z } from "zod";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));

// Validation schemas
const InsertSolidSchema = z.object({
  iModelId: z.string(),
  geometry: z.object({
    vertices: z.array(z.array(z.number())),
    faces: z.array(z.array(z.number())).optional(),
    attributes: z.record(z.any()).optional()
  }),
  categoryId: z.string().optional(),
  modelId: z.string().optional()
});

const CreateVersionSchema = z.object({
  iModelId: z.string(),
  versionName: z.string(),
  description: z.string().optional()
});

const ApplyRulesSchema = z.object({
  iModelId: z.string(),
  targetElementIds: z.array(z.string()),
  ruleProgram: z.object({
    name: z.string(),
    rules: z.array(z.any())
  }),
  scenarioName: z.string().optional()
});

// Global iModel session management
class IModelSessionManager {
  private static openModels = new Map<string, IModelDb>();

  static async withIModel<T>(
    iModelId: string,
    operation: (iModel: IModelDb) => Promise<T>
  ): Promise<T> {
    try {
      let iModel = this.openModels.get(iModelId);
      
      if (!iModel) {
        // In a real implementation, you would open the iModel using:
        // - Briefcase API for read-write access
        // - Checkpoint API for read access
        // For this MVP, we'll simulate the process
        
        const iModelPath = process.env.IMODEL_LOCAL_PATH || "./sample.bim";
        
        try {
          // Try opening as briefcase (read-write)
          iModel = await IModelDb.open(iModelPath, { openMode: "ReadWrite" } as any);
        } catch (error) {
          // Fallback to snapshot (read-only)
          console.warn("Failed to open briefcase, falling back to snapshot:", error);
          iModel = SnapshotDb.openFile(iModelPath);
        }
        
        this.openModels.set(iModelId, iModel);
      }

      return await operation(iModel);
    } catch (error) {
      console.error("Error in iModel operation:", error);
      throw new IModelError(-1, `iModel operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static closeAll() {
    for (const [id, iModel] of this.openModels) {
      try {
        iModel.close();
      } catch (error) {
        console.error(`Error closing iModel ${id}:`, error);
      }
    }
    this.openModels.clear();
  }
}

// Routes

/**
 * POST /elements/insertSolid
 * Insert a 3D solid geometry into the iModel
 */
app.post("/elements/insertSolid", async (req, res) => {
  try {
    const { iModelId, geometry, categoryId, modelId } = InsertSolidSchema.parse(req.body);

    const result = await IModelSessionManager.withIModel(iModelId, async (iModel) => {
      // Create element properties
      const elementProps: ElementProps = {
        classFullName: "Generic:GenericPhysicalObject", // Use appropriate schema class
        model: modelId || iModel.models.repositoryModelId,
        category: categoryId || "0x1", // Default category
        code: iModel.codes.makeCode("Generic", "GenericPhysicalObject", `Solid_${Date.now()}`),
        // In a real implementation, convert geometry to iTwin format:
        // - Use GeometryStreamBuilder for complex geometry
        // - Convert vertices/faces to appropriate iTwin geometry primitives
        userLabel: `CGA Generated Solid - ${new Date().toISOString()}`
      };

      // Insert element
      const elementId = iModel.elements.insertElement(elementProps);
      
      // Save changes
      iModel.saveChanges("Insert CGA-generated solid");

      return {
        elementId,
        success: true,
        message: "Solid geometry inserted successfully"
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error inserting solid:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /versions/create
 * Create a Named Version for scenario management
 */
app.post("/versions/create", async (req, res) => {
  try {
    const { iModelId, versionName, description } = CreateVersionSchema.parse(req.body);

    const result = await IModelSessionManager.withIModel(iModelId, async (iModel) => {
      // Create named version
      // In a real implementation:
      // 1. Ensure all changes are saved
      // 2. Create changeset with appropriate description
      // 3. Push changeset to iModelHub
      // 4. Create named version pointing to the changeset

      // For this MVP, we simulate the process
      const versionId = `version_${Date.now()}`;
      
      // In reality: await iModel.pushChanges({ description });
      console.log(`Creating named version: ${versionName} for iModel: ${iModelId}`);

      return {
        versionId,
        versionName,
        description: description || `Scenario version created at ${new Date().toISOString()}`,
        success: true,
        message: "Named version created successfully"
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error creating version:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /scenarios/applyRules
 * Apply CGA rules to selected elements and create scenario version
 */
app.post("/scenarios/applyRules", async (req, res) => {
  try {
    const { iModelId, targetElementIds, ruleProgram, scenarioName } = ApplyRulesSchema.parse(req.body);

    const result = await IModelSessionManager.withIModel(iModelId, async (iModel) => {
      // Apply rules to target elements
      const processedElements = [];
      
      for (const elementId of targetElementIds) {
        try {
          // Get existing element
          const element = iModel.elements.getElement(elementId);
          
          // Apply rule program (this would integrate with the CGA-lite engine)
          // For MVP, we simulate rule application
          console.log(`Applying rules "${ruleProgram.name}" to element ${elementId}`);
          
          // Update element with rule results
          // In a real implementation:
          // 1. Execute CGA rules using the rules-cga-lite package
          // 2. Generate new geometry based on rule results
          // 3. Update element geometry and properties
          
          processedElements.push({
            originalElementId: elementId,
            processed: true,
            rules: ruleProgram.rules.length
          });
        } catch (elementError) {
          console.error(`Error processing element ${elementId}:`, elementError);
          processedElements.push({
            originalElementId: elementId,
            processed: false,
            error: elementError instanceof Error ? elementError.message : "Unknown error"
          });
        }
      }

      // Save changes
      iModel.saveChanges(`Applied CGA rules: ${ruleProgram.name}`);

      // Create scenario version if requested
      let versionInfo = null;
      if (scenarioName) {
        versionInfo = {
          versionId: `scenario_${Date.now()}`,
          versionName: scenarioName,
          description: `Scenario created by applying rules: ${ruleProgram.name}`
        };
      }

      return {
        success: true,
        processedElements,
        ruleProgram: ruleProgram.name,
        scenario: versionInfo,
        message: `Applied rules to ${processedElements.filter(e => e.processed).length}/${targetElementIds.length} elements`
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error applying rules:", error);
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
    service: "imodel-edit-service",
    timestamp: new Date().toISOString(),
    iTwinHostInitialized: !!IModelHost
  });
});

/**
 * GET /imodels/:id/info
 * Get iModel information
 */
app.get("/imodels/:id/info", async (req, res) => {
  try {
    const iModelId = req.params.id;

    const result = await IModelSessionManager.withIModel(iModelId, async (iModel) => {
      return {
        iModelId,
        name: iModel.name,
        description: iModel.description,
        rootSubject: iModel.elements.getRootSubject(),
        models: {
          repository: iModel.models.repositoryModelId,
          // Add more model info as needed
        },
        success: true
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error getting iModel info:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
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

// Startup and shutdown
async function startServer() {
  try {
    // Initialize iTwin.js backend
    console.log("Initializing iTwin.js backend...");
    await IModelHost.startup();
    console.log("iTwin.js backend initialized successfully");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`iModel Edit Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully");
  IModelSessionManager.closeAll();
  await IModelHost.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully");
  IModelSessionManager.closeAll();
  await IModelHost.shutdown();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, IModelSessionManager };