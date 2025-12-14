/**
 * File Operations Database Helpers
 *
 * Handles uploaded file tracking and metadata management.
 * Used by: POST /api/upload
 */

import { db } from "../client";
import { uploadedFiles } from "../schema";
import { eq } from "drizzle-orm";

/**
 * Create a new uploaded file record
 *
 * @param data - File metadata
 * @returns Created file record with generated ID
 *
 * @example
 * const file = await createUploadedFile({
 *   fileName: 'sensor_data.csv',
 *   rowCount: 1200,
 *   assetCount: 10,
 *   status: 'processing'
 * });
 */
export async function createUploadedFile(data: {
  fileName: string;
  rowCount: number;
  assetCount: number;
  status?: "uploaded" | "processed" | "error";
}) {
  // Generate unique file ID
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
  const fileId = `file_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;

  const [file] = await db
    .insert(uploadedFiles)
    .values({
      id: fileId,
      fileName: data.fileName,
      rowCount: data.rowCount,
      assetCount: data.assetCount,
      status: data.status || "uploaded",
    })
    .returning();

  return file;
}

/**
 * Get uploaded file by ID
 *
 * @param id - File ID
 * @returns File record or null if not found
 *
 * @example
 * const file = await getUploadedFileById('file_abc123');
 * if (!file) throw new Error('File not found');
 */
export async function getUploadedFileById(id: string) {
  const [file] = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, id))
    .limit(1);

  return file || null;
}

/**
 * Get all uploaded files ordered by most recent first
 *
 * @returns Array of file records
 *
 * @example
 * const files = await getAllUploadedFiles();
 * console.log(`Total uploads: ${files.length}`);
 */
export async function getAllUploadedFiles() {
  const files = await db
    .select()
    .from(uploadedFiles)
    .orderBy(uploadedFiles.uploadedAt);

  return files;
}

/**
 * Update file processing status
 *
 * @param id - File ID
 * @param status - New status
 *
 * @example
 * await updateFileStatus('file_abc123', 'processed');
 */
export async function updateFileStatus(
  id: string,
  status: "uploaded" | "processed" | "error"
) {
  await db
    .update(uploadedFiles)
    .set({ status })
    .where(eq(uploadedFiles.id, id));
}
