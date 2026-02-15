// GUI DSL type definitions for high-level UI controls

import type { Block } from '../core/types.ts';

export type GUIColor = string; // CSS color format

// GUI control types
export enum GUIControlType {
  // Interactive controls
  TextBox = 'textbox',
  CheckBox = 'checkbox',
  RadioButton = 'radiobutton',
  Button = 'button',
  Slider = 'slider',
  Dropdown = 'dropdown',
  
  // Layout controls
  Stack = 'stack',
  HStack = 'hstack',
  VStack = 'vstack',
  Carousel = 'carousel',
  Grid = 'grid',
  
  // Content controls
  Label = 'label',
  Image = 'image',
  Panel = 'panel'
}

// Base properties for all GUI controls
export interface GUIBaseProps {
  id?: string;
  className?: string;
  fVisible?: boolean;
  fEnabled?: boolean;
  visible?: boolean;
  enabled?: boolean;
  dx?: number;
  dy?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

// Interactive control properties
export interface TextBoxProps extends GUIBaseProps {
  stValue?: string;
  stPlaceholder?: string;
  fMultiline?: boolean;
  value?: string;
  placeholder?: string;
  multiline?: boolean;
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
  checked?: boolean;
  label?: string;
  onChange?: (fChecked: boolean) => void;
  onHover?: (event: PointerEvent) => void;
}

export interface RadioButtonProps extends GUIBaseProps {
  fChecked?: boolean;
  stLabel?: string;
  checked?: boolean;
  label?: string;
  value?: string;
  group?: string;
  onChange?: (stValue: string) => void;
  onHover?: (event: PointerEvent) => void;
}

export interface ButtonProps extends GUIBaseProps {
  stLabel?: string;
  label?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  onHover?: (event: PointerEvent) => void;
}

export interface SliderProps extends GUIBaseProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onHover?: (event: PointerEvent) => void;
}

export interface DropdownProps extends GUIBaseProps {
  value?: string;
  options: Array<{ stLabel?: string; label?: string; value: string }>;
  stPlaceholder?: string;
  placeholder?: string;
  onChange?: (stValue: string) => void;
  onClick?: (event: PointerEvent) => void;
  onHover?: (event: PointerEvent) => void;
}

// Layout control properties
export type StackDirection = 'horizontal' | 'vertical';
export type Alignment = 'start' | 'center' | 'end' | 'stretch';

export interface StackProps extends GUIBaseProps {
  direction?: StackDirection;
  spacing?: number;
  alignment?: Alignment;
  padding?: number;
}

export interface HStackProps extends GUIBaseProps {
  spacing?: number;
  alignment?: Alignment;
  padding?: number;
}

export interface VStackProps extends GUIBaseProps {
  spacing?: number;
  alignment?: Alignment;
  padding?: number;
}

export interface CarouselProps extends GUIBaseProps {
  currentIndex?: number;
  fAutoPlay?: boolean;
  autoPlay?: boolean;
  interval?: number;
  onIndexChange?: (index: number) => void;
}

export interface GridProps extends GUIBaseProps {
  columns?: number;
  rows?: number;
  spacing?: number;
  padding?: number;
}

// Content control properties
export interface LabelProps extends GUIBaseProps {
  stText?: string;
  text?: string;
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
  title?: string;
  padding?: number;
}

export type GUIPropsByType = {
  [GUIControlType.TextBox]: TextBoxProps;
  [GUIControlType.CheckBox]: CheckBoxProps;
  [GUIControlType.RadioButton]: RadioButtonProps;
  [GUIControlType.Button]: ButtonProps;
  [GUIControlType.Slider]: SliderProps;
  [GUIControlType.Dropdown]: DropdownProps;
  [GUIControlType.Stack]: StackProps;
  [GUIControlType.HStack]: HStackProps;
  [GUIControlType.VStack]: VStackProps;
  [GUIControlType.Carousel]: CarouselProps;
  [GUIControlType.Grid]: GridProps;
  [GUIControlType.Label]: LabelProps;
  [GUIControlType.Image]: GUIImageProps;
  [GUIControlType.Panel]: PanelProps;
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
  backgroundColor?: GUIColor;
  borderColor?: GUIColor;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: GUIColor;
  fontSize?: number;
  fontFamily?: string;
  padding?: number;
  hoverBackgroundColor?: GUIColor;
  activeBackgroundColor?: GUIColor;
  disabledBackgroundColor?: GUIColor;
  disabledTextColor?: GUIColor;
  focusBorderColor?: GUIColor;
  checkedBackgroundColor?: GUIColor;
  sliderTrackColor?: GUIColor;
  sliderThumbColor?: GUIColor;
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
