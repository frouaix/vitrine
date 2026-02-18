// Copyright (c) 2026 François Rouaix

// GUI DSL type definitions for high-level UI controls

// Re-export per-control props from their directories
export type { TextBoxProps } from './textbox/propsTextBox.ts';
export type { CheckBoxProps } from './checkbox/propsCheckBox.ts';
export type { RadioButtonProps } from './radiobutton/propsRadioButton.ts';
export type { ButtonProps } from './button/propsButton.ts';
export type { SliderProps } from './slider/propsSlider.ts';
export type { DropdownProps } from './dropdown/propsDropdown.ts';
export type { ColorPickerProps, ColorPickerChange } from './colorpicker/propsColorPicker.ts';
export type { StackLayoutProps } from './hstack/propsHStack.ts';
export type { CarouselProps } from './carousel/propsCarousel.ts';
export type { GridProps } from './grid/propsGrid.ts';
export type { LabelProps } from './label/propsLabel.ts';
export type { GUIImageProps } from './image/propsImage.ts';
export type { PanelProps } from './panel/propsPanel.ts';
export type {
  CalendarEvent,
  DateRange,
  CalendarViewBaseProps,
  CalendarDayViewProps,
  CalendarMonthViewProps,
  CalendarNavProps
} from './calendar/propsCalendar.ts';
export { CalendarViewType } from './calendar/propsCalendar.ts';

// Import the concrete types for use in GUIPropsByType
import type { TextBoxProps } from './textbox/propsTextBox.ts';
import type { CheckBoxProps } from './checkbox/propsCheckBox.ts';
import type { RadioButtonProps } from './radiobutton/propsRadioButton.ts';
import type { ButtonProps } from './button/propsButton.ts';
import type { SliderProps } from './slider/propsSlider.ts';
import type { DropdownProps } from './dropdown/propsDropdown.ts';
import type { ColorPickerProps } from './colorpicker/propsColorPicker.ts';
import type { StackLayoutProps } from './hstack/propsHStack.ts';
import type { CarouselProps } from './carousel/propsCarousel.ts';
import type { GridProps } from './grid/propsGrid.ts';
import type { LabelProps } from './label/propsLabel.ts';
import type { GUIImageProps } from './image/propsImage.ts';
import type { PanelProps } from './panel/propsPanel.ts';
import type { CalendarDayViewProps, CalendarMonthViewProps } from './calendar/propsCalendar.ts';

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

export type Alignment = 'start' | 'center' | 'end' | 'stretch';

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
