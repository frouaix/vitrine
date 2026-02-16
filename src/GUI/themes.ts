// Copyright (c) 2026 François Rouaix

// Theme definitions for GUI controls

import type { ThemeDefinition, ControlStyle } from './types.ts';
import { GUIControlType } from './types.ts';

// Light theme
const lightButtonStyle: ControlStyle = {
  colBackground: '#ffffff',
  colBgActive: '#e5e7eb',
  colBgDisabled: '#f9fafb',
  colBgHover: '#f3f4f6',
  colBorder: '#d1d5db',
  colBorderFocus: '#3b82f6',
  colText: '#1f2937',
  colTextDisabled: '#9ca3af',
  borderWidth: 1,
  borderRadius: 8,
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 14
};

export const lightTheme: ThemeDefinition = {
  name: 'light',
  styles: {
    'primary-button': {
      ...lightButtonStyle,
      colBackground: '#3b82f6',
      colBgActive: '#1d4ed8',
      colBgHover: '#2563eb',
      colBorder: '#3b82f6',
      colText: '#ffffff',
    },
    'danger-button': {
      ...lightButtonStyle,
      colBackground: '#ef4444',
      colBgActive: '#b91c1c',
      colBgHover: '#dc2626',
      colBorder: '#ef4444',
      colText: '#ffffff',
    }
  },
  defaults: {
    [GUIControlType.Button]: lightButtonStyle,
    [GUIControlType.TextBox]: {
      colBackground: '#ffffff',
      colBgDisabled: '#f9fafb',
      colBorder: '#d1d5db',
      colBorderFocus: '#3b82f6',
      colText: '#1f2937',
      colTextDisabled: '#9ca3af',
      borderWidth: 1,
      borderRadius: 8,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14
    },
    [GUIControlType.CheckBox]: {
      colBackground: '#ffffff',
      colBgChecked: '#3b82f6',
      colBorder: '#d1d5db',
      colBorderFocus: '#3b82f6',
      colText: '#1f2937',
      borderWidth: 2,
      borderRadius: 5,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.RadioButton]: {
      colBackground: '#ffffff',
      colBgChecked: '#3b82f6',
      colBorder: '#d1d5db',
      colBorderFocus: '#3b82f6',
      colText: '#1f2937',
      borderWidth: 2,
      borderRadius: 14,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Slider]: {
      colSliderThumb: '#3b82f6',
      colSliderTrack: '#d1d5db',
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      colBackground: '#ffffff',
      colBgHover: '#f3f4f6',
      colBorder: '#d1d5db',
      colBorderFocus: '#3b82f6',
      colText: '#1f2937',
      borderWidth: 1,
      borderRadius: 8,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14
    },
    [GUIControlType.Label]: {
      colText: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      colBackground: '#ffffff',
      colBorder: '#e5e7eb',
      colText: '#1f2937',
      borderWidth: 1,
      borderRadius: 10,
      fontSize: 18,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 20
    },
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
  colBgActive: '#6b7280',
  colBgDisabled: '#1f2937',
  colBgHover: '#4b5563',
  colBorder: '#4b5563',
  colBorderFocus: '#60a5fa',
  colText: '#f9fafb',
  colTextDisabled: '#6b7280',
  borderWidth: 1,
  borderRadius: 8,
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 14
};

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  styles: {
    'primary-button': {
      ...darkButtonStyle,
      colBackground: '#3b82f6',
      colBgActive: '#1d4ed8',
      colBgHover: '#2563eb',
      colBorder: '#3b82f6',
      colText: '#ffffff',
    },
    'danger-button': {
      ...darkButtonStyle,
      colBackground: '#ef4444',
      colBgActive: '#b91c1c',
      colBgHover: '#dc2626',
      colBorder: '#ef4444',
      colText: '#ffffff',
    }
  },
  defaults: {
    [GUIControlType.Button]: darkButtonStyle,
    [GUIControlType.TextBox]: {
      colBackground: '#1f2937',
      colBgDisabled: '#111827',
      colBorder: '#4b5563',
      colBorderFocus: '#60a5fa',
      colText: '#f9fafb',
      colTextDisabled: '#6b7280',
      borderWidth: 1,
      borderRadius: 8,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14
    },
    [GUIControlType.CheckBox]: {
      colBackground: '#1f2937',
      colBgChecked: '#3b82f6',
      colBorder: '#4b5563',
      colBorderFocus: '#60a5fa',
      colText: '#f9fafb',
      borderWidth: 2,
      borderRadius: 5,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.RadioButton]: {
      colBackground: '#1f2937',
      colBgChecked: '#3b82f6',
      colBorder: '#4b5563',
      colBorderFocus: '#60a5fa',
      colText: '#f9fafb',
      borderWidth: 2,
      borderRadius: 14,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Slider]: {
      colSliderThumb: '#3b82f6',
      colSliderTrack: '#4b5563',
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      colBackground: '#1f2937',
      colBgHover: '#374151',
      colBorder: '#4b5563',
      colBorderFocus: '#60a5fa',
      colText: '#f9fafb',
      borderWidth: 1,
      borderRadius: 8,
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14
    },
    [GUIControlType.Label]: {
      colText: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      colBackground: '#1f2937',
      colBorder: '#374151',
      colText: '#f9fafb',
      borderWidth: 1,
      borderRadius: 10,
      fontSize: 18,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 20
    },
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
  colBgActive: '#f59e0b',
  colBgDisabled: '#fef3c7',
  colBgHover: '#fcd34d',
  colBorder: '#f59e0b',
  colBorderFocus: '#ec4899',
  colText: '#1f2937',
  colTextDisabled: '#9ca3af',
  borderWidth: 2,
  borderRadius: 14,
  fontSize: 17,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 15
};

export const colorfulTheme: ThemeDefinition = {
  name: 'colorful',
  styles: {
    'primary-button': {
      ...colorfulButtonStyle,
      colBackground: '#ec4899',
      colBgActive: '#be185d',
      colBgHover: '#db2777',
      colBorder: '#ec4899',
      colText: '#ffffff',
    },
    'danger-button': {
      ...colorfulButtonStyle,
      colBackground: '#f97316',
      colBgActive: '#c2410c',
      colBgHover: '#ea580c',
      colBorder: '#f97316',
      colText: '#ffffff',
    }
  },
  defaults: {
    [GUIControlType.Button]: colorfulButtonStyle,
    [GUIControlType.TextBox]: {
      colBackground: '#fef3c7',
      colBgDisabled: '#fffbeb',
      colBorder: '#fbbf24',
      colBorderFocus: '#ec4899',
      colText: '#1f2937',
      colTextDisabled: '#9ca3af',
      borderWidth: 2,
      borderRadius: 14,
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 15
    },
    [GUIControlType.CheckBox]: {
      colBackground: '#fef3c7',
      colBgChecked: '#10b981',
      colBorder: '#fbbf24',
      colBorderFocus: '#ec4899',
      colText: '#1f2937',
      borderWidth: 2,
      borderRadius: 7,
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.RadioButton]: {
      colBackground: '#fef3c7',
      colBgChecked: '#10b981',
      colBorder: '#fbbf24',
      colBorderFocus: '#ec4899',
      colText: '#1f2937',
      borderWidth: 2,
      borderRadius: 16,
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Slider]: {
      colSliderThumb: '#ec4899',
      colSliderTrack: '#fbbf24',
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      colBackground: '#fef3c7',
      colBgHover: '#fde68a',
      colBorder: '#fbbf24',
      colBorderFocus: '#ec4899',
      colText: '#1f2937',
      borderWidth: 2,
      borderRadius: 14,
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 15
    },
    [GUIControlType.Label]: {
      colText: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      colBackground: '#fef3c7',
      colBorder: '#fbbf24',
      colText: '#1f2937',
      borderWidth: 2,
      borderRadius: 18,
      fontSize: 18,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 24
    },
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
