/**
 * POST /api/upload
 *
 * Upload and validate CSV sensor data files.
 * Creates assets and stores sensor readings in the database.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createUploadedFile,
  createAsset,
  insertSensorReadings,
  createDataQualityIssue,
  getAssetById,
} from "@/lib/db/helpers";
import { CSVRowSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// Helper function to parse CSV
function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split("\n");
  return lines.map((line) => {
    // Simple CSV parsing (doesn't handle quoted commas)
    return line.split(",").map((cell) => cell.trim());
  });
}

// Helper to determine asset type from ID
function determineAssetType(
  assetId: string
): "pump" | "compressor" | "motor" | "other" {
  const upperAssetId = assetId.toUpperCase();
  if (upperAssetId.startsWith("PUMP")) return "pump";
  if (upperAssetId.startsWith("COMP")) return "compressor";
  if (upperAssetId.startsWith("MOTOR")) return "motor";
  return "other";
}

// Helper to create asset name from ID
function createAssetName(assetId: string): string {
  const type = determineAssetType(assetId);
  const typeMap = {
    pump: "Pump",
    compressor: "Compressor",
    motor: "Motor",
    other: "Equipment",
  };
  return `${typeMap[type]} ${assetId.replace(/[^0-9]/g, "")}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "VALIDATION_ERROR",
            message: "No file provided",
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "VALIDATION_ERROR",
            message: "File must be a CSV file",
          },
        },
        { status: 400 }
      );
    }

    // Read file content
    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "VALIDATION_ERROR",
            message:
              "CSV file must contain a header row and at least one data row",
          },
        },
        { status: 400 }
      );
    }

    // Parse header
    const header = rows[0];
    const requiredColumns = [
      "timestamp",
      "asset_id",
      "tempF",
      "pressurePSI",
      "vibrationMM",
      "failure_flag",
    ];

    // Validate header
    const missingColumns = requiredColumns.filter(
      (col) => !header.includes(col)
    );
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: "VALIDATION_ERROR",
            message: `CSV missing required columns: ${missingColumns.join(
              ", "
            )}`,
            details: {
              found_columns: header,
              required_columns: requiredColumns,
            },
          },
        },
        { status: 400 }
      );
    }

    // Get column indices
    const colIndices = {
      timestamp: header.indexOf("timestamp"),
      asset_id: header.indexOf("asset_id"),
      tempF: header.indexOf("tempF"),
      pressurePSI: header.indexOf("pressurePSI"),
      vibrationMM: header.indexOf("vibrationMM"),
      failure_flag: header.indexOf("failure_flag"),
    };

    // Create file record
    const uploadedFile = await createUploadedFile({
      fileName: file.name,
      rowCount: rows.length - 1, // Exclude header
      assetCount: 0, // Will update after processing
      status: "uploaded",
    });

    // Parse and validate data rows
    const validReadings: Array<{
      assetId: string;
      timestamp: string;
      tempF: number;
      pressurePSI: number;
      vibrationMM: number;
      failureFlag: number;
    }> = [];

    const uniqueAssets = new Set<string>();
    const dataQualityIssues: Array<{
      issueType: string;
      severity: string;
      field?: string;
      value?: string;
      rowNumber?: number;
    }> = [];

    // Process each data row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Create object from row
        const rowData = {
          timestamp: row[colIndices.timestamp],
          asset_id: row[colIndices.asset_id],
          tempF: row[colIndices.tempF],
          pressurePSI: row[colIndices.pressurePSI],
          vibrationMM: row[colIndices.vibrationMM],
          failure_flag: row[colIndices.failure_flag],
        };

        // Validate with Zod
        const validated = CSVRowSchema.parse(rowData);

        // Add to valid readings
        validReadings.push({
          assetId: validated.asset_id,
          timestamp: validated.timestamp,
          tempF: validated.tempF,
          pressurePSI: validated.pressurePSI,
          vibrationMM: validated.vibrationMM,
          failureFlag: validated.failure_flag,
        });

        uniqueAssets.add(validated.asset_id);
      } catch (error) {
        // Log validation error
        if (error instanceof z.ZodError) {
          // ZodError.issues is an array of ZodIssue objects
          // Each issue has: path (string[]), message (string), code (string)
          const issue = error.issues[0]; // Get first validation error
          const fieldName = issue.path.join("."); // e.g., "tempF" or "timestamp"

          // Get the column index safely
          const colIndex = colIndices[fieldName as keyof typeof colIndices];
          const fieldValue = colIndex !== undefined ? row[colIndex] : "unknown";

          dataQualityIssues.push({
            issueType: "invalid_format",
            severity: "error",
            field: fieldName,
            value: String(fieldValue),
            rowNumber: i + 1,
          });

          // Store in database
          await createDataQualityIssue({
            fileId: uploadedFile.id,
            assetId: row[colIndices.asset_id] || "",
            timestamp: row[colIndices.timestamp] || "",
            issueType: "invalid_format",
            field: fieldName,
            value: String(fieldValue),
            severity: "error",
          });
        }
      }
    }

    // Create assets that don't exist yet
    for (const assetId of uniqueAssets) {
      const existingAsset = await getAssetById(assetId);

      if (!existingAsset) {
        await createAsset({
          id: assetId,
          name: createAssetName(assetId),
          type: determineAssetType(assetId),
          location: "Unknown",
        });
      }
    }

    // Insert sensor readings
    if (validReadings.length > 0) {
      await insertSensorReadings(validReadings);
    }

    // Return success response
    return NextResponse.json({
      status: "success",
      file_id: uploadedFile.id,
      rows_ingested: validReadings.length,
      assets_detected: uniqueAssets.size,
      columns: header,
      validation_summary: {
        total_rows: rows.length - 1,
        valid_rows: validReadings.length,
        invalid_rows: dataQualityIssues.length,
        missing_values: 0, // Could enhance this
        outliers_detected: 0, // Could enhance this
      },
    });
  } catch (error) {
    console.error("Error processing upload:", error);

    return NextResponse.json(
      {
        status: "error",
        error: {
          code: "UPLOAD_FAILED",
          message: "Failed to process uploaded file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
