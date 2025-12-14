/**
 * POST /api/train
 *
 * Trigger ML model training on uploaded sensor data.
 * (Stub implementation - full ML integration in Phase 4)
 */

import { NextRequest, NextResponse } from "next/server";
import { TrainRequestSchema } from "@/lib/validation/schemas";
import { getUploadedFileById } from "@/lib/db/helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_id } = TrainRequestSchema.parse(body);

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

    // TODO: Implement actual ML training in Phase 4
    // For now, return a stub response
    return NextResponse.json({
      status: "success",
      message: "Model training initiated (stub implementation)",
      data: {
        model_id: `model_${Date.now()}`,
        status: "training",
        file_id,
        estimated_completion: new Date(Date.now() + 60000).toISOString(), // +1 minute
      },
    });
  } catch (error) {
    console.error("Error in training endpoint:", error);

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
          code: "TRAINING_FAILED",
          message: "Failed to initiate model training",
        },
      },
      { status: 500 }
    );
  }
}
