/**
 * POST /api/predict
 *
 * Generate failure risk predictions for assets.
 * (Stub implementation - full ML integration in Phase 4)
 */

import { NextRequest, NextResponse } from "next/server";
import { PredictRequestSchema } from "@/lib/validation/schemas";
import {
  getUploadedFileById,
  getAllAssets,
  createPrediction,
} from "@/lib/db/helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_id } = PredictRequestSchema.parse(body);

    // Verify file exists
    const file = await getUploadedFileById(file_id);
    if (!file) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "FILE_NOT_FOUND",
            message: `File with ID '${file_id}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Get all assets to generate predictions for
    const assets = await getAllAssets();

    // TODO: Implement actual ML prediction in Phase 4
    // For now, generate stub predictions
    const predictions = await Promise.all(
      assets.map(async (asset) => {
        // Stub: Random risk assessment for demo
        const probability = Math.random();
        const riskLevel =
          probability < 0.3 ? "green" : probability < 0.7 ? "yellow" : "red";

        const recommendation =
          riskLevel === "green"
            ? "Continue normal operation. Asset operating within normal parameters."
            : riskLevel === "yellow"
            ? "Schedule inspection within 7 days. Elevated risk detected."
            : "Immediate attention required. High failure risk detected.";

        // Save prediction to database
        const prediction = await createPrediction({
          assetId: asset.id,
          probability,
          riskLevel,
          recommendation,
          modelVersion: "stub_v0.1",
        });

        return {
          asset_id: asset.id,
          asset_name: asset.name,
          risk_level: prediction.riskLevel,
          failure_probability: prediction.probability,
          recommendation: prediction.recommendation,
        };
      })
    );

    return NextResponse.json({
      status: "success",
      message: "Predictions generated successfully (stub implementation)",
      data: {
        predictions,
        model_version: "stub_v0.1",
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in prediction endpoint:", error);

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
          code: "PREDICTION_FAILED",
          message: "Failed to generate predictions",
        },
      },
      { status: 500 }
    );
  }
}
