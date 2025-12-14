/**
 * Sensor Reading Operations Database Helpers
 *
 * Handles sensor data ingestion and retrieval for time-series analysis.
 * Used by: POST /api/upload, GET /api/assets/:id
 */

import { db } from "../client";
import { sensorReadings } from "../schema";
import { eq, desc, asc, and, gte, lte } from "drizzle-orm";

/**
 * Bulk insert sensor readings with batching for performance
 *
 * @param readings - Array of sensor readings
 * @returns Number of readings inserted
 *
 * @example
 * const result = await insertSensorReadings([
 *   {
 *     assetId: 'PUMP-303',
 *     timestamp: '2025-01-10T10:00:00Z',
 *     tempF: 165.2,
 *     pressurePSI: 95.3,
 *     vibrationMM: 1.2,
 *     failureFlag: 0,
 *   },
 *   // ... more readings
 * ]);
 * console.log(`Inserted ${result.inserted} readings`);
 */
export async function insertSensorReadings(
  readings: Array<{
    assetId: string;
    timestamp: string;
    tempF: number;
    pressurePSI: number;
    vibrationMM: number;
    failureFlag: number;
  }>
) {
  const batchSize = 100;
  let totalInserted = 0;

  // Insert in batches for better performance
  for (let i = 0; i < readings.length; i += batchSize) {
    const batch = readings.slice(i, i + batchSize);

    await db.insert(sensorReadings).values(batch);
    totalInserted += batch.length;
  }

  return { inserted: totalInserted };
}

/**
 * Get all sensor readings for an asset
 *
 * @param assetId - Asset ID
 * @param options - Query options (limit, offset, ordering). Default limit is 1000 readings.
 * @returns Array of sensor readings
 *
 * @example
 * // Get latest 500 readings
 * const readings = await getReadingsByAssetId('PUMP-303', {
 *   limit: 500,
 *   orderBy: 'desc'
 * });
 *
 * // Get readings with pagination (default limit: 1000)
 * const page2 = await getReadingsByAssetId('PUMP-303', {
 *   limit: 100,
 *   offset: 100,
 *   orderBy: 'asc'
 * });
 *
 * // Get all readings with default 1000 limit
 * const allReadings = await getReadingsByAssetId('PUMP-303');
 */
export async function getReadingsByAssetId(
  assetId: string,
  options?: {
    limit?: number; // Default: 1000
    offset?: number;
    orderBy?: "asc" | "desc";
  }
) {
  const limit = options?.limit || 1000;
  const offset = options?.offset || 0;
  const orderBy = options?.orderBy || "desc";

  const orderFn = orderBy === "desc" ? desc : asc;

  const readings = await db
    .select()
    .from(sensorReadings)
    .where(eq(sensorReadings.assetId, assetId))
    .orderBy(orderFn(sensorReadings.timestamp))
    .limit(limit)
    .offset(offset);

  return readings;
}

/**
 * Get the most recent sensor reading for an asset
 *
 * @param assetId - Asset ID
 * @returns Latest sensor reading or null if none found
 *
 * @example
 * const latest = await getLatestReading('PUMP-303');
 * if (latest) {
 *   console.log(`Current temp: ${latest.tempF}°F`);
 *   console.log(`Pressure: ${latest.pressurePSI} PSI`);
 * }
 */
export async function getLatestReading(assetId: string) {
  const [reading] = await db
    .select()
    .from(sensorReadings)
    .where(eq(sensorReadings.assetId, assetId))
    .orderBy(desc(sensorReadings.timestamp))
    .limit(1);

  return reading || null;
}

/**
 * Get sensor readings within a time range
 *
 * @param assetId - Asset ID
 * @param startDate - Start date (ISO 8601 string)
 * @param endDate - End date (ISO 8601 string)
 * @returns Array of sensor readings in the date range
 *
 * @example
 * const readings = await getReadingsInTimeRange(
 *   'PUMP-303',
 *   '2025-01-01T00:00:00Z',
 *   '2025-01-31T23:59:59Z'
 * );
 * console.log(`January had ${readings.length} readings`);
 */
export async function getReadingsInTimeRange(
  assetId: string,
  startDate: string,
  endDate: string
) {
  const readings = await db
    .select()
    .from(sensorReadings)
    .where(
      and(
        eq(sensorReadings.assetId, assetId),
        gte(sensorReadings.timestamp, startDate),
        lte(sensorReadings.timestamp, endDate)
      )
    )
    .orderBy(asc(sensorReadings.timestamp));

  return readings;
}
