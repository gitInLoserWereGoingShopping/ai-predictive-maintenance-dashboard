/**
 * Database Helpers Index
 *
 * Centralized export point for all database helper functions.
 *
 * Usage:
 * import { createAsset, getAllAssets, insertSensorReadings } from '@/lib/db/helpers';
 */

// File operations
export {
  createUploadedFile,
  getUploadedFileById,
  getAllUploadedFiles,
  updateFileStatus,
} from "./files";

// Asset operations
export {
  createAsset,
  getAssetById,
  getAllAssets,
  getAssetWithReadings,
  updateAsset,
  deleteAsset,
} from "./assets";

// Sensor reading operations
export {
  insertSensorReadings,
  getReadingsByAssetId,
  getLatestReading,
  getReadingsInTimeRange,
} from "./readings";

// Prediction operations
export {
  createPrediction,
  getLatestPredictionForAsset,
  getPredictionHistory,
} from "./predictions";

// Data quality operations
export { createDataQualityIssue, getIssuesByFileId } from "./quality";
