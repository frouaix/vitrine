// Copyright (c) 2026 François Rouaix

export function resolveFlag(props: Record<string, unknown>, stFlag: string, legacyFlag: string): boolean | undefined {
  const fPrimary = props[stFlag] as boolean | undefined;
  const fLegacy = props[legacyFlag] as boolean | undefined;
  return fPrimary ?? fLegacy;
}

export function resolveUserString(props: Record<string, unknown>, stKey: string, legacyKey: string): string | undefined {
  const stPrimary = props[stKey] as string | undefined;
  const stLegacy = props[legacyKey] as string | undefined;
  return stPrimary ?? stLegacy;
}

export function resolveDx(props: { dx?: number; width?: number }, dxDefault: number): number {
  const { dx, width } = props;
  return dx ?? width ?? dxDefault;
}

export function resolveDy(props: { dy?: number; height?: number }, dyDefault: number): number {
  const { dy, height } = props;
  return dy ?? height ?? dyDefault;
}
