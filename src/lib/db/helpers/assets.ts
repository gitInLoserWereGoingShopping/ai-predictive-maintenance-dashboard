/**
 * Asset Operations Database Helpers
 *
 * Handles asset management, CRUD operations, and relationships with sensor data.
 * Used by: POST /api/upload, GET /api/assets, GET /api/assets/:id
 */

import { db } from "../client";
import { assets, sensorReadings, predictions } from "../schema";
import { eq, desc } from "drizzle-orm";

/**
 * Create a new asset
 *
 * @param data - Asset details
 * @returns Created asset record
 *
 * @example
 * const asset = await createAsset({
 *   id: 'PUMP-303',
 *   name: 'Hydraulic Pump 303',
 *   type: 'pump',
 *   location: 'Building A - Floor 2',
 *   manufacturer: 'Grundfos',
 *   model: 'CR-95',
 * });
 */
export async function createAsset(data: {
  id: string;
  name: string;
  type: "pump" | "compressor" | "motor" | "other";
  location?: string;
  manufacturer?: string;
  model?: string;
  installationDate?: string;
  lastMaintenanceDate?: string;
}) {
  const [asset] = await db
    .insert(assets)
    .values({
      id: data.id,
      name: data.name,
      type: data.type,
      location: data.location,
      manufacturer: data.manufacturer,
      model: data.model,
      installationDate: data.installationDate,
      lastMaintenanceDate: data.lastMaintenanceDate,
    })
    .returning();

  return asset;
}

/**
 * Get asset by ID
 *
 * @param id - Asset ID
 * @returns Asset record or null if not found
 *
 * @example
 * const asset = await getAssetById('PUMP-303');
 * if (!asset) return res.status(404).json({ error: 'Asset not found' });
 */
export async function getAssetById(id: string) {
  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, id))
    .limit(1);

  return asset || null;
}

/**
 * Get all assets with optional filtering
 *
 * @param filters - Optional filters for type
 * @returns Array of asset records
 *
 * @example
 * // Get all assets
 * const allAssets = await getAllAssets();
 *
 * // Filter by type
 * const pumps = await getAllAssets({ type: 'pump' });
 */
export async function getAllAssets(filters?: {
  type?: "pump" | "compressor" | "motor" | "other";
}) {
  let query = db.select().from(assets);

  if (filters?.type) {
    query = query.where(eq(assets.type, filters.type)) as typeof query;
  }

  const assetsList = await query;
  return assetsList;
}

/**
 * Get asset with all sensor readings and latest prediction
 *
 * @param assetId - Asset ID
 * @param limit - Maximum number of readings to return (default: 1000)
 * @returns Object with asset, readings, and prediction, or null if asset not found
 *
 * @example
 * const data = await getAssetWithReadings('PUMP-303', 500);
 * if (!data) return res.status(404).json({ error: 'Asset not found' });
 *
 * console.log(`${data.asset.name} has ${data.readings.length} readings`);
 * console.log(`Risk level: ${data.latestPrediction?.riskLevel}`);
 */
export async function getAssetWithReadings(
  assetId: string,
  limit: number = 1000
) {
  // Get asset
  const asset = await getAssetById(assetId);
  if (!asset) return null;

  // Get sensor readings
  const readings = await db
    .select()
    .from(sensorReadings)
    .where(eq(sensorReadings.assetId, assetId))
    .orderBy(desc(sensorReadings.timestamp))
    .limit(limit);

  // Get latest prediction
  const [latestPrediction] = await db
    .select()
    .from(predictions)
    .where(eq(predictions.assetId, assetId))
    .orderBy(desc(predictions.predictedAt))
    .limit(1);

  return {
    asset,
    readings,
    latestPrediction: latestPrediction || null,
  };
}

/**
 * Update asset metadata
 *
 * @param id - Asset ID
 * @param data - Fields to update
 * @returns Updated asset record
 *
 * @example
 * const updated = await updateAsset('PUMP-303', {
 *   lastMaintenanceDate: '2025-12-14',
 *   location: 'Building B - Floor 1',
 * });
 */
export async function updateAsset(
  id: string,
  data: Partial<{
    name: string;
    type: "pump" | "compressor" | "motor" | "other";
    location: string;
    manufacturer: string;
    model: string;
    installationDate: string;
    lastMaintenanceDate: string;
  }>
) {
  const [updatedAsset] = await db
    .update(assets)
    .set(data)
    .where(eq(assets.id, id))
    .returning();

  return updatedAsset;
}

/**
 * Delete asset and all associated data
 *
 * @param id - Asset ID
 *
 * @example
 * await deleteAsset('PUMP-303');
 */
export async function deleteAsset(id: string) {
  // Delete associated sensor readings
  await db.delete(sensorReadings).where(eq(sensorReadings.assetId, id));

  // Delete associated predictions
  await db.delete(predictions).where(eq(predictions.assetId, id));

  // Delete asset
  await db.delete(assets).where(eq(assets.id, id));
}
