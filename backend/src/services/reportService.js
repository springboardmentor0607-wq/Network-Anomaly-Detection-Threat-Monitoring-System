// backend/src/services/reportService.js
// Scans the AI reports directory and returns a JSON array usable by the frontend

const path = require('path');
const fs = require('fs').promises;

// Absolute path to the folder that stores all generated reports (PDF, JSON, CSV)
const REPORTS_DIR = path.join(__dirname, '../../ai/reports');

/**
 * Reads the reports directory and builds an array of objects describing each report.
 * Each entry contains:
 *   - fileName   : string (e.g., "model_comparison.pdf")
 *   - format     : string (PDF, CSV, JSON)
 *   - sizeKb     : number
 *   - updatedAt  : ISO timestamp
 *   - downloadUrl: string (relative to the API root)
 *   - metrics    : optional object with { accuracy, perClass }
 */
async function getAllReports() {
  const entries = await fs.readdir(REPORTS_DIR, { withFileTypes: true });
  const reports = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!['.pdf', '.json', '.csv'].includes(ext)) continue;

    const fullPath = path.join(REPORTS_DIR, entry.name);
    const stats = await fs.stat(fullPath);
    const sizeKb = Math.round(stats.size / 1024);
    const updatedAt = stats.mtime.toISOString();
    const format = ext.replace('.', '').toUpperCase();

    let extra = {};
    if (ext === '.csv') {
      // Look for a sibling JSON metadata file with the same base name
      const metaName = entry.name.replace('.csv', '.json');
      const metaPath = path.join(REPORTS_DIR, metaName);
      try {
        const raw = await fs.readFile(metaPath, 'utf8');
        const meta = JSON.parse(raw);
        extra = meta;
      } catch (_) {
        // No metadata – ignore
      }
    }

    reports.push({
      fileName: entry.name,
      format: extra.format || format,
      sizeKb,
      updatedAt,
      downloadUrl: `/ai/reports/download/${entry.name}`,
      ...(extra.metrics ? { metrics: extra.metrics } : {})
    });
  }

  // Newest first
  reports.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return reports;
}

module.exports = {
  getAllReports
};
