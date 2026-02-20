// Copyright (c) 2026 François Rouaix

// Core types and interfaces
export * from './core/types.ts';

// Transform system
export { Matrix2D, TransformStack } from './transform.ts';

// Rendering context
export { Canvas2DContext } from './core/context.ts';
export type { RenderContext } from './core/context.ts';

// Immediate renderer
export { ImmediateRenderer } from './core/renderer-immediate.ts';
export type { RendererConfig } from './core/renderer-immediate.ts';

// Performance
export { PerformanceOptimizer, PerformanceMonitor } from './performance.ts';
export type { Viewport } from './performance.ts';

// Event system
export { EventManager } from './events.ts';
export type { PointerEventData, ActiveTooltip } from './events.ts';
export { HitTester } from './hit-test.ts';
export type { HitTestResult } from './hit-test.ts';

// Block factory functions
export * from './core/blocks.ts';

// GUI components
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

// Legacy exports (for backwards compatibility)
export * from './core/renderer.ts';
export * from './core/renderer-canvas.ts';
export * from './core/renderer-webgl.ts';
