/**
 * GET /api/assets/[id]
 *
 * Retrieve detailed information for a specific asset including:
 * - Asset metadata
 * - Sensor readings (time-series data)
 * - Latest prediction and risk level
 * - Historical predictions for trend analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getAssetWithReadings, getPredictionHistory } from "@/lib/db/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assetId } = await params;

  try {
    // Get query parameters for pagination/limits
    const searchParams = request.nextUrl.searchParams;
    const readingsLimit = parseInt(searchParams.get("readingsLimit") || "1000");

    // Get asset with readings and latest prediction
    const assetData = await getAssetWithReadings(assetId, readingsLimit);

    if (!assetData) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "ASSET_NOT_FOUND",
            message: `Asset with ID '${assetId}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Get prediction history for trend analysis
    const predictionHistory = await getPredictionHistory(assetId, 30);

    // Format response
    return NextResponse.json({
      status: "success",
      data: {
        asset: {
          id: assetData.asset.id,
          name: assetData.asset.name,
          type: assetData.asset.type,
          location: assetData.asset.location,
          manufacturer: assetData.asset.manufacturer,
          model: assetData.asset.model,
          installationDate: assetData.asset.installationDate,
          lastMaintenanceDate: assetData.asset.lastMaintenanceDate,
        },
        readings: assetData.readings.map((r) => ({
          timestamp: r.timestamp,
          tempF: r.tempF,
          pressurePSI: r.pressurePSI,
          vibrationMM: r.vibrationMM,
          failureFlag: r.failureFlag,
        })),
        currentPrediction: assetData.latestPrediction
          ? {
              riskLevel: assetData.latestPrediction.riskLevel,
              probability: assetData.latestPrediction.probability,
              recommendation: assetData.latestPrediction.recommendation,
              predictedAt: assetData.latestPrediction.predictedAt,
              modelVersion: assetData.latestPrediction.modelVersion,
            }
          : null,
        predictionHistory: predictionHistory.map((p) => ({
          riskLevel: p.riskLevel,
          probability: p.probability,
          predictedAt: p.predictedAt,
        })),
        stats: {
          totalReadings: assetData.readings.length,
          dateRange: {
            start:
              assetData.readings[assetData.readings.length - 1]?.timestamp ||
              null,
            end: assetData.readings[0]?.timestamp || null,
          },
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching asset ${assetId}:`, error);

    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve asset details",
        },
      },
      { status: 500 }
    );
  }
}
