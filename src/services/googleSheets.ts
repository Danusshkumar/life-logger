import type { LogEntry, Tag } from '../types';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export class ConventionError extends Error {
  details?: string;
  constructor(message: string, details?: string) {
    super(message);
    this.name = 'ConventionError';
    this.details = details;
  }
}

// Generate random vibrant hex color for new custom tags added from app
export const generateRandomHexColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Validate tag name: single word, lowercase letters and hyphens only
export const isValidTagName = (name: string): boolean => {
  return /^[a-z]+(-[a-z]+)*$/.test(name.trim());
};

export const formatTagsString = (tags: string[]): string => {
  return tags
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
    .join(', ');
};

export const parseTagsString = (tagsStr: string): string[] => {
  if (!tagsStr) return [];
  return tagsStr
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
};

// Fetch Workbook Metadata
export const fetchWorkbookMetadata = async (spreadsheetId: string, token: string) => {
  const response = await fetch(`${BASE_URL}/${spreadsheetId}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to access Google Spreadsheet. Verify Spreadsheet ID.');
  }

  const data = await response.json();
  const titles: string[] = (data.sheets || []).map((s: any) => s.properties?.title || '');
  return titles;
};

// Ensure Year Sheet exists (e.g. LifeLogger_2026). Row 1 MUST be [Date | Activities | Description]
export const ensureYearSheetExists = async (spreadsheetId: string, sheetYear: string, token: string) => {
  const existingTabs = await fetchWorkbookMetadata(spreadsheetId, token);

  if (!existingTabs.includes(sheetYear)) {
    const addSheetRes = await fetch(`${BASE_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: sheetYear },
            },
          },
        ],
      }),
    });

    if (!addSheetRes.ok) {
      const err = await addSheetRes.json();
      throw new Error(`Failed to auto-create sheet tab '${sheetYear}': ${err.error?.message || ''}`);
    }

    const yearMatch = sheetYear.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

    const datesRows: string[][] = [['Date', 'Activities', 'Description']];
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const totalDays = isLeapYear ? 366 : 365;

    const startDate = new Date(year, 0, 1);
    for (let i = 0; i < totalDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const yearStr = current.getFullYear();
      const monthStr = String(current.getMonth() + 1).padStart(2, '0');
      const dayStr = String(current.getDate()).padStart(2, '0');
      datesRows.push([`${yearStr}-${monthStr}-${dayStr}`, '', '']);
    }

    const range = encodeURIComponent(`'${sheetYear}'!A1:C${datesRows.length}`);
    await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: datesRows }),
    });
  }
};

// Validate Row 1 Headers in LifeLogger_YYYY (Date, Activities, Description)
export const validateSheetHeaders = async (spreadsheetId: string, sheetYear: string, token: string) => {
  const range = encodeURIComponent(`'${sheetYear}'!A1:C1`);
  const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return;

  const data = await response.json();
  const headers = data.values?.[0] || [];

  const colA = String(headers[0] || '').trim();
  const colB = String(headers[1] || '').trim();
  const colC = String(headers[2] || '').trim();

  if (colA !== 'Date' || colB !== 'Activities' || colC !== 'Description') {
    throw new ConventionError(
      `Sheet '${sheetYear}' violates workspace conventions!`,
      `Row 1 headers MUST be exact strings: Date | Activities | Description. Found: [${headers.join(' | ') || 'Empty'}]. Please fix Row 1 or delete sheet tab.`
    );
  }
};

// FETCH LIVE TAGS FROM GOOGLE SHEETS 'TagsMaster' TAB DIRECTLY (No headers - Reads A1:C200)
export const fetchTags = async (spreadsheetId: string, token: string): Promise<Tag[]> => {
  try {
    const range = encodeURIComponent("'TagsMaster'!A1:C200");
    const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn('TagsMaster tab not found or unreadable.');
      return [];
    }

    const data = await response.json();
    const rows = data.values || [];

    const parsedTags: Tag[] = rows
      .map((row: any[]) => {
        const name = (row[0] || '').trim().toLowerCase().replace(/\s+/g, '-');
        let rawColor = (row[1] || '').trim();
        if (rawColor && !rawColor.startsWith('#')) {
          rawColor = `#${rawColor}`;
        }
        const color = rawColor || '#8B5CF6';
        const description = (row[2] || '').trim();

        return { name, color: color === '#' ? '#8B5CF6' : color, description };
      })
      .filter((tag: Tag) => tag.name.length > 0);

    return parsedTags;
  } catch (error) {
    console.error('Error fetching live tags from TagsMaster:', error);
    return [];
  }
};

// Append a new custom tag directly to 'TagsMaster' sheet in Google Sheets
export const appendTagToMaster = async (spreadsheetId: string, tag: Tag, token: string): Promise<void> => {
  try {
    const range = encodeURIComponent("'TagsMaster'!A:C");
    const body = {
      values: [[tag.name, tag.color, tag.description || '']],
    };

    const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to append new tag to TagsMaster');
    }
  } catch (error) {
    console.error('Error appending tag to TagsMaster:', error);
    throw error;
  }
};

// Normalize date string to YYYY-MM-DD from any formula output, serial number, or date format
export const normalizeDateString = (input: any): string => {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  if (!str) return '';

  // 1. Serial Date Number (e.g. 46023 - Google Sheets days since 1899-12-30)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    const utcDays = serial - 25569;
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 3. M/D/YYYY or MM/DD/YYYY or D/M/YYYY or DD/MM/YYYY (Year at end: 4 digits)
  const mdyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (mdyMatch) {
    const p1 = parseInt(mdyMatch[1], 10);
    const p2 = parseInt(mdyMatch[2], 10);
    const y = mdyMatch[3];

    let month = p1;
    let day = p2;
    if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2;
    }
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. Fallback: Standard Date parsing (e.g., "Jan 1, 2026")
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
};

// Fetch Log Entries from current year sheet (e.g. LifeLogger_2026)
export const fetchLogEntries = async (spreadsheetId: string, sheetYear: string, token: string): Promise<LogEntry[]> => {
  try {
    await ensureYearSheetExists(spreadsheetId, sheetYear, token);
    await validateSheetHeaders(spreadsheetId, sheetYear, token);

    const range = encodeURIComponent(`'${sheetYear}'!A2:C370`);
    const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Failed to fetch logs from sheet ${sheetYear}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    const entries: LogEntry[] = [];

    rows.forEach((row: any[], index: number) => {
      const rawDate = row[0] ? String(row[0]).trim() : '';
      if (!rawDate) return;

      const normalized = normalizeDateString(rawDate);
      const activitiesStr = row[1] ? String(row[1]).trim() : '';
      const description = row[2] ? String(row[2]).trim() : '';

      entries.push({
        date: normalized,
        activities: parseTagsString(activitiesStr),
        description,
        rowIndex: index + 2,
      });
    });

    return entries;
  } catch (error) {
    console.error('Error fetching log entries:', error);
    throw error;
  }
};

// Update row for a specific date in LifeLogger_YYYY sheet
export const updateLogEntry = async (
  spreadsheetId: string,
  sheetYear: string,
  entry: LogEntry,
  token: string
): Promise<void> => {
  try {
    await ensureYearSheetExists(spreadsheetId, sheetYear, token);
    await validateSheetHeaders(spreadsheetId, sheetYear, token);

    const fetchRange = encodeURIComponent(`'${sheetYear}'!A2:C370`);
    const fetchRes = await fetch(`${BASE_URL}/${spreadsheetId}/values/${fetchRange}?valueRenderOption=FORMATTED_VALUE`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!fetchRes.ok) {
      const err = await fetchRes.json();
      throw new Error(err.error?.message || `Failed to fetch sheet ${sheetYear}`);
    }

    const data = await fetchRes.json();
    const rows: any[][] = data.values || [];

    const targetDate = normalizeDateString(entry.date);
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const rawDate = rows[i][0] ? String(rows[i][0]).trim() : '';
      if (normalizeDateString(rawDate) === targetDate) {
        rowIndex = i + 2; // +2 because row A2 is index 0
        break;
      }
    }

    // If not found in existing rows, append at the end (rows.length + 2)
    if (rowIndex === -1) {
      rowIndex = rows.length + 2;
    }

    const updateRange = encodeURIComponent(`'${sheetYear}'!A${rowIndex}:C${rowIndex}`);
    const body = {
      values: [[entry.date, formatTagsString(entry.activities), entry.description]],
    };

    const response = await fetch(
      `${BASE_URL}/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to update log entry in Google Sheet');
    }
  } catch (error) {
    console.error('Error updating log entry:', error);
    throw error;
  }
};
