import { Injectable } from '@angular/core';

/**
 * Lightweight, dependency-free export helper.
 *
 *  - exportToExcel  -> downloads a real .xls file (an Excel-native HTML
 *                      workbook). Opens directly in Excel/LibreOffice with
 *                      the columns preserved. No SheetJS/npm dependency.
 *  - exportToPdf    -> opens a styled print view and triggers the browser's
 *                      "Save as PDF" dialog. No jsPDF/npm dependency.
 *
 * Callers pass already-stringified column headers and row cells so the
 * service stays generic (it never needs to know about crops, farmers, etc.).
 */
@Injectable({ providedIn: 'root' })
export class ExportService {

  /** Download the given table as an Excel-openable .xls file. */
  exportToExcel(columns: string[], rows: (string | number)[][], fileName: string, title?: string): void {
    const table = this.buildHtmlTable(columns, rows, title);
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
      `xmlns:x="urn:schemas-microsoft-com:office:excel" ` +
      `xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="UTF-8"></head><body>${table}</body></html>`;
    // Leading BOM keeps non-ASCII characters intact when Excel opens the file.
    const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel' });
    this.triggerDownload(blob, `${fileName}.xls`);
  }

  /**
   * Open a printable view of the table and invoke the print dialog, where the
   * user can choose "Save as PDF". Returns false if a popup blocker stopped it.
   */
  exportToPdf(columns: string[], rows: (string | number)[][], fileName: string, title: string): boolean {
    const win = window.open('', '_blank');
    if (!win) {
      return false; // popup blocked
    }
    const table = this.buildHtmlTable(columns, rows);
    const printedOn = new Date().toLocaleString();
    win.document.write(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${this.escape(fileName)}</title>
          <style>
            * { font-family: Arial, Helvetica, sans-serif; }
            body { margin: 24px; color: #1a1a1a; }
            h1 { font-size: 18px; margin: 0 0 4px; }
            .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; }
            th, td { border: 1px solid #d0d0d0; padding: 6px 8px; text-align: left; vertical-align: top; }
            thead th { background: #2e7d32; color: #fff; }
            tbody tr:nth-child(even) { background: #f4f7f4; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>${this.escape(title)}</h1>
          <div class="meta">Generated ${this.escape(printedOn)} &middot; ${rows.length} record(s)</div>
          ${table}
          <script>window.onload = function () { window.focus(); window.print(); };</script>
        </body>
      </html>`);
    win.document.close();
    return true;
  }

  /** Build a plain HTML table from headers + rows. */
  private buildHtmlTable(columns: string[], rows: (string | number)[][], title?: string): string {
    const head = columns.map(c => `<th>${this.escape(c)}</th>`).join('');
    const body = rows
      .map(r => `<tr>${r.map(cell => `<td>${this.escape(cell)}</td>`).join('')}</tr>`)
      .join('');
    const caption = title ? `<caption style="text-align:left;font-weight:bold;padding:6px 0;">${this.escape(title)}</caption>` : '';
    return `<table border="1">${caption}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  private escape(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
