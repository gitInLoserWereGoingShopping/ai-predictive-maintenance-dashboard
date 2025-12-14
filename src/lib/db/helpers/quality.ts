/**
 * Data Quality Operations Database Helpers
 *
 * Handles validation issue tracking and data quality reporting.
 * Used by: POST /api/upload (CSV validation)
 */

import { db } from "../client";
import { dataQualityIssues } from "../schema";
import { eq } from "drizzle-orm";

/**
 * Create a data quality issue record
 *
 * @param data - Issue details from validation
 * @returns Created issue record
 *
 * @example
 * await createDataQualityIssue({
 *   fileId: 'file_abc123',
 *   assetId: 'PUMP-303',
 *   issueType: 'outlier',
 *   severity: 'error',
 *   field: 'tempF',
 *   value: '250',
 *   timestamp: '2025-01-10T10:00:00Z',
 * });
 */
export async function createDataQualityIssue(data: {
  fileId: string;
  assetId?: string;
  timestamp?: string;
  issueType: string;
  field?: string;
  value?: string;
  severity: string;
}) {
  const [issue] = await db
    .insert(dataQualityIssues)
    .values({
      fileId: data.fileId,
      assetId: data.assetId,
      timestamp: data.timestamp,
      issueType: data.issueType,
      field: data.field,
      value: data.value,
      severity: data.severity,
    })
    .returning();

  return issue;
}

/**
 * Get all data quality issues for an uploaded file
 *
 * @param fileId - File ID
 * @returns Array of data quality issues
 *
 * @example
 * const issues = await getIssuesByFileId('file_abc123');
 *
 * console.log(`Total issues: ${issues.length}`);
 *
 * const highSeverity = issues.filter(i => i.severity === 'high');
 * console.log(`High severity issues: ${highSeverity.length}`);
 *
 * // Group by type
 * const byType = issues.reduce((acc, issue) => {
 *   acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
 *   return acc;
 * }, {});
 */
export async function getIssuesByFileId(fileId: string) {
  const issues = await db
    .select()
    .from(dataQualityIssues)
    .where(eq(dataQualityIssues.fileId, fileId));

  return issues;
}
