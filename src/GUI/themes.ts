// Copyright (c) 2026 François Rouaix

// Theme definitions for GUI controls

import type { ThemeDefinition, ControlStyle } from './types.ts';
import { GUIControlType } from './types.ts';

// Light theme
const lightButtonStyle: ControlStyle = {
  colBackground: '#ffffff',
  colBorder: '#d1d5db',
  borderWidth: 1,
  borderRadius: 8,
  colText: '#1f2937',
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 14,
  colHoverBackground: '#f3f4f6',
  colActiveBackground: '#e5e7eb',
  colDisabledBackground: '#f9fafb',
  colDisabledText: '#9ca3af',
  colFocusBorder: '#3b82f6'
};

export const lightTheme: ThemeDefinition = {
  name: 'light',
  styles: {
    'primary-button': {
      ...lightButtonStyle,
      colBackground: '#3b82f6',
      colText: '#ffffff',
      colHoverBackground: '#2563eb',
      colActiveBackground: '#1d4ed8',
      colBorder: '#3b82f6'
    },
    'danger-button': {
      ...lightButtonStyle,
      colBackground: '#ef4444',
      colText: '#ffffff',
      colHoverBackground: '#dc2626',
      colActiveBackground: '#b91c1c',
      colBorder: '#ef4444'
    }
  },
  defaults: {
    [GUIControlType.Button]: lightButtonStyle,
    [GUIControlType.TextBox]: {
      colBackground: '#ffffff',
      colBorder: '#d1d5db',
      borderWidth: 1,
      borderRadius: 8,
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      colFocusBorder: '#3b82f6',
      colDisabledBackground: '#f9fafb',
      colDisabledText: '#9ca3af'
    },
    [GUIControlType.CheckBox]: {
      colBackground: '#ffffff',
      colBorder: '#d1d5db',
      borderWidth: 2,
      borderRadius: 5,
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      colCheckedBackground: '#3b82f6',
      colFocusBorder: '#3b82f6'
    },
    [GUIControlType.RadioButton]: {
      colBackground: '#ffffff',
      colBorder: '#d1d5db',
      borderWidth: 2,
      borderRadius: 14,
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      colCheckedBackground: '#3b82f6',
      colFocusBorder: '#3b82f6'
    },
    [GUIControlType.Slider]: {
      colSliderTrack: '#d1d5db',
      colSliderThumb: '#3b82f6',
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      colBackground: '#ffffff',
      colBorder: '#d1d5db',
      borderWidth: 1,
      borderRadius: 8,
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      colHoverBackground: '#f3f4f6',
      colFocusBorder: '#3b82f6'
    },
    [GUIControlType.Label]: {
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      colBackground: '#ffffff',
      colBorder: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 10,
      duPadding: 20,
      colText: '#1f2937',
      fontSize: 18,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Stack]: {},
    [GUIControlType.HStack]: {},
    [GUIControlType.VStack]: {},
    [GUIControlType.Grid]: {},
    [GUIControlType.Carousel]: {},
    [GUIControlType.Image]: {}
  }
};

// Dark theme
const darkButtonStyle: ControlStyle = {
  colBackground: '#374151',
  colBorder: '#4b5563',
  borderWidth: 1,
  borderRadius: 8,
  colText: '#f9fafb',
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 14,
  colHoverBackground: '#4b5563',
  colActiveBackground: '#6b7280',
  colDisabledBackground: '#1f2937',
  colDisabledText: '#6b7280',
  colFocusBorder: '#60a5fa'
};

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  styles: {
    'primary-button': {
      ...darkButtonStyle,
      colBackground: '#3b82f6',
      colText: '#ffffff',
      colHoverBackground: '#2563eb',
      colActiveBackground: '#1d4ed8',
      colBorder: '#3b82f6'
    },
    'danger-button': {
      ...darkButtonStyle,
      colBackground: '#ef4444',
      colText: '#ffffff',
      colHoverBackground: '#dc2626',
      colActiveBackground: '#b91c1c',
      colBorder: '#ef4444'
    }
  },
  defaults: {
    [GUIControlType.Button]: darkButtonStyle,
    [GUIControlType.TextBox]: {
      colBackground: '#1f2937',
      colBorder: '#4b5563',
      borderWidth: 1,
      borderRadius: 8,
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      colFocusBorder: '#60a5fa',
      colDisabledBackground: '#111827',
      colDisabledText: '#6b7280'
    },
    [GUIControlType.CheckBox]: {
      colBackground: '#1f2937',
      colBorder: '#4b5563',
      borderWidth: 2,
      borderRadius: 5,
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      colCheckedBackground: '#3b82f6',
      colFocusBorder: '#60a5fa'
    },
    [GUIControlType.RadioButton]: {
      colBackground: '#1f2937',
      colBorder: '#4b5563',
      borderWidth: 2,
      borderRadius: 14,
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      colCheckedBackground: '#3b82f6',
      colFocusBorder: '#60a5fa'
    },
    [GUIControlType.Slider]: {
      colSliderTrack: '#4b5563',
      colSliderThumb: '#3b82f6',
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      colBackground: '#1f2937',
      colBorder: '#4b5563',
      borderWidth: 1,
      borderRadius: 8,
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      colHoverBackground: '#374151',
      colFocusBorder: '#60a5fa'
    },
    [GUIControlType.Label]: {
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      colBackground: '#1f2937',
      colBorder: '#374151',
      borderWidth: 1,
      borderRadius: 10,
      duPadding: 20,
      colText: '#f9fafb',
      fontSize: 18,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Stack]: {},
    [GUIControlType.HStack]: {},
    [GUIControlType.VStack]: {},
    [GUIControlType.Grid]: {},
    [GUIControlType.Carousel]: {},
    [GUIControlType.Image]: {}
  }
};

// Colorful theme
const colorfulButtonStyle: ControlStyle = {
  colBackground: '#fbbf24',
  colBorder: '#f59e0b',
  borderWidth: 2,
  borderRadius: 14,
  colText: '#1f2937',
  fontSize: 17,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 15,
  colHoverBackground: '#fcd34d',
  colActiveBackground: '#f59e0b',
  colDisabledBackground: '#fef3c7',
  colDisabledText: '#9ca3af',
  colFocusBorder: '#ec4899'
};

export const colorfulTheme: ThemeDefinition = {
  name: 'colorful',
  styles: {
    'primary-button': {
      ...colorfulButtonStyle,
      colBackground: '#ec4899',
      colText: '#ffffff',
      colHoverBackground: '#db2777',
      colActiveBackground: '#be185d',
      colBorder: '#ec4899'
    },
    'danger-button': {
      ...colorfulButtonStyle,
      colBackground: '#f97316',
      colText: '#ffffff',
      colHoverBackground: '#ea580c',
      colActiveBackground: '#c2410c',
      colBorder: '#f97316'
    }
  },
  defaults: {
    [GUIControlType.Button]: colorfulButtonStyle,
    [GUIControlType.TextBox]: {
      colBackground: '#fef3c7',
      colBorder: '#fbbf24',
      borderWidth: 2,
      borderRadius: 14,
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 15,
      colFocusBorder: '#ec4899',
      colDisabledBackground: '#fffbeb',
      colDisabledText: '#9ca3af'
    },
    [GUIControlType.CheckBox]: {
      colBackground: '#fef3c7',
      colBorder: '#fbbf24',
      borderWidth: 2,
      borderRadius: 7,
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      colCheckedBackground: '#10b981',
      colFocusBorder: '#ec4899'
    },
    [GUIControlType.RadioButton]: {
      colBackground: '#fef3c7',
      colBorder: '#fbbf24',
      borderWidth: 2,
      borderRadius: 16,
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      colCheckedBackground: '#10b981',
      colFocusBorder: '#ec4899'
    },
    [GUIControlType.Slider]: {
      colSliderTrack: '#fbbf24',
      colSliderThumb: '#ec4899',
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      colBackground: '#fef3c7',
      colBorder: '#fbbf24',
      borderWidth: 2,
      borderRadius: 14,
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 15,
      colHoverBackground: '#fde68a',
      colFocusBorder: '#ec4899'
    },
    [GUIControlType.Label]: {
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      colBackground: '#fef3c7',
      colBorder: '#fbbf24',
      borderWidth: 2,
      borderRadius: 18,
      duPadding: 24,
      colText: '#1f2937',
      fontSize: 18,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Stack]: {},
    [GUIControlType.HStack]: {},
    [GUIControlType.VStack]: {},
    [GUIControlType.Grid]: {},
    [GUIControlType.Carousel]: {},
    [GUIControlType.Image]: {}
  }
};

// Theme registry
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  colorful: colorfulTheme
};

export function getTheme(name: string): ThemeDefinition {
  return themes[name as keyof typeof themes] || lightTheme;
}
