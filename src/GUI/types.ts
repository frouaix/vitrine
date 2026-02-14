// GUI DSL type definitions for high-level UI controls

import type { Block } from '../core/types.js';

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
  visible?: boolean;
  enabled?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

// Interactive control properties
export interface TextBoxProps extends GUIBaseProps {
  value?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface CheckBoxProps extends GUIBaseProps {
  checked?: boolean;
  label?: string;
  onChange?: (checked: boolean) => void;
}

export interface RadioButtonProps extends GUIBaseProps {
  checked?: boolean;
  label?: string;
  value?: string;
  group?: string;
  onChange?: (value: string) => void;
}

export interface ButtonProps extends GUIBaseProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface SliderProps extends GUIBaseProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export interface DropdownProps extends GUIBaseProps {
  value?: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  onChange?: (value: string) => void;
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
  text: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export interface GUIImageProps extends GUIBaseProps {
  src: string | HTMLImageElement;
  fit?: 'cover' | 'contain' | 'fill';
}

export interface PanelProps extends GUIBaseProps {
  title?: string;
  padding?: number;
}

// GUI control descriptor
export interface GUIControl {
  type: GUIControlType;
  props: GUIBaseProps;
  children?: GUIControl[];
}

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
