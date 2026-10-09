/**
 * Extracts the 44-character Google Spreadsheet ID from any valid Google Sheet URL or raw ID string.
 * Handles formats like:
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRnt3kg_eG5x0y1abc12345/edit#gid=0
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRnt3kg_eG5x0y1abc12345/edit?usp=sharing
 * - 1BxiMVs0XRnt3kg_eG5x0y1abc12345
 */
export const extractSpreadsheetId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();

  // Regular expression to match Google Spreadsheet ID format (alphanumeric, hyphen, underscore, length >= 25)
  const matches = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matches && matches[1]) {
    return matches[1];
  }

  // If user pasted raw ID or sanitized string
  const rawMatch = trimmed.match(/^[a-zA-Z0-9-_]{25,}$/);
  if (rawMatch) {
    return trimmed;
  }

  return trimmed;
};
