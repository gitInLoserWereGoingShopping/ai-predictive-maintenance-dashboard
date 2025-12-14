# Architecture Overview

## 🏗️ Application Architecture

This document explains how the different layers of the application work together.

---

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  React Components (pages, UI components)       │    │
│  │  - Upload form                                  │    │
│  │  - Asset table                                  │    │
│  │  - Asset detail view                            │    │
│  └────────────────────────────────────────────────┘    │
│                          ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  React Query (Data Fetching)                   │    │
│  │  - useQuery, useMutation hooks                 │    │
│  │  - Caching, refetching, optimistic updates     │    │
│  └────────────────────────────────────────────────┘    │
│                          ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Fetch API / Axios                             │    │
│  │  - HTTP requests to /api/* endpoints           │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 SERVER (Next.js)                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  API Route Handlers (app/api/*)                │    │
│  │  - POST /api/upload                            │    │
│  │  - GET /api/assets                             │    │
│  │  - POST /api/train                             │    │
│  └────────────────────────────────────────────────┘    │
│                          ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Database Helpers (lib/db/helpers/*)           │    │
│  │  - createAsset()                               │    │
│  │  - getAllAssets()                              │    │
│  │  - insertSensorReadings()                      │    │
│  └────────────────────────────────────────────────┘    │
│                          ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Drizzle ORM (lib/db/client.ts)                │    │
│  │  - Type-safe queries                           │    │
│  │  - Database schema validation                  │    │
│  └────────────────────────────────────────────────┘    │
│                          ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  SQLite Database (data/maintenance.db)         │    │
│  │  - assets, sensor_readings, predictions        │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: Uploading a CSV

### 1. **User Action (Client)**

```tsx
// Component: src/app/upload/UploadForm.tsx
import { useMutation } from "@tanstack/react-query";

function UploadForm() {
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      console.log(`Uploaded ${data.rows_ingested} rows`);
    },
  });

  return (
    <input
      type="file"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          uploadMutation.mutate(e.target.files[0]);
        }
      }}
    />
  );
}
```

### 2. **API Route Handler (Server)**

```typescript
// File: src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { createUploadedFile } from "@/lib/db/helpers/files";
import { createAsset } from "@/lib/db/helpers/assets";
import { insertSensorReadings } from "@/lib/db/helpers/readings";

export async function POST(request: NextRequest) {
  // 1. Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // 2. Validate and parse CSV
  const csvData = await parseCSV(file);

  // 3. Use database helpers
  const uploadedFile = await createUploadedFile({
    fileName: file.name,
    rowCount: csvData.length,
    assetCount: uniqueAssets.size,
    status: "processing",
  });

  // 4. Create assets
  for (const assetId of uniqueAssets) {
    await createAsset({
      id: assetId,
      name: `Asset ${assetId}`,
      type: determineAssetType(assetId),
    });
  }

  // 5. Insert sensor readings (batched)
  await insertSensorReadings(csvData);

  // 6. Return response
  return Response.json({
    status: "success",
    file_id: uploadedFile.id,
    rows_ingested: csvData.length,
  });
}
```

### 3. **Database Helper (Server)**

```typescript
// File: src/lib/db/helpers/readings.ts
import { db } from "@/lib/db/client";
import { sensorReadings } from "@/lib/db/schema";

export async function insertSensorReadings(readings) {
  // Batch insert for performance (100 rows at a time)
  for (let i = 0; i < readings.length; i += 100) {
    const batch = readings.slice(i, i + 100);
    await db.insert(sensorReadings).values(batch);
  }

  return { inserted: readings.length };
}
```

### 4. **Drizzle ORM → SQLite**

```sql
-- SQL executed by Drizzle:
INSERT INTO sensor_readings
  (asset_id, timestamp, tempF, pressurePSI, vibrationMM, failure_flag)
VALUES
  ('PUMP-303', '2025-01-10T10:00:00Z', 165.2, 95.3, 1.2, 0),
  ('PUMP-303', '2025-01-10T10:05:00Z', 166.1, 94.8, 1.3, 0),
  -- ... more rows
```

---

## React Query Integration Patterns

### Fetching Assets List

```tsx
// Component: src/app/dashboard/AssetTable.tsx
import { useQuery } from "@tanstack/react-query";

function AssetTable() {
  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="accordion">
      {assets?.map((asset) => (
        <AssetRow key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
```

### Fetching Single Asset Details

```tsx
// Component: src/app/assets/[id]/AssetDetail.tsx
import { useQuery } from "@tanstack/react-query";

function AssetDetail({ assetId }: { assetId: string }) {
  const { data: assetData } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: async () => {
      const res = await fetch(`/api/assets/${assetId}`);
      return res.json();
    },
    enabled: !!assetId, // Only fetch when assetId exists
  });

  return (
    <div>
      <h1>{assetData?.asset.name}</h1>
      <div className={`recommendation-card ${assetData?.prediction.riskLevel}`}>
        {assetData?.prediction.recommendation}
      </div>
      <SensorChart data={assetData?.readings} />
    </div>
  );
}
```

### Mutation with Cache Invalidation

```tsx
// Component: src/app/upload/UploadForm.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

function UploadForm() {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate assets cache to refetch with new data
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  return <FileUpload onUpload={uploadMutation.mutate} />;
}
```

---

## Key Architectural Principles

### ✅ **Server-Only Database Access**

- Database helpers NEVER run in the browser
- Only Next.js API routes can call database helpers
- SQLite and better-sqlite3 are Node.js only
- Client components use fetch/React Query to call API routes

### ✅ **Type Safety**

- TypeScript interfaces shared between client and server
- Drizzle generates types from database schema
- Zod validates data at API boundaries

### ✅ **Separation of Concerns**

```
Client Components    → UI logic, user interactions
React Query          → Data fetching, caching, sync
API Routes           → Request validation, business logic
Database Helpers     → Database operations, queries
Drizzle ORM          → SQL generation, type safety
SQLite               → Data storage
```

### ✅ **Performance Optimizations**

- React Query caching reduces unnecessary requests
- Database helpers use batch inserts (100 rows at a time)
- Drizzle prepared statements for repeated queries
- SQLite WAL mode for concurrent reads

### ✅ **Error Handling**

```typescript
// API Route
try {
  const asset = await getAssetById(id);
  if (!asset) {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }
  return Response.json(asset);
} catch (error) {
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

// Client Component
const { data, error, isLoading } = useQuery({
  queryKey: ["asset", id],
  queryFn: fetchAsset,
  retry: 3, // Auto retry failed requests
});

if (error) return <ErrorMessage />;
```

---

## File Organization

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (server-side)
│   │   ├── upload/route.ts       # POST /api/upload
│   │   ├── assets/route.ts       # GET /api/assets
│   │   └── assets/[id]/route.ts  # GET /api/assets/:id
│   ├── dashboard/                # Dashboard page (client)
│   ├── assets/[id]/              # Asset detail page (client)
│   └── layout.tsx                # Root layout
│
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Database schema
│   │   ├── client.ts             # Drizzle connection
│   │   └── helpers/              # Database helpers (server-only)
│   │       ├── assets.ts
│   │       ├── readings.ts
│   │       ├── predictions.ts
│   │       ├── files.ts
│   │       └── quality.ts
│   │
│   └── hooks/                    # React Query hooks (client)
│       ├── useAssets.ts
│       ├── useAsset.ts
│       └── useUpload.ts
│
├── components/                   # React components (client)
│   ├── AssetTable.tsx
│   ├── AssetDetail.tsx
│   └── UploadForm.tsx
│
└── styles/
    ├── globals.css
    └── components.css
```

---

## Next Steps

1. **Phase 1**: Implement database helpers
2. **Phase 2**: Create API route handlers
3. **Phase 3**: Build React Query hooks
4. **Phase 4**: Create UI components
5. **Phase 5**: Connect everything together

Each layer builds on the previous one, maintaining clear separation and testability.
