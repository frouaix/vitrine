// Copyright (c) 2026 François Rouaix

// GUI DSL type definitions for high-level UI controls

import type { Block } from '../core/types.ts';
import type { ColorPickerProps } from './color-picker.ts';
import type { CalendarDayViewProps, CalendarMonthViewProps } from './calendar-types.ts';

export type GUIColor = string; // CSS color format
export type Rs = { width: number; height: number };
export type LayoutDirection = 'horizontal' | 'vertical';

// GUI control types
export enum GUIControlType {
  // Interactive controls
  TextBox = 'textbox',
  CheckBox = 'checkbox',
  RadioButton = 'radiobutton',
  Button = 'button',
  Slider = 'slider',
  Dropdown = 'dropdown',
  ColorPicker = 'colorpicker',
  
  // Layout controls
  HStack = 'hstack',
  VStack = 'vstack',
  Carousel = 'carousel',
  Grid = 'grid',
  
  // Content controls
  Label = 'label',
  Image = 'image',
  Panel = 'panel',
  
  // Calendar controls
  CalendarDayView = 'calendardayview',
  CalendarMonthView = 'calendarmonthview'
}

// Base properties for all GUI controls
export interface GUIBaseProps {
  id?: string;
  className?: string;
  fVisible?: boolean;
  fEnabled?: boolean;
  dx?: number;
  dy?: number;
  x?: number;
  y?: number;
}

// Interactive control properties
export interface TextBoxProps extends GUIBaseProps {
  stValue?: string;
  stPlaceholder?: string;
  fMultiline?: boolean;
  maxLength?: number;
  onChange?: (stValue: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: (event: PointerEvent) => void;
  onHover?: (event: PointerEvent) => void;
}

export interface CheckBoxProps extends GUIBaseProps {
  fChecked?: boolean;
  stLabel?: string;
  onChange?: (fChecked: boolean) => void;
  onHover?: (event: PointerEvent) => void;
}

export interface RadioButtonProps extends GUIBaseProps {
  fChecked?: boolean;
  stLabel?: string;
  stValue?: string;
  group?: string;
  onChange?: (stValue: string) => void;
  onHover?: (event: PointerEvent) => void;
}

export interface ButtonProps extends GUIBaseProps {
  stLabel?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  onHover?: (event: PointerEvent) => void;
}

export interface SliderProps extends GUIBaseProps {
  orientation?: 'horizontal' | 'vertical';
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onHover?: (event: PointerEvent) => void;
}

export interface DropdownProps extends GUIBaseProps {
  stValue?: string;
  options: Array<{ stLabel?: string; value: string }>;
  stPlaceholder?: string;
  fOpen?: boolean;
  onChange?: (stValue: string) => void;
  onToggle?: (fOpen: boolean) => void;
  onClick?: (event: PointerEvent) => void;
  onHover?: (event: PointerEvent) => void;
}

// Layout control properties
export type Alignment = 'start' | 'center' | 'end' | 'stretch';

export interface StackLayoutProps extends GUIBaseProps {
  duPadding?: number;
  duSpacing?: number;
  alignment?: Alignment;
}

export interface CarouselProps extends GUIBaseProps {
  currentIndex?: number;
  fAutoPlay?: boolean;
  interval?: number;
  onIndexChange?: (index: number) => void;
}

export interface GridProps extends GUIBaseProps {
  cColumns?: number;
  rows?: number;
  duPadding?: number;
  duSpacing?: number;
}

// Content control properties
export interface LabelProps extends GUIBaseProps {
  stText?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export interface GUIImageProps extends GUIBaseProps {
  src: string | HTMLImageElement;
  fit?: 'cover' | 'contain' | 'fill';
}

export interface PanelProps extends GUIBaseProps {
  stTitle?: string;
  duPadding?: number;
}

export type GUIPropsByType = {
  [GUIControlType.TextBox]: TextBoxProps;
  [GUIControlType.CheckBox]: CheckBoxProps;
  [GUIControlType.RadioButton]: RadioButtonProps;
  [GUIControlType.Button]: ButtonProps;
  [GUIControlType.Slider]: SliderProps;
  [GUIControlType.Dropdown]: DropdownProps;
  [GUIControlType.ColorPicker]: ColorPickerProps;
  [GUIControlType.HStack]: StackLayoutProps & { direction?: never };
  [GUIControlType.VStack]: StackLayoutProps & { direction?: never };
  [GUIControlType.Carousel]: CarouselProps;
  [GUIControlType.Grid]: GridProps;
  [GUIControlType.Label]: LabelProps;
  [GUIControlType.Image]: GUIImageProps;
  [GUIControlType.Panel]: PanelProps;
  [GUIControlType.CalendarDayView]: CalendarDayViewProps;
  [GUIControlType.CalendarMonthView]: CalendarMonthViewProps;
};

export type GUIControlForType<T extends GUIControlType = GUIControlType> = {
  type: T;
  props: GUIPropsByType[T];
  children?: GUIControl[];
};

export type GUIControl = {
  [T in GUIControlType]: GUIControlForType<T>;
}[GUIControlType];

export type GUIControlOfType<T extends GUIControlType> = Extract<GUIControl, { type: T }>;

// Theme system
export interface ControlStyle {
  colBg?: GUIColor;
  colBgActive?: GUIColor;
  colBgChecked?: GUIColor;
  colBgDisabled?: GUIColor;
  colBgHover?: GUIColor;
  colBorder?: GUIColor;
  colBorderFocus?: GUIColor;
  colSliderThumb?: GUIColor;
  colSliderTrack?: GUIColor;
  colText?: GUIColor;
  colTextDisabled?: GUIColor;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  duPadding?: number;
}

export interface ThemeDefinition {
  name: string;
  styles: {
    [className: string]: ControlStyle;
  };
  defaults: {
    [controlType: string]: ControlStyle;
  };
}

// Transformation context for converting GUI DSL to Core DSL
export interface TransformContext {
  theme: ThemeDefinition;
  controlStates?: Map<string, any>;
}
