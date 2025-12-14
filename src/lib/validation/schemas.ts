/**
 * Validation Schemas
 *
 * Zod schemas for validating CSV uploads and API requests/responses.
 */

import { z } from "zod";

/**
 * Sensor Reading Schema
 * Validates individual sensor reading rows from CSV
 */
export const SensorReadingSchema = z.object({
  timestamp: z
    .string()
    .datetime({ message: "Invalid timestamp format. Use ISO 8601." }),
  asset_id: z.string().min(1, "Asset ID is required"),
  tempF: z
    .number()
    .min(-50, "Temperature must be >= -50°F")
    .max(500, "Temperature must be <= 500°F"),
  pressurePSI: z
    .number()
    .min(0, "Pressure must be >= 0 PSI")
    .max(10000, "Pressure must be <= 10000 PSI"),
  vibrationMM: z
    .number()
    .min(0, "Vibration must be >= 0mm")
    .max(100, "Vibration must be <= 100mm"),
  failure_flag: z.number().int("Failure flag must be 0 or 1").min(0).max(1),
});

/**
 * CSV Row Schema
 * Validates and coerces CSV string values to proper types
 */
export const CSVRowSchema = z.object({
  timestamp: z
    .string()
    .datetime({ message: "Invalid timestamp format. Use ISO 8601." }),
  asset_id: z.string().min(1, "Asset ID is required"),
  tempF: z.coerce
    .number()
    .min(-50, "Temperature must be >= -50°F")
    .max(500, "Temperature must be <= 500°F"),
  pressurePSI: z.coerce
    .number()
    .min(0, "Pressure must be >= 0 PSI")
    .max(10000, "Pressure must be <= 10000 PSI"),
  vibrationMM: z.coerce
    .number()
    .min(0, "Vibration must be >= 0mm")
    .max(100, "Vibration must be <= 100mm"),
  failure_flag: z.coerce
    .number()
    .int("Failure flag must be 0 or 1")
    .min(0)
    .max(1),
});

/**
 * CSV Upload Schema
 * Validates array of sensor readings
 */
export const CSVUploadSchema = z
  .array(SensorReadingSchema)
  .min(1, "CSV must contain at least one reading");

/**
 * Infer TypeScript types from schemas
 */
export type SensorReadingRow = z.infer<typeof SensorReadingSchema>;
export type CSVRow = z.infer<typeof CSVRowSchema>;
export type CSVUpload = z.infer<typeof CSVUploadSchema>;

/**
 * Asset Query Parameters Schema
 */
export const AssetQuerySchema = z.object({
  type: z.enum(["pump", "compressor", "motor", "other"]).optional(),
  riskLevel: z.enum(["green", "yellow", "red"]).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});

export type AssetQuery = z.infer<typeof AssetQuerySchema>;

/**
 * Train Request Schema
 */
export const TrainRequestSchema = z.object({
  file_id: z.string().min(1, "File ID is required"),
  model_type: z
    .enum(["random_forest", "xgboost", "neural_network"])
    .default("random_forest")
    .optional(),
});

export type TrainRequest = z.infer<typeof TrainRequestSchema>;

/**
 * Predict Request Schema
 */
export const PredictRequestSchema = z.object({
  file_id: z.string().min(1, "File ID is required"),
});

export type PredictRequest = z.infer<typeof PredictRequestSchema>;
