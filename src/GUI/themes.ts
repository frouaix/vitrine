// Copyright (c) 2026 François Rouaix

// Theme definitions for GUI controls

import type { ThemeDefinition, ControlStyle } from './types.ts';
import { GUIControlType } from './types.ts';

// Light theme
const lightButtonStyle: ControlStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#d1d5db',
  borderWidth: 1,
  borderRadius: 8,
  textColor: '#1f2937',
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 14,
  hoverBackgroundColor: '#f3f4f6',
  activeBackgroundColor: '#e5e7eb',
  disabledBackgroundColor: '#f9fafb',
  disabledTextColor: '#9ca3af',
  focusBorderColor: '#3b82f6'
};

export const lightTheme: ThemeDefinition = {
  name: 'light',
  styles: {
    'primary-button': {
      ...lightButtonStyle,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      hoverBackgroundColor: '#2563eb',
      activeBackgroundColor: '#1d4ed8',
      borderColor: '#3b82f6'
    },
    'danger-button': {
      ...lightButtonStyle,
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
      hoverBackgroundColor: '#dc2626',
      activeBackgroundColor: '#b91c1c',
      borderColor: '#ef4444'
    }
  },
  defaults: {
    [GUIControlType.Button]: lightButtonStyle,
    [GUIControlType.TextBox]: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 1,
      borderRadius: 8,
      textColor: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      focusBorderColor: '#3b82f6',
      disabledBackgroundColor: '#f9fafb',
      disabledTextColor: '#9ca3af'
    },
    [GUIControlType.CheckBox]: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 2,
      borderRadius: 5,
      textColor: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      checkedBackgroundColor: '#3b82f6',
      focusBorderColor: '#3b82f6'
    },
    [GUIControlType.RadioButton]: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 2,
      borderRadius: 14,
      textColor: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      checkedBackgroundColor: '#3b82f6',
      focusBorderColor: '#3b82f6'
    },
    [GUIControlType.Slider]: {
      sliderTrackColor: '#d1d5db',
      sliderThumbColor: '#3b82f6',
      textColor: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 1,
      borderRadius: 8,
      textColor: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      hoverBackgroundColor: '#f3f4f6',
      focusBorderColor: '#3b82f6'
    },
    [GUIControlType.Label]: {
      textColor: '#1f2937',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 10,
      duPadding: 20,
      textColor: '#1f2937',
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
  backgroundColor: '#374151',
  borderColor: '#4b5563',
  borderWidth: 1,
  borderRadius: 8,
  textColor: '#f9fafb',
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 14,
  hoverBackgroundColor: '#4b5563',
  activeBackgroundColor: '#6b7280',
  disabledBackgroundColor: '#1f2937',
  disabledTextColor: '#6b7280',
  focusBorderColor: '#60a5fa'
};

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  styles: {
    'primary-button': {
      ...darkButtonStyle,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      hoverBackgroundColor: '#2563eb',
      activeBackgroundColor: '#1d4ed8',
      borderColor: '#3b82f6'
    },
    'danger-button': {
      ...darkButtonStyle,
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
      hoverBackgroundColor: '#dc2626',
      activeBackgroundColor: '#b91c1c',
      borderColor: '#ef4444'
    }
  },
  defaults: {
    [GUIControlType.Button]: darkButtonStyle,
    [GUIControlType.TextBox]: {
      backgroundColor: '#1f2937',
      borderColor: '#4b5563',
      borderWidth: 1,
      borderRadius: 8,
      textColor: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      focusBorderColor: '#60a5fa',
      disabledBackgroundColor: '#111827',
      disabledTextColor: '#6b7280'
    },
    [GUIControlType.CheckBox]: {
      backgroundColor: '#1f2937',
      borderColor: '#4b5563',
      borderWidth: 2,
      borderRadius: 5,
      textColor: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      checkedBackgroundColor: '#3b82f6',
      focusBorderColor: '#60a5fa'
    },
    [GUIControlType.RadioButton]: {
      backgroundColor: '#1f2937',
      borderColor: '#4b5563',
      borderWidth: 2,
      borderRadius: 14,
      textColor: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      checkedBackgroundColor: '#3b82f6',
      focusBorderColor: '#60a5fa'
    },
    [GUIControlType.Slider]: {
      sliderTrackColor: '#4b5563',
      sliderThumbColor: '#3b82f6',
      textColor: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      backgroundColor: '#1f2937',
      borderColor: '#4b5563',
      borderWidth: 1,
      borderRadius: 8,
      textColor: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 14,
      hoverBackgroundColor: '#374151',
      focusBorderColor: '#60a5fa'
    },
    [GUIControlType.Label]: {
      textColor: '#f9fafb',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      borderRadius: 10,
      duPadding: 20,
      textColor: '#f9fafb',
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
  backgroundColor: '#fbbf24',
  borderColor: '#f59e0b',
  borderWidth: 2,
  borderRadius: 14,
  textColor: '#1f2937',
  fontSize: 17,
  fontFamily: 'system-ui, sans-serif',
  duPadding: 15,
  hoverBackgroundColor: '#fcd34d',
  activeBackgroundColor: '#f59e0b',
  disabledBackgroundColor: '#fef3c7',
  disabledTextColor: '#9ca3af',
  focusBorderColor: '#ec4899'
};

export const colorfulTheme: ThemeDefinition = {
  name: 'colorful',
  styles: {
    'primary-button': {
      ...colorfulButtonStyle,
      backgroundColor: '#ec4899',
      textColor: '#ffffff',
      hoverBackgroundColor: '#db2777',
      activeBackgroundColor: '#be185d',
      borderColor: '#ec4899'
    },
    'danger-button': {
      ...colorfulButtonStyle,
      backgroundColor: '#f97316',
      textColor: '#ffffff',
      hoverBackgroundColor: '#ea580c',
      activeBackgroundColor: '#c2410c',
      borderColor: '#f97316'
    }
  },
  defaults: {
    [GUIControlType.Button]: colorfulButtonStyle,
    [GUIControlType.TextBox]: {
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
      borderWidth: 2,
      borderRadius: 14,
      textColor: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 15,
      focusBorderColor: '#ec4899',
      disabledBackgroundColor: '#fffbeb',
      disabledTextColor: '#9ca3af'
    },
    [GUIControlType.CheckBox]: {
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
      borderWidth: 2,
      borderRadius: 7,
      textColor: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      checkedBackgroundColor: '#10b981',
      focusBorderColor: '#ec4899'
    },
    [GUIControlType.RadioButton]: {
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
      borderWidth: 2,
      borderRadius: 16,
      textColor: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      checkedBackgroundColor: '#10b981',
      focusBorderColor: '#ec4899'
    },
    [GUIControlType.Slider]: {
      sliderTrackColor: '#fbbf24',
      sliderThumbColor: '#ec4899',
      textColor: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Dropdown]: {
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
      borderWidth: 2,
      borderRadius: 14,
      textColor: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif',
      duPadding: 15,
      hoverBackgroundColor: '#fde68a',
      focusBorderColor: '#ec4899'
    },
    [GUIControlType.Label]: {
      textColor: '#1f2937',
      fontSize: 17,
      fontFamily: 'system-ui, sans-serif'
    },
    [GUIControlType.Panel]: {
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
      borderWidth: 2,
      borderRadius: 18,
      duPadding: 24,
      textColor: '#1f2937',
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
