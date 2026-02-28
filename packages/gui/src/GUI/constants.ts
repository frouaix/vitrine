// Copyright (c) 2026 François Rouaix

// Shared constants and helpers for GUI DSL

import type { GUIControl, ControlStyle, TransformContext } from './types.ts';

export const COMMON_DEFAULTS = {
  x: 0,
  y: 0,
  duAxisStart: 0,
  duPadding: 0,
  duSpacing: 10,
  stEmpty: ''
} as const;

export const TEXT_DEFAULTS = {
  alignCenter: 'center',
  baselineMiddle: 'middle'
} as const;

export const FALLBACK_DEFAULTS = {
  dx: 100,
  dy: 40
} as const;

// Helper to get style for a control from the theme
export function getControlStyle(
  control: GUIControl,
  context: TransformContext
): ControlStyle {
  const { theme } = context;
  const { props, type } = control;
  const { className } = props;

  if (className && theme.styles[className]) {
    return { ...(theme.defaults[type] || {}), ...theme.styles[className] };
  }

  return theme.defaults[type] || {};
}

// Legacy aggregate object kept for backward compatibility within transform.ts
export const GUI_DEFAULTS = {
  common: COMMON_DEFAULTS,
  text: TEXT_DEFAULTS,
  fallback: FALLBACK_DEFAULTS
} as const;

