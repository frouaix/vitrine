// Copyright (c) 2026 François Rouaix

export function resolveFlag(props: Record<string, unknown>, stFlag: string): boolean | undefined {
  const fPrimary = props[stFlag] as boolean | undefined;
  return fPrimary;
}

export function resolveUserString(props: Record<string, unknown>, stKey: string): string | undefined {
  const stPrimary = props[stKey] as string | undefined;
  return stPrimary;
}

export function resolveDx(props: { dx?: number }, dxDefault: number): number {
  const { dx } = props;
  return dx ?? dxDefault;
}

export function resolveDy(props: { dy?: number }, dyDefault: number): number {
  const { dy } = props;
  return dy ?? dyDefault;
}
