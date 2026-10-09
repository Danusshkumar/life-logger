import { LogEntry, Tag } from '../types';

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

// Helper to sanitize tag inputs (comma-separated hyphenated words)
export const formatTagsString = (tags: string[]): string => {
  return tags
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
    .join(', ');
};

export const parseTagsString = (tagsStr: string): string[] => {
  if (!tagsStr) return [];
  return tagsStr
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
};

// Fetch Tags from Tag Master sheet
export const fetchTags = async (spreadsheetId: string, token: string): Promise<Tag[]> => {
  try {
    const range = encodeURIComponent("'Tag Master'!A2:C100");
    const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to fetch tags from Tag Master sheet');
    }

    const data = await response.json();
    const rows = data.values || [];

    return rows.map((row: any[], index: number) => {
      const name = (row[0] || '').trim().toLowerCase().replace(/\s+/g, '-');
      const rawColor = (row[1] || '').trim();
      const color = rawColor.startsWith('#') ? rawColor : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      const description = row[2] || '';

      return {
        name,
        color,
        description,
      };
    }).filter((tag: Tag) => tag.name.length > 0);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

// Fetch Log Entries from current year sheet (e.g. LifeLogger_2026)
export const fetchLogEntries = async (spreadsheetId: string, sheetYear: string, token: string): Promise<LogEntry[]> => {
  try {
    const range = encodeURIComponent(`'${sheetYear}'!A2:C370`);
    const response = await fetch(`${BASE_URL}/${spreadsheetId}/values/${range}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
        rowIndex: index + 2, // 1-indexed, starting after header at row 2
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
    // 1. First fetch all rows to find the exact matching date row
    const existingEntries = await fetchLogEntries(spreadsheetId, sheetYear, token);
    const targetEntry = existingEntries.find(e => e.date === entry.date);

    let rowIndex = targetEntry?.rowIndex;

    if (!rowIndex) {
      // If date is not found in pre-filled sheet, append to bottom
      rowIndex = existingEntries.length + 2;
    }

    const range = encodeURIComponent(`'${sheetYear}'!A${rowIndex}:C${rowIndex}`);
    const body = {
      values: [
        [
          entry.date,
          formatTagsString(entry.activities),
          entry.description
        ]
      ]
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
