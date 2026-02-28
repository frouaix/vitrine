// Copyright (c) 2026 François Rouaix

// GUI components public API

export {
  // Types
  GUIControlType,
  CalendarViewType,
  type GUIColor,
  type LayoutDirection,
  type GUIBaseProps,
  type TextBoxProps,
  type CheckBoxProps,
  type RadioButtonProps,
  type ButtonProps,
  type SliderProps,
  type DropdownProps,
  type StackLayoutProps,
  type CarouselProps,
  type GridProps,
  type LabelProps,
  type GUIImageProps,
  type PanelProps,
  type CalendarEvent,
  type DateRange,
  type CalendarDayViewProps,
  type CalendarMonthViewProps,
  type CalendarNavProps,
  type Alignment,
  type ControlStyle,
  type ThemeDefinition,
  type TransformContext,
  type GUIControl,
  type GUIControlOfType,
  // Controls
  control,
  textbox,
  checkbox,
  radiobutton,
  button,
  slider,
  dropdown,
  hstack,
  vstack,
  carousel,
  grid,
  label,
  guiImage,
  panel,
  calendarDayView,
  calendarMonthView,
  colorpicker,
  // Calendar functions
  rsControl,
  rsCalendarDayView,
  rsCalendarMonthView,
  generateSampleEvents,
  // Theme
  lightTheme,
  darkTheme,
  colorfulTheme,
  themes,
  getTheme,
  // Transform
  transformGUIControl
} from './GUI/index.ts';

// Component system
export { VitrineComponent } from './component.ts';
export type { VitrineComponentConfig, GUIControlBuilder, BlockBuilder, RenderFunction } from './component.ts';
