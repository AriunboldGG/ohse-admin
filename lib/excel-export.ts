import * as XLSX from "xlsx"

/**
 * Export data to Excel file
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param sheetName - Name of the worksheet
 */
export function exportToExcel(
  data: any[],
  filename: string,
  sheetName: string = "Sheet1"
) {
  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data)

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate Excel file and download
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Export multiple sheets to Excel
 * @param sheets - Array of { name: string, data: any[] }
 * @param filename - Name of the file (without extension)
 */
export function exportMultipleSheets(
  sheets: { name: string; data: any[] }[],
  filename: string
) {
  const wb = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

