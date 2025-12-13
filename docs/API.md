# API Documentation

**Version:** 1.0.0  
**Base URL:** `/api`  
**Content-Type:** `application/json` (except `/upload` which uses `multipart/form-data`)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
   - [POST /upload](#post-upload)
   - [POST /train](#post-train)
   - [POST /predict](#post-predict)
   - [GET /assets](#get-assets)
   - [GET /assets/{id}](#get-assetsid)
5. [Data Models](#data-models)
6. [Examples](#examples)

---

## Overview

This API provides endpoints for predictive maintenance operations including:

- CSV sensor data upload and validation
- Machine learning model training
- Risk prediction for industrial assets
- Asset monitoring and visualization

**Workflow:**

1. Upload sensor data CSV → `/upload`
2. Train predictive model → `/train`
3. Generate risk predictions → `/predict`
4. Retrieve asset list → `/assets`
5. View asset details → `/assets/{id}`

---

## Authentication

**MVP:** No authentication required  
**Future:** JWT-based authentication for production deployment

---

## Error Handling

All endpoints return errors in a consistent format:

```typescript
interface ErrorResponse {
  status: "error";
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable error message
    details?: any; // Optional additional context
  };
  timestamp: string; // ISO 8601 timestamp
}
```

### Error Codes

| Code                | HTTP Status | Description                                |
| ------------------- | ----------- | ------------------------------------------ |
| `VALIDATION_ERROR`  | 400         | Invalid request data or malformed CSV      |
| `FILE_NOT_FOUND`    | 404         | Specified file_id doesn't exist            |
| `MODEL_NOT_TRAINED` | 400         | Prediction requested before model training |
| `ASSET_NOT_FOUND`   | 404         | Invalid or unknown asset_id                |
| `UPLOAD_FAILED`     | 500         | File upload or processing error            |
| `TRAINING_FAILED`   | 500         | Model training error                       |
| `PREDICTION_FAILED` | 500         | Prediction generation error                |
| `INTERNAL_ERROR`    | 500         | Unexpected server error                    |

### Example Error Response

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "CSV missing required column: asset_id",
    "details": {
      "found_columns": ["timestamp", "temp", "vibration"],
      "required_columns": [
        "timestamp",
        "asset_id",
        "tempF",
        "pressurePSI",
        "vibrationMM",
        "failure_flag"
      ]
    }
  },
  "timestamp": "2025-12-13T15:30:00Z"
}
```

---

## Endpoints

### POST /upload

Upload sensor CSV file and store raw data in the database.

#### Request

**Content-Type:** `multipart/form-data`

```typescript
interface UploadRequest {
  file: File; // CSV file with sensor readings
}
```

**Required CSV Columns:**

- `timestamp` - ISO 8601 datetime string
- `asset_id` - Unique asset identifier
- `tempF` - Temperature in Fahrenheit
- `pressurePSI` - Pressure in PSI
- `vibrationMM` - Vibration in millimeters
- `failure_flag` - 0 (normal) or 1 (failure/imminent failure)

**Example CSV:**

```csv
timestamp,asset_id,tempF,pressurePSI,vibrationMM,failure_flag
2025-01-10T10:00:00Z,PUMP-101,165.2,95.3,1.2,0
2025-01-10T10:05:00Z,PUMP-101,166.1,94.8,1.3,0
2025-01-10T10:00:00Z,MOTOR-307,180.5,102.1,2.8,1
```

#### Response

**Status Code:** `200 OK`

```typescript
interface UploadResponse {
  status: "success";
  file_id: string; // Unique identifier for uploaded file
  rows_ingested: number; // Number of valid rows processed
  assets_detected: number; // Number of unique assets found
  columns: string[]; // Column names from CSV
  validation_summary?: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    missing_values: number;
    outliers_detected: number;
  };
}
```

#### Example

**Request:**

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@sensor_data.csv"
```

**Response:**

```json
{
  "status": "success",
  "file_id": "file_20251213_153045",
  "rows_ingested": 1200,
  "assets_detected": 10,
  "columns": [
    "timestamp",
    "asset_id",
    "tempF",
    "pressurePSI",
    "vibrationMM",
    "failure_flag"
  ],
  "validation_summary": {
    "total_rows": 1250,
    "valid_rows": 1200,
    "invalid_rows": 50,
    "missing_values": 15,
    "outliers_detected": 8
  }
}
```

---

### POST /train

Trigger model training on uploaded sensor data.

#### Request

**Content-Type:** `application/json`

```typescript
interface TrainRequest {
  file_id: string; // File ID from /upload response
  target_column?: string; // Optional, defaults to "failure_flag"
  model_type?: "random_forest" | "xgboost"; // Optional
  hyperparameters?: {
    n_estimators?: number;
    max_depth?: number;
    min_samples_split?: number;
  };
}
```

#### Response

**Status Code:** `200 OK`

```typescript
interface TrainResponse {
  status: "trained";
  model_type: string; // e.g., "RandomForestClassifier"
  model_version: string; // Model version identifier
  training_samples: number; // Number of training examples
  validation_samples: number; // Number of validation examples

  metrics: {
    accuracy: number; // Overall accuracy (0-1)
    precision: number; // Precision score (0-1)
    recall: number; // Recall score (0-1)
    f1_score: number; // F1 score (0-1)
    roc_auc?: number; // Optional AUC score
  };

  feature_importances: Array<{
    feature: string; // Feature name
    importance: number; // Importance score (0-1)
  }>;

  trained_at: string; // ISO timestamp
}
```

#### Example

**Request:**

```bash
curl -X POST http://localhost:3000/api/train \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "file_20251213_153045",
    "target_column": "failure_flag"
  }'
```

**Response:**

```json
{
  "status": "trained",
  "model_type": "RandomForestClassifier",
  "model_version": "v1_20251213_154530",
  "training_samples": 800,
  "validation_samples": 200,
  "metrics": {
    "accuracy": 0.84,
    "precision": 0.8,
    "recall": 0.78,
    "f1_score": 0.79,
    "roc_auc": 0.88
  },
  "feature_importances": [
    { "feature": "vibration_mean_5", "importance": 0.35 },
    { "feature": "temp_std_10", "importance": 0.22 },
    { "feature": "pressure_trend", "importance": 0.18 },
    { "feature": "vibration_max_24h", "importance": 0.15 },
    { "feature": "temp_lag_1h", "importance": 0.1 }
  ],
  "trained_at": "2025-12-13T15:45:30Z"
}
```

---

### POST /predict

Generate failure risk predictions for all assets using the trained model.

#### Request

**Content-Type:** `application/json`

```typescript
interface PredictRequest {
  file_id: string; // File ID from /upload response
  asset_ids?: string[]; // Optional: predict for specific assets only
  model_version?: string; // Optional: use specific model version
}
```

#### Response

**Status Code:** `200 OK`

```typescript
interface PredictResponse {
  status: "predicted";
  model_version: string; // Model version used
  predicted_at: string; // ISO timestamp

  assets: Array<{
    asset_id: string; // Asset identifier
    p_failure: number; // Failure probability (0-1)
    risk_level: "Green" | "Yellow" | "Red"; // Risk classification
  }>;

  summary?: {
    total_assets: number;
    green: number; // Count of low-risk assets
    yellow: number; // Count of medium-risk assets
    red: number; // Count of high-risk assets
  };
}
```

**Risk Level Mapping:**

- **Green:** `p_failure < 0.3` - Low risk, normal operation
- **Yellow:** `0.3 ≤ p_failure < 0.7` - Medium risk, monitor closely
- **Red:** `p_failure ≥ 0.7` - High risk, immediate action required

#### Example

**Request:**

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "file_20251213_153045"
  }'
```

**Response:**

```json
{
  "status": "predicted",
  "model_version": "v1_20251213_154530",
  "predicted_at": "2025-12-13T16:00:00Z",
  "assets": [
    {
      "asset_id": "PUMP-101",
      "p_failure": 0.18,
      "risk_level": "Green"
    },
    {
      "asset_id": "COMP-204",
      "p_failure": 0.61,
      "risk_level": "Yellow"
    },
    {
      "asset_id": "MOTOR-307",
      "p_failure": 0.83,
      "risk_level": "Red"
    }
  ],
  "summary": {
    "total_assets": 10,
    "green": 6,
    "yellow": 2,
    "red": 2
  }
}
```

---

### GET /assets

Retrieve list of all assets with their current risk status.

#### Query Parameters

```typescript
interface AssetsQueryParams {
  risk_level?: "Green" | "Yellow" | "Red"; // Filter by risk level
  page?: number; // Page number (1-indexed)
  limit?: number; // Items per page (default: 50)
  sort?: "risk" | "id" | "probability"; // Sort order
  order?: "asc" | "desc"; // Sort direction
}
```

#### Response

**Status Code:** `200 OK`

```typescript
interface AssetsListResponse {
  assets: Array<{
    asset_id: string; // Asset identifier
    risk_level: "Green" | "Yellow" | "Red";
    p_failure: number; // Current failure probability
    last_reading: string; // ISO timestamp of last sensor reading

    // Optional metadata
    name?: string; // Asset name
    type?: string; // Asset type (e.g., "Pump", "Motor")
    location?: string; // Physical location
  }>;

  pagination: {
    total: number; // Total number of assets
    page: number; // Current page
    limit: number; // Items per page
    total_pages: number; // Total number of pages
  };
}
```

#### Example

**Request:**

```bash
# Get all assets
curl http://localhost:3000/api/assets

# Filter by risk level
curl http://localhost:3000/api/assets?risk_level=Red

# Pagination
curl http://localhost:3000/api/assets?page=2&limit=20
```

**Response:**

```json
{
  "assets": [
    {
      "asset_id": "MOTOR-307",
      "risk_level": "Red",
      "p_failure": 0.83,
      "last_reading": "2025-12-13T15:55:00Z",
      "name": "Primary Motor 307",
      "type": "Motor",
      "location": "Building A - Floor 2"
    },
    {
      "asset_id": "COMP-204",
      "risk_level": "Yellow",
      "p_failure": 0.61,
      "last_reading": "2025-12-13T15:55:00Z",
      "name": "Compressor 204",
      "type": "Compressor",
      "location": "Building B - Basement"
    },
    {
      "asset_id": "PUMP-101",
      "risk_level": "Green",
      "p_failure": 0.18,
      "last_reading": "2025-12-13T15:55:00Z",
      "name": "Water Pump 101",
      "type": "Pump",
      "location": "Building A - Utility Room"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "total_pages": 1
  }
}
```

---

### GET /assets/{id}

Retrieve detailed information for a specific asset including time-series data, feature importances, and recommendations.

#### Path Parameters

- `id` (string, required) - Asset identifier

#### Query Parameters

```typescript
interface AssetDetailQueryParams {
  hours?: number; // Number of hours of time-series data to return (default: 24)
}
```

#### Response

**Status Code:** `200 OK`

```typescript
interface AssetDetailResponse {
  asset_id: string; // Asset identifier
  risk_level: "Green" | "Yellow" | "Red";
  p_failure: number; // Current failure probability

  time_series: {
    timestamps: string[]; // ISO timestamps
    tempF: number[]; // Temperature readings
    vibrationMM: number[]; // Vibration readings
    pressurePSI: number[]; // Pressure readings
  };

  feature_importances: Array<{
    feature: string; // Feature name (e.g., "vibration_mean_5")
    importance: number; // Importance score (0-1)
    description?: string; // Human-readable feature description
  }>;

  recommendation: string; // Actionable recommendation text

  // Optional metadata
  asset_metadata?: {
    name?: string;
    type?: string;
    location?: string;
    manufacturer?: string;
    model?: string;
    installation_date?: string;
    last_maintenance?: string;
  };

  prediction_history?: Array<{
    predicted_at: string; // ISO timestamp
    p_failure: number;
    risk_level: "Green" | "Yellow" | "Red";
  }>;

  statistics?: {
    avg_temp: number;
    max_temp: number;
    avg_vibration: number;
    max_vibration: number;
    avg_pressure: number;
    readings_count: number;
  };
}
```

#### Example

**Request:**

```bash
# Get asset detail
curl http://localhost:3000/api/assets/MOTOR-307

# Get 48 hours of time-series data
curl http://localhost:3000/api/assets/MOTOR-307?hours=48
```

**Response:**

```json
{
  "asset_id": "MOTOR-307",
  "risk_level": "Red",
  "p_failure": 0.83,

  "time_series": {
    "timestamps": [
      "2025-01-10T10:00:00Z",
      "2025-01-10T10:05:00Z",
      "2025-01-10T10:10:00Z"
    ],
    "tempF": [75.2, 76.1, 77.5],
    "vibrationMM": [0.32, 0.45, 0.61],
    "pressurePSI": [98.5, 97.2, 96.8]
  },

  "feature_importances": [
    {
      "feature": "vibration_mean_5",
      "importance": 0.38,
      "description": "5-hour rolling average of vibration"
    },
    {
      "feature": "temp_trend",
      "importance": 0.27,
      "description": "Temperature rate of change over 24 hours"
    },
    {
      "feature": "pressure_std_24h",
      "importance": 0.19,
      "description": "24-hour standard deviation of pressure"
    },
    {
      "feature": "vibration_max_24h",
      "importance": 0.16,
      "description": "Maximum vibration in last 24 hours"
    }
  ],

  "recommendation": "Schedule inspection within next 3 days. Investigate increasing vibration trend and overheating risk. Consider immediate shutdown if vibration exceeds 1.0mm or temperature exceeds 200°F.",

  "asset_metadata": {
    "name": "Primary Motor 307",
    "type": "Motor",
    "location": "Building A - Floor 2",
    "manufacturer": "ACME Motors",
    "model": "PM-5000",
    "installation_date": "2020-03-15",
    "last_maintenance": "2025-11-01"
  },

  "prediction_history": [
    {
      "predicted_at": "2025-12-13T16:00:00Z",
      "p_failure": 0.83,
      "risk_level": "Red"
    },
    {
      "predicted_at": "2025-12-12T16:00:00Z",
      "p_failure": 0.68,
      "risk_level": "Yellow"
    },
    {
      "predicted_at": "2025-12-11T16:00:00Z",
      "p_failure": 0.45,
      "risk_level": "Yellow"
    }
  ],

  "statistics": {
    "avg_temp": 172.5,
    "max_temp": 185.3,
    "avg_vibration": 2.1,
    "max_vibration": 3.4,
    "avg_pressure": 98.2,
    "readings_count": 288
  }
}
```

---

## Data Models

### SensorReading

```typescript
interface SensorReading {
  id: number; // Auto-increment ID
  timestamp: string; // ISO 8601 datetime
  asset_id: string; // Asset identifier
  tempF: number; // Temperature (Fahrenheit)
  pressurePSI: number; // Pressure (PSI)
  vibrationMM: number; // Vibration (millimeters)
  failure_flag: 0 | 1; // 0 = normal, 1 = failure
  created_at: string; // Record creation timestamp
}
```

### Asset

```typescript
interface Asset {
  id: string; // Primary key (asset_id)
  name?: string; // Display name
  type?: string; // Asset type
  location?: string; // Physical location
  metadata?: {
    manufacturer?: string;
    model?: string;
    installation_date?: string;
  };
  last_updated: string; // ISO timestamp
}
```

### Prediction

```typescript
interface Prediction {
  id: number; // Auto-increment ID
  asset_id: string; // Foreign key to Asset
  probability: number; // Failure probability (0-1)
  risk_level: "Green" | "Yellow" | "Red";
  model_version: string; // Model version used
  recommendation?: string; // Generated recommendation
  predicted_at: string; // ISO timestamp
}
```

### FeatureVector

```typescript
interface FeatureVector {
  id: number; // Auto-increment ID
  asset_id: string; // Foreign key to Asset
  window_end: string; // Time window end timestamp

  // Rolling statistics
  temp_mean_24h: number;
  temp_std_24h: number;
  temp_max_24h: number;
  temp_min_24h: number;

  vibration_mean_24h: number;
  vibration_std_24h: number;
  vibration_max_24h: number;

  pressure_mean_24h: number;
  pressure_std_24h: number;

  // Lag features
  temp_lag_1h: number;
  vibration_lag_1h: number;
  pressure_lag_1h: number;

  // Trend features
  temp_trend: number; // Rate of change
  vibration_trend: number;
  pressure_trend: number;

  created_at: string; // ISO timestamp
}
```

---

## Examples

### Complete Workflow

```bash
# 1. Upload sensor data
curl -X POST http://localhost:3000/api/upload \
  -F "file=@sensor_data.csv"

# Response: { "file_id": "file_20251213_153045", ... }

# 2. Train model
curl -X POST http://localhost:3000/api/train \
  -H "Content-Type: application/json" \
  -d '{"file_id": "file_20251213_153045"}'

# Response: { "status": "trained", "metrics": {...}, ... }

# 3. Generate predictions
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"file_id": "file_20251213_153045"}'

# Response: { "status": "predicted", "assets": [...], ... }

# 4. Get all assets
curl http://localhost:3000/api/assets

# 5. Get high-risk assets only
curl http://localhost:3000/api/assets?risk_level=Red

# 6. View specific asset detail
curl http://localhost:3000/api/assets/MOTOR-307
```

### TypeScript SDK Example

```typescript
// Example client-side usage with React Query

import { useQuery, useMutation } from "@tanstack/react-query";

// Upload CSV
const useUploadCSV = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
  });
};

// Get assets list
const useAssets = (riskLevel?: string) => {
  return useQuery({
    queryKey: ["assets", riskLevel],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (riskLevel) params.set("risk_level", riskLevel);

      const response = await fetch(`/api/assets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });
};

// Get asset detail
const useAssetDetail = (assetId: string) => {
  return useQuery({
    queryKey: ["asset", assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}`);
      if (!response.ok) throw new Error("Asset not found");
      return response.json();
    },
  });
};

// Train model
const useTrainModel = () => {
  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      });

      if (!response.ok) throw new Error("Training failed");
      return response.json();
    },
  });
};
```

---

## Rate Limiting

**MVP:** No rate limiting  
**Production:** Consider implementing:

- 100 requests per minute per IP for GET endpoints
- 10 requests per minute per IP for POST endpoints

---

## Versioning

**Current Version:** v1.0.0  
**API Path:** `/api/*`

Future versions will use path-based versioning: `/api/v2/*`

---

## Support

For issues or questions:

- Check the [README.md](../README.md)
- Review [MVP_GAMEPLAN.md](../MVP_GAMEPLAN.md)
- Open an issue on the repository

---

**Last Updated:** December 13, 2025
