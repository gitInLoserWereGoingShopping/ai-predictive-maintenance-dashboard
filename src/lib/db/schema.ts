import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Uploaded Files
 * Tracks CSV files uploaded by users
 */
export const uploadedFiles = sqliteTable("uploaded_files", {
  id: text("id").primaryKey(), // e.g., "file_20251214_153045"
  fileName: text("file_name").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  rowCount: integer("row_count").notNull(),
  assetCount: integer("asset_count").notNull(),
  status: text("status").notNull().default("uploaded"), // 'uploaded', 'processed', 'error'
});

/**
 * Assets
 * Represents industrial equipment (pumps, compressors, motors, etc.)
 */
export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(), // e.g., "PUMP-101", "COMP-204"
  name: text("name").notNull(), // e.g., "Water Pump 101"
  type: text("type").notNull(), // e.g., "Pump", "Compressor", "Motor"
  location: text("location"), // e.g., "Building A - Floor 2"
  manufacturer: text("manufacturer"),
  model: text("model"),
  installationDate: text("installation_date"), // ISO string
  lastMaintenanceDate: text("last_maintenance_date"), // ISO string

  // Metadata
  fileId: text("file_id").references(() => uploadedFiles.id), // Track which upload created this asset
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Sensor Readings
 * Raw time-series data from CSV uploads
 */
export const sensorReadings = sqliteTable("sensor_readings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  timestamp: text("timestamp").notNull(), // ISO 8601 datetime

  // Sensor values
  tempF: real("temp_f").notNull(),
  pressurePSI: real("pressure_psi").notNull(),
  vibrationMM: real("vibration_mm").notNull(),

  // Label for training
  failureFlag: integer("failure_flag").notNull().default(0), // 0 = normal, 1 = failure

  // Metadata
  fileId: text("file_id").references(() => uploadedFiles.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Feature Store
 * Engineered features for ML model
 */
export const features = sqliteTable("features", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  windowEnd: text("window_end").notNull(), // Timestamp of feature window end

  // Rolling statistics (24hr window)
  tempMean24h: real("temp_mean_24h"),
  tempStd24h: real("temp_std_24h"),
  tempMax24h: real("temp_max_24h"),
  tempMin24h: real("temp_min_24h"),

  pressureMean24h: real("pressure_mean_24h"),
  pressureStd24h: real("pressure_std_24h"),
  pressureMax24h: real("pressure_max_24h"),
  pressureMin24h: real("pressure_min_24h"),

  vibrationMean24h: real("vibration_mean_24h"),
  vibrationStd24h: real("vibration_std_24h"),
  vibrationMax24h: real("vibration_max_24h"),
  vibrationMin24h: real("vibration_min_24h"),

  // Lag features (1 hour)
  tempLag1h: real("temp_lag_1h"),
  pressureLag1h: real("pressure_lag_1h"),
  vibrationLag1h: real("vibration_lag_1h"),

  // Rate of change (24hr)
  tempRoc24h: real("temp_roc_24h"),
  pressureRoc24h: real("pressure_roc_24h"),
  vibrationRoc24h: real("vibration_roc_24h"),

  // Target variable
  failureFlag: integer("failure_flag").notNull().default(0),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Predictions
 * ML model predictions for asset failure risk
 */
export const predictions = sqliteTable("predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),

  // Prediction results
  probability: real("probability").notNull(), // 0.0 to 1.0
  riskLevel: text("risk_level").notNull(), // 'Green', 'Yellow', 'Red'
  recommendation: text("recommendation").notNull(),

  // Model info
  modelVersion: text("model_version"),

  // Feature importance (top 5 stored as JSON)
  featureImportances: text("feature_importances"), // JSON string

  predictedAt: integer("predicted_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Model Metadata
 * Tracks trained models
 */
export const models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  version: text("version").notNull().unique(), // e.g., "v1_20251214_154530"
  modelType: text("model_type").notNull(), // e.g., "RandomForestClassifier"

  // Training info
  trainingSamples: integer("training_samples").notNull(),
  validationSamples: integer("validation_samples").notNull(),

  // Metrics (stored as JSON)
  metrics: text("metrics").notNull(), // { accuracy, precision, recall, f1_score }

  // Feature importances (stored as JSON)
  featureImportances: text("feature_importances").notNull(), // Array of { feature, importance }

  // Storage
  modelPath: text("model_path"), // Path to saved model file

  trainedAt: integer("trained_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Data Quality Issues
 * Tracks validation issues during CSV upload
 */
export const dataQualityIssues = sqliteTable("data_quality_issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileId: text("file_id")
    .notNull()
    .references(() => uploadedFiles.id),
  assetId: text("asset_id"),
  timestamp: text("timestamp"),

  issueType: text("issue_type").notNull(), // 'missing_value', 'outlier', 'invalid_format'
  field: text("field"), // Which field has the issue
  value: text("value"), // The problematic value
  severity: text("severity").notNull(), // 'warning', 'error'

  detectedAt: integer("detected_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Type exports for use in the application
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type NewUploadedFile = typeof uploadedFiles.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type SensorReading = typeof sensorReadings.$inferSelect;
export type NewSensorReading = typeof sensorReadings.$inferInsert;

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

export type DataQualityIssue = typeof dataQualityIssues.$inferSelect;
export type NewDataQualityIssue = typeof dataQualityIssues.$inferInsert;
