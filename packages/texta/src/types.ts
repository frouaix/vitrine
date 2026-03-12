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

export interface SemanticStyleMeta {
  token?: string;
  state?: string;
  variant?: string;
  [sKey: string]: unknown;
}

export interface SemanticStyleEntry extends StyleEntry {
  mpSemantic?: SemanticStyleMeta;
}

export interface RenderStyleEntry extends StyleEntry {}

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

export interface AttributedTextValueSemantic
  extends Omit<AttributedTextValue, "mpId_StyleEntry"> {
  mpId_StyleEntry: Record<number, SemanticStyleEntry>;
}

export interface AttributedTextValueRender
  extends Omit<AttributedTextValue, "mpId_StyleEntry"> {
  mpId_StyleEntry: Record<number, RenderStyleEntry>;
}
