import type { LogEntry, Tag } from '../types';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Default tag palette fallback
const DEFAULT_COLORS = [
  '#10B981', // Emerald green
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#F97316', // Orange
  '#64748B', // Slate
];

const DEFAULT_TAGS: Tag[] = [
  { name: 'gym', color: '#10B981', description: 'Workout or physical activity' },
  { name: 'deep-work', color: '#8B5CF6', description: 'Focused coding or study' },
  { name: 'reading', color: '#F59E0B', description: 'Books or technical articles' },
  { name: 'social', color: '#06B6D4', description: 'Friends and family time' },
];

export class ConventionError extends Error {
  details?: string;
  constructor(message: string, details?: string) {
    super(message);
    this.name = 'ConventionError';
    this.details = details;
  }
}

// Helper to sanitize tag inputs
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

// Check workbook sheet tabs metadata
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

// Ensure Year Sheet exists (e.g. LifeLogger_2026). If missing, auto-create tab + fill dates Jan 1 - Dec 31
export const ensureYearSheetExists = async (spreadsheetId: string, sheetYear: string, token: string) => {
  const existingTabs = await fetchWorkbookMetadata(spreadsheetId, token);

  if (!existingTabs.includes(sheetYear)) {
    // 1. Create tab
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

    // 2. Populate Header + Dates for full year (Jan 1 to Dec 31)
    const yearMatch = sheetYear.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

    const datesRows: string[][] = [['Date', 'Activities', 'Description']];
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const totalDays = isLeapYear ? 366 : 365;

    const startDate = new Date(year, 0, 1);
    for (let i = 0; i < totalDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      datesRows.push([dateStr, '', '']);
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

// Ensure Tag Master tab exists. If missing, auto-create
export const ensureTagMasterExists = async (spreadsheetId: string, token: string) => {
  const existingTabs = await fetchWorkbookMetadata(spreadsheetId, token);

  if (!existingTabs.includes('Tag Master')) {
    await fetch(`${BASE_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: 'Tag Master' },
            },
          },
        ],
      }),
    });

    const defaultRows = [
      ['Tag Name', 'Tag Color', 'Description'],
      ...DEFAULT_TAGS.map((t) => [t.name, t.color, t.description || '']),
    ];

    const range = encodeURIComponent("'Tag Master'!A1:C10");
    await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: defaultRows }),
    });
  }
};

// Strict Validation of Row 1 Headers (FAIL FAST IF CONVENTION IS BROKEN)
export const validateSheetHeaders = async (spreadsheetId: string, sheetYear: string, token: string) => {
  const range = encodeURIComponent(`'${sheetYear}'!A1:C1`);
  const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return;

  const data = await response.json();
  const headers = data.values?.[0] || [];

  const colA = (headers[0] || '').trim().toLowerCase();
  const colB = (headers[1] || '').trim().toLowerCase();
  const colC = (headers[2] || '').trim().toLowerCase();

  if (colA !== 'date' || colB !== 'activities' || colC !== 'description') {
    throw new ConventionError(
      `Sheet '${sheetYear}' violates workspace conventions!`,
      `Expected Row 1 headers: [Date | Activities | Description]. Found: [${headers.join(' | ') || 'Empty'}]. Please update headers or delete sheet tab to auto-recreate.`
    );
  }
};

// Fetch Tags from Tag Master sheet
export const fetchTags = async (spreadsheetId: string, token: string): Promise<Tag[]> => {
  try {
    await ensureTagMasterExists(spreadsheetId, token);

    const range = encodeURIComponent("'Tag Master'!A2:C100");
    const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return DEFAULT_TAGS;
    }

    const data = await response.json();
    const rows = data.values || [];

    const parsed = rows
      .map((row: any[], index: number) => {
        const name = (row[0] || '').trim().toLowerCase().replace(/\s+/g, '-');
        const rawColor = (row[1] || '').trim();
        const color = rawColor.startsWith('#') ? rawColor : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        const description = row[2] || '';

        return { name, color, description };
      })
      .filter((tag: Tag) => tag.name.length > 0);

    return parsed.length > 0 ? parsed : DEFAULT_TAGS;
  } catch (error) {
    console.warn('Error fetching tags, using default palette:', error);
    return DEFAULT_TAGS;
  }
};

// Fetch Log Entries from current year sheet (e.g. LifeLogger_2026)
export const fetchLogEntries = async (spreadsheetId: string, sheetYear: string, token: string): Promise<LogEntry[]> => {
  try {
    // 1. Ensure tab exists (auto-create if missing)
    await ensureYearSheetExists(spreadsheetId, sheetYear, token);

    // 2. Validate Row 1 headers (FAIL FAST IF WRONG)
    await validateSheetHeaders(spreadsheetId, sheetYear, token);

    // 3. Fetch data rows
    const range = encodeURIComponent(`'${sheetYear}'!A2:C370`);
    const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
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

      const activitiesStr = row[1] ? String(row[1]).trim() : '';
      const description = row[2] ? String(row[2]).trim() : '';

      entries.push({
        date: rawDate,
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
    const existingEntries = await fetchLogEntries(spreadsheetId, sheetYear, token);
    const targetEntry = existingEntries.find((e) => e.date === entry.date);

    let rowIndex = targetEntry?.rowIndex;

    if (!rowIndex) {
      rowIndex = existingEntries.length + 2;
    }

    const range = encodeURIComponent(`'${sheetYear}'!A${rowIndex}:C${rowIndex}`);
    const body = {
      values: [[entry.date, formatTagsString(entry.activities), entry.description]],
    };

    const response = await fetch(
      `${BASE_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
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
      throw new Error(err.error?.message || 'Failed to update log entry');
    }
  } catch (error) {
    console.error('Error updating log entry:', error);
    throw error;
  }
};
