# 🚀 MVP Gameplan: AI Maintenance Predictor Dashboard

**Project Start Date:** December 13, 2025  
**Deployment Target:** Vercel  
**Primary Language:** TypeScript  
**Architecture:** Full-stack monorepo with separated concerns

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Phase Breakdown](#phase-breakdown)
5. [Git Workflow](#git-workflow)
6. [Data Handling Strategy](#data-handling-strategy)
7. [Development Checklist](#development-checklist)

---

## 🎯 Project Overview

### Core Objectives

- **Predictive Maintenance Dashboard** for asset monitoring and failure prediction
- **Risk-based Visualization** with color-coded accordion table (Green/Yellow/Red)
- **Expandable Asset Details** showing time-series charts and recommendations
- **CSV Data Ingestion** with validation and outlier handling
- **End-to-End TypeScript** implementation for type safety

### Success Criteria

- Upload CSV sensor data and validate against schema
- Train predictive model on historical data
- Display assets with risk-based color coding
- Expand asset rows to show detailed charts and metrics
- Generate actionable maintenance recommendations

---

## 🛠 Tech Stack

### Frontend (Vercel Deployment)

- **Framework:** Next.js 14+ (App Router with TypeScript)
- **UI Components:** Custom React components (no UI library)
- **Styling:** Plain CSS with CSS Variables (pastel color palette for risk levels)
- **Charts:** Recharts (for time-series visualization)
- **State Management:** React Query (for API data fetching)

### Backend (Vercel Serverless Functions)

- **API Routes:** Next.js API Routes (TypeScript)
- **Database:** SQLite with better-sqlite3
- **ORM:** Drizzle ORM (lightweight, TypeScript-first)
- **Validation:** Zod (schema validation for CSV uploads)

### ML/Prediction Layer

- **Initial Approach:** Python microservice or TypeScript ML library
- **Options:**
  - Python FastAPI (separate service) with scikit-learn
  - OR TensorFlow.js / ONNX.js for browser-based inference
- **Feature Store:** SQLite tables for engineered features
- **Model Storage:** File system or Vercel Blob storage

### DevOps & Tools

- **Deployment:** Vercel
- **Version Control:** Git with feature branch workflow
- **Package Manager:** npm
- **Docker:** Optional for local development consistency
- **Type Safety:** TypeScript strict mode

---

## 📁 Project Structure

```
skills-project/
├── README.md                      # Project overview and quick start
├── MVP_GAMEPLAN.md               # This file
├── techPlan.txt                  # Original technical plan
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard landing page
│   │   ├── api/                  # API routes
│   │   │   ├── upload/route.ts
│   │   │   ├── train/route.ts
│   │   │   ├── predict/route.ts
│   │   │   ├── assets/route.ts
│   │   │   └── assets/[id]/route.ts
│   │   └── assets/
│   │       └── page.tsx          # Asset list page
│   │
│   ├── components/               # React components
│   │   ├── AssetTable.tsx        # Main accordion table
│   │   ├── AssetRow.tsx          # Individual asset row
│   │   ├── AssetDetail.tsx       # Expanded detail view
│   │   ├── SensorChart.tsx       # Time-series visualization
│   │   ├── RiskBadge.tsx         # Color-coded risk indicator
│   │   ├── UploadCSV.tsx         # File upload component
│   │   └── RecommendationCard.tsx
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── db/                   # Database layer
│   │   │   ├── schema.ts         # Drizzle schema definitions
│   │   │   ├── client.ts         # SQLite client
│   │   │   └── seed.ts           # Seed data generator
│   │   ├── validation/
│   │   │   └── schemas.ts        # Zod validation schemas
│   │   ├── ml/                   # ML utilities
│   │   │   ├── features.ts       # Feature engineering
│   │   │   ├── model.ts          # Model interface/wrapper
│   │   │   └── risk-mapper.ts    # Probability → Risk level
│   │   └── utils.ts              # Generic utilities
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── sensor.ts
│   │   ├── asset.ts
│   │   └── api.ts
│   │
│   └── styles/
│       ├── globals.css           # Global styles & CSS variables
│       └── components.css        # Component-specific styles
│
├── ml-service/                   # Optional: Python ML microservice
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                   # FastAPI app
│   ├── models/
│   │   ├── trainer.py
│   │   └── predictor.py
│   └── features/
│       └── engineering.py
│
├── data/                         # Local development data
│   ├── seeds/                    # Generated seed CSVs
│   │   └── sample-sensors.csv
│   └── uploads/                  # Uploaded CSV storage
│
├── docs/                         # Documentation
│   ├── API.md                    # API endpoint documentation
│   ├── DATA_SCHEMA.md            # Database and CSV schema
│   ├── DEVELOPMENT.md            # Development guide
│   └── DEPLOYMENT.md             # Deployment instructions
│
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

---

## 🗺 Phase Breakdown

### **Phase 0: Project Initialization**

**Branch:** `main` → Initial setup  
**Duration:** 2-3 hours

#### Tasks

- [ ] Initialize Next.js project with TypeScript ✅
- [ ] Setup CSS with custom variables and pastel colors ✅
- [ ] Configure SQLite + Drizzle ORM
- [ ] Setup project structure and base configuration
- [ ] Create initial README with setup instructions
- [ ] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] Create seed data generator script

#### Deliverables

```bash
git add .
git commit -m "chore: initialize Next.js project with TypeScript and base configuration"
```

---

### **Phase 1: Database Layer & Schema**

**Branch:** `feature/database-schema`  
**Duration:** 3-4 hours

#### Tasks

- [ ] Define Drizzle schema based on techPlan.txt interface
  - `sensor_readings` table
  - `assets` table
  - `predictions` table
  - `feature_store` table
- [ ] Create migration scripts
- [ ] Implement database client and connection management
- [ ] Build seed data generator for mock sensor readings
- [ ] Create helper functions for CRUD operations
- [ ] Write unit tests for database operations

#### Schema Design (TypeScript)

```typescript
// src/lib/db/schema.ts
export const sensorReadings = sqliteTable("sensor_readings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp").notNull(),
  assetId: text("asset_id").notNull(),
  tempF: real("temp_f").notNull(),
  pressurePSI: real("pressure_psi").notNull(),
  vibrationMM: real("vibration_mm").notNull(),
  failureFlag: integer("failure_flag").notNull(), // 0 or 1
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),
  location: text("location"),
  lastUpdated: integer("last_updated", { mode: "timestamp" }),
});

export const predictions = sqliteTable("predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id").notNull(),
  probability: real("probability").notNull(),
  riskLevel: text("risk_level").notNull(), // 'green' | 'yellow' | 'red'
  recommendation: text("recommendation"),
  predictedAt: integer("predicted_at", { mode: "timestamp" }).defaultNow(),
});
```

#### Deliverables

```bash
git add .
git commit -m "feat(db): implement SQLite schema with Drizzle ORM and seed generator"
git push origin feature/database-schema
# Create PR → Review → Merge to main
```

---

### **Phase 2: Data Ingestion & Validation**

**Branch:** `feature/csv-upload-validation`  
**Duration:** 4-5 hours

#### Tasks

- [ ] Create Zod schemas for CSV validation
- [ ] Implement `/api/upload` endpoint
  - CSV parsing (using papaparse or csv-parser)
  - Schema validation
  - Missing value detection and handling
  - Outlier detection (z-score or IQR method)
  - Data normalization
- [ ] Store validated data in `sensor_readings` table
- [ ] Create upload UI component
- [ ] Add file upload progress indicator
- [ ] Implement error handling and user feedback
- [ ] Write integration tests for upload flow

#### Validation Strategy

```typescript
// src/lib/validation/schemas.ts
import { z } from "zod";

export const SensorReadingSchema = z.object({
  timestamp: z.string().datetime(),
  asset_id: z.string().min(1),
  tempF: z.number().min(-50).max(500),
  pressurePSI: z.number().min(0).max(10000),
  vibrationMM: z.number().min(0).max(100),
  failure_flag: z.number().int().min(0).max(1),
});

export const CSVUploadSchema = z.array(SensorReadingSchema);
```

#### Missing Data Handling

- **Strategy 1:** Forward-fill for temporal data
- **Strategy 2:** Drop rows with >50% missing values
- **Strategy 3:** Flag for manual review

#### Outlier Detection

- Use z-score threshold (|z| > 3) or IQR method
- Log outliers for review but don't auto-remove
- Create `data_quality` table to track issues

#### Deliverables

```bash
git add .
git commit -m "feat(api): implement CSV upload with validation and outlier detection"
git push origin feature/csv-upload-validation
```

---

### **Phase 3: Feature Engineering Layer**

**Branch:** `feature/feature-engineering`  
**Duration:** 5-6 hours

#### Tasks

- [ ] Implement time-series feature extraction
  - Rolling statistics (mean, std, min, max)
  - Lag features (t-1, t-2, t-24)
  - Rate of change
  - Moving averages
- [ ] Create feature storage table
- [ ] Build feature engineering pipeline
- [ ] Implement per-asset feature aggregation
- [ ] Add feature versioning
- [ ] Write unit tests for feature functions

#### Feature Engineering Logic

```typescript
// src/lib/ml/features.ts
interface TimeSeriesFeatures {
  asset_id: string;
  window_end: string;

  // Rolling statistics (24hr window)
  temp_mean_24h: number;
  temp_std_24h: number;
  temp_max_24h: number;
  temp_min_24h: number;

  pressure_mean_24h: number;
  pressure_std_24h: number;

  vibration_mean_24h: number;
  vibration_std_24h: number;

  // Lag features
  temp_lag_1h: number;
  pressure_lag_1h: number;
  vibration_lag_1h: number;

  // Rate of change
  temp_roc_24h: number;
  pressure_roc_24h: number;
  vibration_roc_24h: number;

  // Target
  failure_flag: number;
}
```

#### Deliverables

```bash
git add .
git commit -m "feat(ml): implement time-series feature engineering pipeline"
git push origin feature/feature-engineering
```

---

### **Phase 4: ML Model Layer**

**Branch:** `feature/ml-prediction-model`  
**Duration:** 6-8 hours

#### Decision Point: Python vs TypeScript ML

**Option A: Python Microservice (Recommended for MVP)**

- FastAPI service with scikit-learn
- Better ML ecosystem and libraries
- Can run locally or as separate Vercel function
- Use joblib for model persistence

**Option B: TypeScript ML**

- TensorFlow.js or ONNX.js
- Fully integrated with Next.js
- May have performance limitations

**Selected: Option A for MVP**

#### Tasks

- [ ] Setup Python environment (if not using TypeScript)
- [ ] Implement `/api/train` endpoint
  - Load feature data
  - Train Random Forest or XGBoost
  - Save model to file system or Vercel Blob
  - Return training metrics
- [ ] Implement `/api/predict` endpoint
  - Load trained model
  - Generate predictions for all assets
  - Map probabilities to risk levels
  - Store in `predictions` table
- [ ] Create risk mapping logic (Green/Yellow/Red)
- [ ] Add model versioning
- [ ] Write tests for prediction accuracy

#### Risk Mapping Thresholds

```typescript
// src/lib/ml/risk-mapper.ts
export function mapProbabilityToRisk(probability: number): RiskLevel {
  if (probability < 0.3) return "green";
  if (probability < 0.7) return "yellow";
  return "red";
}

export function generateRecommendation(
  riskLevel: RiskLevel,
  features: TimeSeriesFeatures
): string {
  const recommendations = {
    green: "Asset operating normally. Continue routine monitoring.",
    yellow: "Elevated risk detected. Schedule inspection within 7 days.",
    red: "High failure risk. Immediate inspection and maintenance required.",
  };

  return recommendations[riskLevel];
}
```

#### Deliverables

```bash
git add .
git commit -m "feat(ml): implement training and prediction endpoints with risk mapping"
git push origin feature/ml-prediction-model
```

---

### **Phase 5: API Layer**

**Branch:** `feature/api-endpoints`  
**Duration:** 4-5 hours

#### Tasks

- [ ] Implement `/api/upload` (POST) - Upload sensor CSV and store raw data
- [ ] Implement `/api/train` (POST) - Trigger model training on available data
- [ ] Implement `/api/predict` (POST) - Predict risk for assets using trained model
- [ ] Implement `/api/assets` (GET) - List all assets with current risk
- [ ] Implement `/api/assets/[id]` (GET) - Asset detail with time-series and recommendations
- [ ] Add error handling and validation for all endpoints
- [ ] Create comprehensive API documentation
- [ ] Write integration tests for all endpoints

#### API Specifications

##### POST /api/upload

**Purpose:** Upload sensor CSV and store raw data

**Request:**

```typescript
// Content-Type: multipart/form-data
interface UploadRequest {
  file: File; // sensor_data.csv
}
```

**Response:**

```typescript
interface UploadResponse {
  status: "success" | "error";
  file_id: string; // e.g., "file_001"
  rows_ingested: number; // e.g., 1200
  assets_detected: number; // e.g., 10
  columns: string[]; // ["timestamp", "asset_id", "temp", "vibration", "pressure", "label"]
  message?: string; // Optional error message
}
```

**Implementation Notes:**

- Parse CSV with validation against schema
- Store in `sensor_readings` table
- Auto-detect and create assets in `assets` table
- Handle missing values and outliers
- Return file tracking ID for subsequent operations

---

##### POST /api/train

**Purpose:** Trigger model training on available data

**Request:**

```typescript
interface TrainRequest {
  file_id: string; // e.g., "file_001"
  target_column?: string; // Optional, defaults to "failure_flag"
}
```

**Response:**

```typescript
interface TrainResponse {
  status: "trained" | "error";
  model_type: string; // e.g., "RandomForestClassifier"
  training_samples: number; // e.g., 800
  validation_samples: number; // e.g., 200
  metrics: {
    accuracy: number; // e.g., 0.84
    precision: number; // e.g., 0.80
    recall: number; // e.g., 0.78
    f1_score?: number; // Optional
  };
  feature_importances: Array<{
    feature: string; // e.g., "vibration_mean_5"
    importance: number; // e.g., 0.35
  }>;
  model_version?: string; // Optional version tracking
  message?: string; // Optional error message
}
```

**Implementation Notes:**

- Load data by file_id from database
- Run feature engineering pipeline
- Train model (Random Forest or XGBoost)
- Perform train/test split (80/20)
- Calculate evaluation metrics
- Save model to file system or Vercel Blob
- Store metadata in database

---

##### POST /api/predict

**Purpose:** Predict risk for assets using the trained model

**Request:**

```typescript
interface PredictRequest {
  file_id: string; // e.g., "file_001"
  asset_ids?: string[]; // Optional: predict specific assets only
}
```

**Response:**

```typescript
interface PredictResponse {
  status: 'predicted' | 'error';
  assets: Array<{
    asset_id: string;       // e.g., "PUMP-101"
    p_failure: number;      // e.g., 0.18 (probability 0-1)
    risk_level: 'Green' | 'Yellow' | 'Red';
  }>;
  model_version?: string;
  predicted_at: string;     // ISO timestamp
  message?: string;
}

// Example response:
{
  "status": "predicted",
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
  ]
}
```

**Implementation Notes:**

- Load trained model from storage
- Extract features for requested assets
- Generate predictions
- Map probabilities to risk levels:
  - Green: p < 0.3
  - Yellow: 0.3 ≤ p < 0.7
  - Red: p ≥ 0.7
- Store predictions in `predictions` table
- Return results with risk levels

---

##### GET /api/assets

**Purpose:** Return list of assets and their risk status

**Query Parameters:**

```typescript
interface AssetsQueryParams {
  risk_level?: "Green" | "Yellow" | "Red"; // Filter by risk
  page?: number; // Pagination
  limit?: number; // Items per page
  sort?: "risk" | "id" | "probability"; // Sort order
}
```

**Response:**

```typescript
interface AssetsListResponse {
  assets: Array<{
    asset_id: string;       // e.g., "PUMP-101"
    risk_level: 'Green' | 'Yellow' | 'Red';
    p_failure: number;      // e.g., 0.18
    last_reading?: string;  // ISO timestamp of last sensor reading
    name?: string;          // Optional asset name
    type?: string;          // Optional asset type
  }>;
  total?: number;           // Total count for pagination
  page?: number;
  limit?: number;
}

// Example response:
{
  "assets": [
    {
      "asset_id": "PUMP-101",
      "risk_level": "Green",
      "p_failure": 0.18
    },
    {
      "asset_id": "COMP-204",
      "risk_level": "Yellow",
      "p_failure": 0.61
    },
    {
      "asset_id": "MOTOR-307",
      "risk_level": "Red",
      "p_failure": 0.83
    }
  ]
}
```

**Implementation Notes:**

- Join `assets` with latest `predictions`
- Support filtering by risk level
- Implement pagination
- Sort by risk (Red → Yellow → Green) by default
- Return empty array if no predictions exist

---

##### GET /api/assets/[id]

**Purpose:** Return detailed view of a single asset

**Response:**

```typescript
interface AssetDetailResponse {
  asset_id: string;         // e.g., "MOTOR-307"
  risk_level: 'Green' | 'Yellow' | 'Red';
  p_failure: number;        // e.g., 0.83

  time_series: {
    timestamps: string[];   // ISO timestamps
    temp: number[];         // Temperature readings
    vibration: number[];    // Vibration readings
    pressure?: number[];    // Optional pressure readings
  };

  feature_importances: Array<{
    feature: string;        // e.g., "vibration_mean_5"
    importance: number;     // e.g., 0.38
  }>;

  recommendation: string;   // Generated recommendation text

  // Optional metadata
  asset_metadata?: {
    name?: string;
    type?: string;
    location?: string;
    last_maintenance?: string;
  };

  prediction_history?: Array<{
    predicted_at: string;
    p_failure: number;
    risk_level: string;
  }>;
}

// Example response:
{
  "asset_id": "MOTOR-307",
  "risk_level": "Red",
  "p_failure": 0.83,
  "time_series": {
    "timestamps": ["2025-01-10T10:00:00Z", "2025-01-10T10:05:00Z", "..."],
    "temp": [75.2, 76.1, 77.5],
    "vibration": [0.32, 0.45, 0.61]
  },
  "feature_importances": [
    { "feature": "vibration_mean_5", "importance": 0.38 },
    { "feature": "temp_trend", "importance": 0.27 }
  ],
  "recommendation": "Schedule inspection within next 3 days. Investigate increasing vibration trend and overheating risk."
}
```

**Implementation Notes:**

- Query sensor readings for specific asset_id
- Include last N hours/days of time-series data
- Join with latest prediction
- Generate recommendation based on risk level and trending features
- Return feature importances from model (global or SHAP values)
- Handle case where asset has no data or predictions

---

#### Error Handling

All endpoints should return consistent error format:

```typescript
interface ErrorResponse {
  status: "error";
  error: {
    code: string; // e.g., "VALIDATION_ERROR"
    message: string; // Human-readable message
    details?: any; // Optional additional context
  };
  timestamp: string; // ISO timestamp
}

// Example error codes:
// - VALIDATION_ERROR: Invalid request data
// - FILE_NOT_FOUND: file_id doesn't exist
// - MODEL_NOT_TRAINED: Predict called before train
// - ASSET_NOT_FOUND: Invalid asset_id
// - INTERNAL_ERROR: Server error
```

#### Deliverables

```bash
git add .
git commit -m "feat(api): implement all endpoints per API specification"
git push origin feature/api-endpoints
```

---

### **Phase 6: UI Components**

**Branch:** `feature/ui-components`  
**Duration:** 6-8 hours

#### Tasks

- [ ] Create custom accordion component with CSS
- [ ] Implement pastel color palette with CSS variables
- [ ] Create `AssetTable` with Accordion design
- [ ] Build `AssetRow` with color-coded risk
- [ ] Implement `AssetDetail` expandable view
- [ ] Create `SensorChart` with Recharts
- [ ] Build `RiskBadge` component
- [ ] Add `UploadCSV` component
- [ ] Create `RecommendationCard`
- [ ] Implement loading states and skeletons
- [ ] Add responsive design
- [ ] Write component tests

#### Color Palette (Pastel) - CSS Variables

The pastel color palette is defined in `src/app/globals.css`:

```css
:root {
  /* Pastel Risk Colors - Green */
  --risk-green-50: #f0fdf4;
  --risk-green-100: #dcfce7;
  --risk-green-200: #bbf7d0;
  --risk-green: #86efac;
  --risk-green-dark: #4ade80;

  /* Pastel Risk Colors - Yellow */
  --risk-yellow-50: #fefce8;
  --risk-yellow-100: #fef9c3;
  --risk-yellow-200: #fef08a;
  --risk-yellow: #fde047;
  --risk-yellow-dark: #facc15;

  /* Pastel Risk Colors - Red */
  --risk-red-50: #fef2f2;
  --risk-red-100: #fee2e2;
  --risk-red-200: #fecaca;
  --risk-red: #fca5a5;
  --risk-red-dark: #f87171;
}
```

**Usage in CSS:**

```css
.accordion-item.risk-green {
  background: var(--risk-green-50);
}

.risk-badge.red {
  background: var(--risk-red);
  color: #991b1b;
}
```

#### Deliverables

```bash
git add .
git commit -m "feat(ui): implement accordion asset table with expandable detail views"
git push origin feature/ui-components
```

---

### **Phase 7: Dashboard Integration**

**Branch:** `feature/dashboard-page`  
**Duration:** 4-5 hours

#### Tasks

- [ ] Create main dashboard page
- [ ] Integrate `UploadCSV` component
- [ ] Add train model button/workflow
- [ ] Integrate `AssetTable` with API data
- [ ] Implement risk filter tabs (All/Green/Yellow/Red)
- [ ] Add search functionality for assets
- [ ] Create data refresh mechanism
- [ ] Add error boundaries
- [ ] Implement optimistic updates
- [ ] Write E2E tests

#### Deliverables

```bash
git add .
git commit -m "feat(dashboard): integrate components into main dashboard page"
git push origin feature/dashboard-page
```

---

### **Phase 8: Documentation & Polish**

**Branch:** `feature/documentation`  
**Duration:** 3-4 hours

#### Tasks

- [ ] Write comprehensive README.md
  - Project overview
  - Setup instructions
  - Environment variables
  - Running locally
  - Deployment to Vercel
- [ ] Create API.md documentation
  - All endpoints with examples
  - Request/response formats
  - Error codes
- [ ] Write DATA_SCHEMA.md
  - Database schema
  - CSV format requirements
  - Feature descriptions
- [ ] Create DEVELOPMENT.md
  - Development workflow
  - Git branching strategy
  - Testing guidelines
  - Code style guide
- [ ] Add inline code comments
- [ ] Generate TypeScript documentation
- [ ] Create deployment guide
- [ ] Add contributing guidelines

#### Deliverables

```bash
git add .
git commit -m "docs: add comprehensive documentation for project setup and usage"
git push origin feature/documentation
```

---

## 🌳 Git Workflow

### Branch Strategy

```
main (protected)
  ├── feature/database-schema
  ├── feature/csv-upload-validation
  ├── feature/feature-engineering
  ├── feature/ml-prediction-model
  ├── feature/api-endpoints
  ├── feature/ui-components
  ├── feature/dashboard-page
  └── feature/documentation
```

### Commit Convention

Using conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Workflow Example

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/api-endpoints

# Make changes and commit
git add .
git commit -m "feat(api): implement assets list endpoint with pagination"

# Push to remote
git push origin feature/api-endpoints

# Create Pull Request on GitHub
# After review and approval, merge to main
# Delete feature branch

git checkout main
git pull origin main
git branch -d feature/api-endpoints
```

### Protection Rules

- Require PR review before merging to `main`
- Require status checks to pass (tests, linting)
- No direct commits to `main`

---

## 📊 Data Handling Strategy

### CSV Upload Flow

```
1. User selects CSV file
2. Frontend validates file format
3. POST to /api/upload
4. Backend parses CSV
5. Validate against Zod schema
6. Detect missing values
   ├─ < 25% missing → Forward fill
   ├─ 25-50% missing → Flag for review
   └─ > 50% missing → Reject row
7. Detect outliers (z-score)
   ├─ Flag outliers in data_quality table
   └─ Include in dataset with flag
8. Insert into sensor_readings table
9. Update assets table
10. Return upload summary
```

### Missing Data Strategy

| Scenario                    | Action                             |
| --------------------------- | ---------------------------------- |
| Missing timestamp           | Reject row                         |
| Missing asset_id            | Reject row                         |
| Missing sensor value (1-2)  | Forward fill from previous reading |
| Missing sensor values (all) | Reject row                         |
| Missing failure_flag        | Default to 0 (normal)              |

### Outlier Handling

```typescript
// src/lib/validation/outliers.ts
interface OutlierDetection {
  method: "z-score" | "iqr";
  threshold: number;
}

function detectOutliers(values: number[], config: OutlierDetection): boolean[] {
  if (config.method === "z-score") {
    const mean = avg(values);
    const std = standardDeviation(values);
    return values.map((v) => Math.abs((v - mean) / std) > config.threshold);
  }
  // IQR method implementation...
}
```

### Seed Data Generation

```typescript
// src/lib/db/seed.ts
import { faker } from "@faker-js/faker";

function generateSensorReadings(
  assetCount: number = 10,
  readingsPerAsset: number = 1000
): SensorReading[] {
  const readings: SensorReading[] = [];

  for (let a = 0; a < assetCount; a++) {
    const assetId = `ASSET-${String(a + 1).padStart(3, "0")}`;
    const baseTemp = faker.number.float({ min: 150, max: 180 });
    const basePressure = faker.number.float({ min: 80, max: 120 });
    const baseVibration = faker.number.float({ min: 0.5, max: 2.0 });

    let failureCountdown = faker.number.int({ min: 800, max: 950 });

    for (let i = 0; i < readingsPerAsset; i++) {
      const timestamp = new Date(
        Date.now() - (readingsPerAsset - i) * 60 * 1000
      ).toISOString();

      // Simulate gradual degradation
      const degradationFactor = i / failureCountdown;
      const isNearFailure = i >= failureCountdown;

      readings.push({
        timestamp,
        asset_id: assetId,
        tempF:
          baseTemp +
          (isNearFailure
            ? faker.number.float({ min: 10, max: 30 })
            : faker.number.float({ min: -5, max: 5 })),
        pressurePSI:
          basePressure +
          (isNearFailure
            ? faker.number.float({ min: -20, max: -10 })
            : faker.number.float({ min: -5, max: 5 })),
        vibrationMM:
          baseVibration +
          (isNearFailure
            ? faker.number.float({ min: 2, max: 5 })
            : faker.number.float({ min: -0.2, max: 0.2 })),
        failure_flag: isNearFailure ? 1 : 0,
      });
    }
  }

  return readings;
}
```

---

## ✅ Development Checklist

### Setup Phase

- [ ] Initialize Next.js project
- [ ] Install dependencies (Shadcn, Drizzle, etc.)
- [ ] Configure TypeScript strict mode
- [ ] Setup SQLite database
- [ ] Create project structure
- [ ] Generate seed data
- [ ] Setup Git repository

### Backend Development

- [ ] Database schema implementation
- [ ] Seed script
- [ ] CSV upload endpoint
- [ ] Data validation with Zod
- [ ] Missing data handling
- [ ] Outlier detection
- [ ] Feature engineering pipeline
- [ ] Model training endpoint
- [ ] Prediction endpoint
- [ ] Assets list endpoint
- [ ] Asset detail endpoint

### Frontend Development

- [ ] Shadcn setup
- [ ] Color palette configuration
- [ ] Upload CSV component
- [ ] Asset accordion table
- [ ] Risk badge component
- [ ] Expandable asset detail
- [ ] Time-series charts (Recharts)
- [ ] Recommendation card
- [ ] Main dashboard page
- [ ] Loading states
- [ ] Error handling

### ML Layer

- [ ] Feature extraction functions
- [ ] Model training pipeline
- [ ] Model persistence
- [ ] Prediction inference
- [ ] Risk level mapping
- [ ] Recommendation generation

### Testing

- [ ] Unit tests for utilities
- [ ] Integration tests for APIs
- [ ] Component tests
- [ ] E2E tests for critical flows

### Documentation

- [ ] README.md
- [ ] API.md
- [ ] DATA_SCHEMA.md
- [ ] DEVELOPMENT.md
- [ ] DEPLOYMENT.md
- [ ] Inline code documentation

### Deployment

- [ ] Configure Vercel project
- [ ] Setup environment variables
- [ ] Database migration strategy
- [ ] Deploy to staging
- [ ] Test deployed application
- [ ] Deploy to production

---

## 🐳 Docker Consideration (Optional)

Since you mentioned Docker compatibility, here's a lightweight approach:

### Docker for Local Development Only

```dockerfile
# Dockerfile (for local dev)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Development server
CMD ["pnpm", "dev"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

**Recommendation:** Skip Docker for MVP and add later if team needs development environment consistency.

---

## 📈 Next Steps

### Immediate Actions (Next 1-2 Days)

1. Review and approve this gameplan
2. Initialize the Next.js project (Phase 0)
3. Setup database schema and seed data (Phase 1)
4. Begin CSV upload validation (Phase 2)

### Week 1 Goals

- Complete Phases 0-3 (Setup, DB, Upload, Features)
- Have working CSV ingestion with validation
- Store data in SQLite

### Week 2 Goals

- Complete Phases 4-5 (ML Model, API)
- Train and test prediction model
- Build all API endpoints

### Week 3 Goals

- Complete Phases 6-7 (UI, Dashboard)
- Full frontend implementation
- End-to-end integration

### Week 4 Goals

- Complete Phase 8 (Documentation)
- Testing and bug fixes
- Deploy to Vercel
- Gather feedback

---

## 📞 Questions & Decisions Needed

1. **ML Service Architecture:**

   - Python microservice or TypeScript ML library?
   - **Recommendation:** Python FastAPI for better ML ecosystem

2. **Model Storage:**

   - File system or Vercel Blob storage?
   - **Recommendation:** Start with file system, migrate to Blob if needed

3. **Authentication:**

   - Include in MVP or defer?
   - **Recommendation:** Defer to post-MVP

4. **Real-time Updates:**

   - WebSocket for live asset monitoring?
   - **Recommendation:** Defer to post-MVP, use polling initially

5. **Dataset Size:**
   - How many assets and readings in seed data?
   - **Recommendation:** 10 assets, 1000 readings each (10K total rows)

---

## 🎯 Success Metrics for MVP

- [ ] Upload CSV file and validate successfully
- [ ] View 10+ seeded assets in accordion table
- [ ] Expand asset row to see time-series chart
- [ ] See color-coded risk levels (Green/Yellow/Red)
- [ ] Read actionable recommendation for high-risk asset
- [ ] Train model on uploaded data
- [ ] Generate predictions for all assets
- [ ] Filter assets by risk level
- [ ] Deploy to Vercel and access publicly

---

**Ready to begin? Let's start with Phase 0! 🚀**
