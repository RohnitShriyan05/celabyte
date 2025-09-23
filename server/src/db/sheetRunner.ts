// src/db/sheetRunner.ts
import ExcelJS from "exceljs";
import { SECURITY } from "../config/security";
import { schemaCache, queryCache } from "../utils/cache";

export type SheetArgs = {
  path: string;
  sheet: string;
  filter?: Record<string, any>;
  select?: string[];
  limit?: number;
};

function isGoogleSheetsUrl(path: string): boolean {
  return path.includes("docs.google.com/spreadsheets");
}

function convertToCSVUrl(googleSheetsUrl: string, gid?: string): string {
  // Extract spreadsheet ID from URL
  const match = googleSheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error("Invalid Google Sheets URL format");
  }

  const spreadsheetId = match[1];

  // Extract gid from URL if present
  const gidMatch = googleSheetsUrl.match(/gid=(\d+)/);
  const sheetGid = gid || (gidMatch ? gidMatch[1] : "0");

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}`;
}

function parseCSV(csvText: string): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  // More robust CSV parsing to handle quoted values and commas within quotes
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, "").trim()
  );
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map((v) => v.replace(/^"|"$/g, ""));
    const row: Record<string, any> = {};

    headers.forEach((header, index) => {
      const value = values[index] || "";
      // Try to convert numeric values
      const numValue = parseFloat(value);
      row[header] = !isNaN(numValue) && value !== "" ? numValue : value;
    });

    rows.push(row);
  }

  return rows;
}

async function fetchGoogleSheetData(
  path: string,
  sheetName: string
): Promise<Record<string, any>[]> {
  // Extract gid from sheet name if it's in format "gid_123"
  const gidMatch = sheetName.match(/^gid_(\d+)$/);
  const gid = gidMatch ? gidMatch[1] : undefined;

  try {
    const csvUrl = convertToCSVUrl(path, gid);

    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Celabyte Data Analyzer/1.0",
      },
      timeout: 30000, // 30 second timeout
    } as any);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          `Access denied to Google Sheets document. Please ensure the document is publicly accessible or shared with view permissions.`
        );
      } else if (response.status === 404) {
        throw new Error(
          `Google Sheets document not found. Please check the URL and ensure the document exists.`
        );
      } else if (response.status === 400) {
        throw new Error(
          `Invalid Google Sheets request. Please check the sheet name '${sheetName}' exists in the document.`
        );
      }
      throw new Error(
        `Failed to fetch Google Sheets data: ${response.status} ${response.statusText}`
      );
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      console.warn(
        `Google Sheets returned empty data for sheet '${sheetName}'`
      );
      return [];
    }

    // Check if the response is an error page (HTML) instead of CSV
    if (csvText.includes("<html") || csvText.includes("<!DOCTYPE")) {
      throw new Error(
        `Google Sheets returned an error page instead of CSV data. Please check permissions and sheet name.`
      );
    }

    console.log("CSV Response sample:", csvText.substring(0, 500) + "..."); // Debug log
    const parsedData = parseCSV(csvText);
    console.log("Parsed data sample:", parsedData.slice(0, 3)); // Debug log

    if (parsedData.length === 0) {
      console.warn(`No data found in sheet '${sheetName}'`);
    }

    return parsedData;
  } catch (error: any) {
    console.error("Google Sheets fetch error:", error.message);

    if (
      error.message.includes("Access denied") ||
      error.message.includes("not found") ||
      error.message.includes("Invalid")
    ) {
      throw error; // Re-throw our custom errors
    } else if (
      error.name === "AbortError" ||
      error.message.includes("timeout")
    ) {
      throw new Error(
        `Timeout while fetching Google Sheets data. The document may be too large or the connection is slow.`
      );
    } else if (error.message.includes("fetch")) {
      throw new Error(
        `Network error while accessing Google Sheets. Please check your internet connection and try again.`
      );
    }

    throw new Error(
      `Failed to access Google Sheets document: ${error.message}`
    );
  }
}

async function readLocalExcelFile(
  path: string,
  sheetName: string
): Promise<Record<string, any>[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) throw new Error("sheet not found");

  const rows: Record<string, any>[] = [];
  const headers: string[] = [];

  // ✅ use ExcelJS.Cell correctly
  ws.getRow(1).eachCell((cell: ExcelJS.Cell, colNum: number) => {
    headers[colNum - 1] = String(cell.value ?? "");
  });

  ws.eachRow((row, rowNumber: number) => {
    if (rowNumber === 1) return;
    const obj: Record<string, any> = {};
    row.eachCell((cell: ExcelJS.Cell, colNum: number) => {
      obj[headers[colNum - 1]] = cell.value;
    });
    rows.push(obj);
  });

  return rows;
}

export async function getSheetSchema(
  client: { path: string },
  sheetName: string
): Promise<{ columns: string[]; sampleData: Record<string, any>[] }> {
  // Check cache first
  const cacheKey = `sheet_${client.path}_${sheetName}`;
  const cached = schemaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let rows: Record<string, any>[];

    if (isGoogleSheetsUrl(client.path)) {
      rows = await fetchGoogleSheetData(client.path, sheetName);
    } else {
      rows = await readLocalExcelFile(client.path, sheetName);
    }

    if (rows.length === 0) {
      console.warn(`Sheet '${sheetName}' is empty or could not be read`);
      return { columns: [], sampleData: [] };
    }

    const columns = Object.keys(rows[0]).filter(
      (col) => col && col.trim() !== ""
    ); // Filter out empty column names
    const sampleData = rows.slice(0, 3); // Get first 3 rows as sample

    const result = { columns, sampleData };

    // Cache the result
    schemaCache.set(cacheKey, result);

    return result;
  } catch (error: any) {
    console.error(`Sheet schema fetch error for ${sheetName}:`, error.message);

    if (
      error.message.includes("not found") ||
      error.message.includes("does not exist")
    ) {
      throw new Error(
        `Sheet '${sheetName}' not found. Please check the sheet name and ensure it exists.`
      );
    } else if (
      error.message.includes("permission") ||
      error.message.includes("access")
    ) {
      throw new Error(
        `Access denied to sheet '${sheetName}'. Please check sharing permissions.`
      );
    }

    // Return empty schema for other errors to allow system to continue
    return { columns: [], sampleData: [] };
  }
}

export async function runSheet(
  client: { path: string },
  allowedCols: string[] | undefined,
  a: SheetArgs
) {
  // Check query cache first
  const cacheKey = `query_${client.path}_${a.sheet}_${JSON.stringify(a)}`;
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let rows: Record<string, any>[];

    if (isGoogleSheetsUrl(client.path)) {
      rows = await fetchGoogleSheetData(client.path, a.sheet);
    } else {
      rows = await readLocalExcelFile(client.path, a.sheet);
    }

    if (rows.length === 0) {
      console.warn(`Sheet '${a.sheet}' is empty`);
      return [];
    }

    // Validate selected columns exist in the data
    if (a.select && a.select.length) {
      const availableColumns = Object.keys(rows[0] || {});
      const invalidColumns = a.select.filter(
        (col) => !availableColumns.includes(col)
      );

      if (invalidColumns.length > 0) {
        throw new Error(
          `Columns not found in sheet: ${invalidColumns.join(
            ", "
          )}. Available columns: ${availableColumns.join(", ")}`
        );
      }

      if (allowedCols && allowedCols.length) {
        for (const c of a.select) {
          if (!allowedCols.includes(c)) {
            throw new Error(
              `Column '${c}' not allowed. Available columns: ${allowedCols.join(
                ", "
              )}`
            );
          }
        }
      }
    }

    // Apply filters with better error handling
    const filtered = rows.filter((r) => {
      try {
        for (const k in a.filter ?? {}) {
          const rowValue = r[k];
          const filterValue = (a.filter as any)[k];

          // Handle null/undefined values
          if (rowValue == null && filterValue != null) return false;
          if (rowValue != null && filterValue == null) return false;

          // String comparison (case-insensitive for strings)
          if (typeof rowValue === "string" && typeof filterValue === "string") {
            if (rowValue.toLowerCase() !== filterValue.toLowerCase())
              return false;
          } else {
            if (`${rowValue}` !== `${filterValue}`) return false;
          }
        }
        return true;
      } catch (filterError: any) {
        console.warn(`Filter error for row:`, filterError.message);
        return false; // Exclude rows that cause filter errors
      }
    });

    const limit = Math.min(a.limit ?? SECURITY.defaultLimit, SECURITY.maxLimit);
    const sliced = filtered.slice(0, limit);

    let result;
    if (a.select && a.select.length) {
      result = sliced.map((r) =>
        Object.fromEntries((a.select ?? []).map((k) => [k, r[k] ?? null]))
      );
    } else {
      result = sliced;
    }

    // Cache the result
    queryCache.set(cacheKey, result);

    return result;
  } catch (error: any) {
    if (
      error.message.includes("Column") &&
      error.message.includes("not allowed")
    ) {
      throw error; // Re-throw our custom column permission errors
    } else if (
      error.message.includes("not found") ||
      error.message.includes("does not exist")
    ) {
      throw new Error(
        `Sheet '${a.sheet}' not found. Please check the sheet name and ensure it exists.`
      );
    } else if (
      error.message.includes("permission") ||
      error.message.includes("access")
    ) {
      throw new Error(
        `Access denied to sheet '${a.sheet}'. Please check sharing permissions.`
      );
    }
    throw new Error(`Sheet query execution failed: ${error.message}`);
  }
}
