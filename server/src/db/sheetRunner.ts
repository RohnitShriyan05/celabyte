// src/db/sheetRunner.ts
import ExcelJS from "exceljs"
import { SECURITY } from "../config/security"

export type SheetArgs = { 
  path: string, 
  sheet: string, 
  filter?: Record<string, any>, 
  select?: string[], 
  limit?: number 
}

function isGoogleSheetsUrl(path: string): boolean {
  return path.includes('docs.google.com/spreadsheets')
}

function convertToCSVUrl(googleSheetsUrl: string, gid?: string): string {
  // Extract spreadsheet ID from URL
  const match = googleSheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) {
    throw new Error('Invalid Google Sheets URL format')
  }
  
  const spreadsheetId = match[1]
  
  // Extract gid from URL if present
  const gidMatch = googleSheetsUrl.match(/gid=(\d+)/)
  const sheetGid = gid || (gidMatch ? gidMatch[1] : '0')
  
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}`
}

function parseCSV(csvText: string): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) return []
  
  // More robust CSV parsing to handle quoted values and commas within quotes
  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    // Add the last field
    result.push(current.trim())
    return result
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  const rows: Record<string, any>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''))
    const row: Record<string, any> = {}
    
    headers.forEach((header, index) => {
      const value = values[index] || ''
      // Try to convert numeric values
      const numValue = parseFloat(value)
      row[header] = !isNaN(numValue) && value !== '' ? numValue : value
    })
    
    rows.push(row)
  }
  
  return rows
}

async function fetchGoogleSheetData(path: string, sheetName: string): Promise<Record<string, any>[]> {
  // Extract gid from sheet name if it's in format "gid_123"
  const gidMatch = sheetName.match(/^gid_(\d+)$/)
  const gid = gidMatch ? gidMatch[1] : undefined
  
  const csvUrl = convertToCSVUrl(path, gid)
  
  try {
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheets data: ${response.status} ${response.statusText}`)
    }
    
    const csvText = await response.text()
    console.log('CSV Response:', csvText.substring(0, 500) + '...') // Debug log
    const parsedData = parseCSV(csvText)
    console.log('Parsed data sample:', parsedData.slice(0, 3)) // Debug log
    return parsedData
  } catch (error: any) {
    console.error('Google Sheets fetch error:', error)
    throw new Error(`File not found: ${path}. Make sure the Google Sheets document is publicly accessible or shared with view permissions.`)
  }
}

async function readLocalExcelFile(path: string, sheetName: string): Promise<Record<string, any>[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path)
  const ws = wb.getWorksheet(sheetName)
  if (!ws) throw new Error("sheet not found")

  const rows: Record<string, any>[] = []
  const headers: string[] = []

  // ✅ use ExcelJS.Cell correctly
  ws.getRow(1).eachCell((cell: ExcelJS.Cell, colNum: number) => {
    headers[colNum - 1] = String(cell.value ?? "")
  })

  ws.eachRow((row, rowNumber: number) => {
    if (rowNumber === 1) return
    const obj: Record<string, any> = {}
    row.eachCell((cell: ExcelJS.Cell, colNum: number) => {
      obj[headers[colNum - 1]] = cell.value
    })
    rows.push(obj)
  })

  return rows
}

export async function getSheetSchema(
  client: { path: string }, 
  sheetName: string
): Promise<{ columns: string[], sampleData: Record<string, any>[] }> {
  let rows: Record<string, any>[]
  
  if (isGoogleSheetsUrl(client.path)) {
    rows = await fetchGoogleSheetData(client.path, sheetName)
  } else {
    rows = await readLocalExcelFile(client.path, sheetName)
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  const sampleData = rows.slice(0, 3) // Get first 3 rows as sample

  return { columns, sampleData }
}

export async function runSheet(
  client: { path: string }, 
  allowedCols: string[] | undefined, 
  a: SheetArgs
) {
  let rows: Record<string, any>[]
  
  if (isGoogleSheetsUrl(client.path)) {
    rows = await fetchGoogleSheetData(client.path, a.sheet)
  } else {
    rows = await readLocalExcelFile(client.path, a.sheet)
  }

  const filtered = rows.filter(r => {
    for (const k in (a.filter ?? {})) {
      if (`${r[k]}` !== `${(a.filter as any)[k]}`) return false
    }
    return true
  })

  const limit = Math.min(a.limit ?? SECURITY.defaultLimit, SECURITY.maxLimit)
  const sliced = filtered.slice(0, limit)

  if (a.select && a.select.length) {
    if (allowedCols && allowedCols.length) {
      for (const c of a.select) {
        if (!allowedCols.includes(c)) throw new Error("column not allowed")
      }
    }
    return sliced.map(r => Object.fromEntries((a.select ?? []).map(k => [k, r[k]])))
  }

  return sliced
}
