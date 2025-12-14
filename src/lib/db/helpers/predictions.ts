/**
 * Prediction Operations Database Helpers
 *
 * Handles ML model predictions, risk assessments, and recommendations.
 * Used by: POST /api/predict, GET /api/assets, GET /api/assets/:id
 */

import { db } from "../client";
import { predictions } from "../schema";
import { eq, desc } from "drizzle-orm";

/**
 * Create a new prediction record
 *
 * @param data - Prediction details from ML model
 * @returns Created prediction record
 *
 * @example
 * const prediction = await createPrediction({
 *   assetId: 'PUMP-303',
 *   probability: 0.68,
 *   riskLevel: 'yellow',
 *   recommendation: 'Schedule inspection within 7 days.',
 *   modelVersion: 'v1.0',
 * });
 */
export async function createPrediction(data: {
  assetId: string;
  probability: number;
  riskLevel: "green" | "yellow" | "red";
  recommendation: string;
  modelVersion?: string;
  featureImportances?: string; // JSON string
}) {
  const [prediction] = await db
    .insert(predictions)
    .values({
      assetId: data.assetId,
      probability: data.probability,
      riskLevel: data.riskLevel,
      recommendation: data.recommendation,
      modelVersion: data.modelVersion,
      featureImportances: data.featureImportances,
    })
    .returning();

  return prediction;
}

/**
 * Get the most recent prediction for an asset
 *
 * @param assetId - Asset ID
 * @returns Latest prediction or null if none found
 *
 * @example
 * const prediction = await getLatestPredictionForAsset('PUMP-303');
 * if (prediction) {
 *   console.log(`Risk: ${prediction.riskLevel}`);
 *   console.log(`Failure probability: ${(prediction.probability * 100).toFixed(1)}%`);
 *   console.log(`Recommendation: ${prediction.recommendation}`);
 * }
 */
export async function getLatestPredictionForAsset(assetId: string) {
  const [prediction] = await db
    .select()
    .from(predictions)
    .where(eq(predictions.assetId, assetId))
    .orderBy(desc(predictions.predictedAt))
    .limit(1);

  return prediction || null;
}

/**
 * Get prediction history for trend analysis
 *
 * @param assetId - Asset ID
 * @param limit - Maximum number of predictions to return (default: 30)
 * @returns Array of predictions ordered by most recent first
 *
 * @example
 * // Get last 30 predictions for trend analysis
 * const history = await getPredictionHistory('PUMP-303');
 *
 * // Check if risk is increasing
 * const recentRisks = history.slice(0, 5).map(p => p.riskLevel);
 * const isWorsening = recentRisks.every(r => r === 'yellow' || r === 'red');
 *
 * // Get last 10 predictions only
 * const recent = await getPredictionHistory('PUMP-303', 10);
 */
export async function getPredictionHistory(
  assetId: string,
  limit: number = 30
) {
  const history = await db
    .select()
    .from(predictions)
    .where(eq(predictions.assetId, assetId))
    .orderBy(desc(predictions.predictedAt))
    .limit(limit);

  return history;
}
