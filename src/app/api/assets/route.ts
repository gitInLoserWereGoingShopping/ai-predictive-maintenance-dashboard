/**
 * GET /api/assets
 *
 * Retrieve list of all assets with their current risk status.
 * Supports filtering by type and risk level.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllAssets, getLatestPredictionForAsset } from "@/lib/db/helpers";
import { AssetQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      type: searchParams.get("type") || undefined,
      riskLevel: searchParams.get("riskLevel") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const validatedParams = AssetQuerySchema.parse(queryParams);

    // Get assets with optional filtering
    const assets = await getAllAssets(
      validatedParams.type ? { type: validatedParams.type } : undefined
    );

    // Get latest prediction for each asset
    const assetsWithPredictions = await Promise.all(
      assets.map(async (asset) => {
        const prediction = await getLatestPredictionForAsset(asset.id);

        return {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          location: asset.location,
          manufacturer: asset.manufacturer,
          model: asset.model,
          lastMaintenanceDate: asset.lastMaintenanceDate,
          riskLevel: prediction?.riskLevel || "green",
          failureProbability: prediction?.probability || 0,
          recommendation:
            prediction?.recommendation || "No prediction available",
          lastPredictionDate: prediction?.predictedAt || null,
        };
      })
    );

    // Filter by risk level if specified
    const filteredAssets = validatedParams.riskLevel
      ? assetsWithPredictions.filter(
          (a) => a.riskLevel === validatedParams.riskLevel
        )
      : assetsWithPredictions;

    // Apply pagination
    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 50;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedAssets = filteredAssets.slice(start, end);

    return NextResponse.json({
      status: "success",
      data: {
        assets: paginatedAssets,
        pagination: {
          page,
          limit,
          total: filteredAssets.length,
          totalPages: Math.ceil(filteredAssets.length / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching assets:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve assets",
        },
      },
      { status: 500 }
    );
  }
}
