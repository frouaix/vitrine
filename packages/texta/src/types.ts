export type RgUnits = "grapheme" | "codePoint";

export type RgStorageMode =
  | "fastCodeUnit"
  | "fastCodePoint"
  | "segmentedGrapheme";

export interface StyleEntry {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number;
  letterSpacing?: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  underline?: boolean;
  strikethrough?: boolean;
  mpProp_Custom?: Record<string, unknown>;
}

export interface AttributedTextValue {
  iVersion: number;
  rgUnits: RgUnits;
  rgStorageMode: RgStorageMode;
  strText: string;
  rgSegGraphemeToUtf16: number[];
  rgIdStyleRef: number[];
  mpId_StyleEntry: Record<number, StyleEntry>;
  idStyleDefault: number;
}
