export interface LogEntry {
  date: string; // YYYY-MM-DD format
  activities: string[]; // Array of tag names
  description: string;
  rowIndex?: number; // Row index in Google Sheets for quick update
}

export interface Tag {
  name: string;
  color: string; // Hex code or CSS color string
  description?: string;
}

export interface AppConfig {
  spreadsheetId: string;
  clientId: string;
  sheetYear: string; // e.g. "LifeLogger_2026"
  tagMasterSheet: string; // e.g. "TagsMaster"
}

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
}

export interface VendorMapping {
  is_indexed: boolean;
  category: string;
  title: string;
  description?: string;
  frequency: number;
  last_seen: string; // YYYY-MM-DD
}

export type CategoryMapperData = Record<string, VendorMapping>;
