"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSheetSchema = getSheetSchema;
exports.runSheet = runSheet;
// src/db/sheetRunner.ts
const exceljs_1 = __importDefault(require("exceljs"));
const security_1 = require("../config/security");
function isGoogleSheetsUrl(path) {
    return path.includes('docs.google.com/spreadsheets');
}
function convertToCSVUrl(googleSheetsUrl, gid) {
    // Extract spreadsheet ID from URL
    const match = googleSheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        throw new Error('Invalid Google Sheets URL format');
    }
    const spreadsheetId = match[1];
    // Extract gid from URL if present
    const gidMatch = googleSheetsUrl.match(/gid=(\d+)/);
    const sheetGid = gid || (gidMatch ? gidMatch[1] : '0');
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}`;
}
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0)
        return [];
    // More robust CSV parsing to handle quoted values and commas within quotes
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                }
                else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        // Add the last field
        result.push(current.trim());
        return result;
    }
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, index) => {
            const value = values[index] || '';
            // Try to convert numeric values
            const numValue = parseFloat(value);
            row[header] = !isNaN(numValue) && value !== '' ? numValue : value;
        });
        rows.push(row);
    }
    return rows;
}
async function fetchGoogleSheetData(path, sheetName) {
    // Extract gid from sheet name if it's in format "gid_123"
    const gidMatch = sheetName.match(/^gid_(\d+)$/);
    const gid = gidMatch ? gidMatch[1] : undefined;
    const csvUrl = convertToCSVUrl(path, gid);
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch Google Sheets data: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        console.log('CSV Response:', csvText.substring(0, 500) + '...'); // Debug log
        const parsedData = parseCSV(csvText);
        console.log('Parsed data sample:', parsedData.slice(0, 3)); // Debug log
        return parsedData;
    }
    catch (error) {
        console.error('Google Sheets fetch error:', error);
        throw new Error(`File not found: ${path}. Make sure the Google Sheets document is publicly accessible or shared with view permissions.`);
    }
}
async function readLocalExcelFile(path, sheetName) {
    const wb = new exceljs_1.default.Workbook();
    await wb.xlsx.readFile(path);
    const ws = wb.getWorksheet(sheetName);
    if (!ws)
        throw new Error("sheet not found");
    const rows = [];
    const headers = [];
    // ✅ use ExcelJS.Cell correctly
    ws.getRow(1).eachCell((cell, colNum) => {
        headers[colNum - 1] = String(cell.value ?? "");
    });
    ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1)
            return;
        const obj = {};
        row.eachCell((cell, colNum) => {
            obj[headers[colNum - 1]] = cell.value;
        });
        rows.push(obj);
    });
    return rows;
}
async function getSheetSchema(client, sheetName) {
    let rows;
    if (isGoogleSheetsUrl(client.path)) {
        rows = await fetchGoogleSheetData(client.path, sheetName);
    }
    else {
        rows = await readLocalExcelFile(client.path, sheetName);
    }
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const sampleData = rows.slice(0, 3); // Get first 3 rows as sample
    return { columns, sampleData };
}
async function runSheet(client, allowedCols, a) {
    let rows;
    if (isGoogleSheetsUrl(client.path)) {
        rows = await fetchGoogleSheetData(client.path, a.sheet);
    }
    else {
        rows = await readLocalExcelFile(client.path, a.sheet);
    }
    const filtered = rows.filter(r => {
        for (const k in (a.filter ?? {})) {
            if (`${r[k]}` !== `${a.filter[k]}`)
                return false;
        }
        return true;
    });
    const limit = Math.min(a.limit ?? security_1.SECURITY.defaultLimit, security_1.SECURITY.maxLimit);
    const sliced = filtered.slice(0, limit);
    if (a.select && a.select.length) {
        if (allowedCols && allowedCols.length) {
            for (const c of a.select) {
                if (!allowedCols.includes(c))
                    throw new Error("column not allowed");
            }
        }
        return sliced.map(r => Object.fromEntries((a.select ?? []).map(k => [k, r[k]])));
    }
    return sliced;
}
