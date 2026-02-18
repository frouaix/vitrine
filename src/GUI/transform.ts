// Copyright (c) 2026 François Rouaix

// Transform GUI DSL to Core DSL — main orchestrator

import type { Block } from '../core/types.ts';
import { group } from '../core/blocks.ts';
import type {
  Rs,
  GUIControl,
  GUIControlOfType,
  TransformContext
} from './types.ts';
import { GUIControlType } from './types.ts';
import { COMMON_DEFAULTS, FALLBACK_DEFAULTS } from './constants.ts';

import { TEXTBOX_DEFAULTS } from './textbox/defaultsTextBox.ts';
import { BUTTON_DEFAULTS } from './button/defaultsButton.ts';
import { CHECKBOX_DEFAULTS } from './checkbox/defaultsCheckBox.ts';
import { RADIOBUTTON_DEFAULTS } from './radiobutton/defaultsRadioButton.ts';
import { SLIDER_DEFAULTS } from './slider/defaultsSlider.ts';
import { COLORPICKER_DEFAULTS } from './colorpicker/defaultsColorPicker.ts';
import { LABEL_DEFAULTS } from './label/defaultsLabel.ts';
import { PANEL_DEFAULTS } from './panel/defaultsPanel.ts';

import { transformTextBox } from './textbox/transformTextBox.ts';
import { transformCheckBox } from './checkbox/transformCheckBox.ts';
import { transformRadioButton } from './radiobutton/transformRadioButton.ts';
import { transformButton } from './button/transformButton.ts';
import { transformSlider } from './slider/transformSlider.ts';
import { transformDropdown } from './dropdown/transformDropdown.ts';
import { transformColorPicker } from './colorpicker/transformColorPicker.ts';
import { transformLabel } from './label/transformLabel.ts';
import { transformGUIImage } from './image/transformImage.ts';
import { transformPanel } from './panel/transformPanel.ts';
import { transformStack } from './hstack/transformHStack.ts';
import { transformCarousel } from './carousel/transformCarousel.ts';
import { transformGrid } from './grid/transformGrid.ts';
import { rsCalendarDayView, rsCalendarMonthView } from './calendar/transformCalendar.ts';

export function repositionBlock<T extends Block>(block: T, xp: number, yp: number): T {
  return {
    ...block,
    props: {
      ...block.props,
      x: xp,
      y: yp
    }
  } as T;
}

function rsFallbackForControlType(type: GUIControlType): Rs {
  switch (type) {
    case GUIControlType.TextBox:
    case GUIControlType.Dropdown:
      return { width: TEXTBOX_DEFAULTS.dx, height: TEXTBOX_DEFAULTS.dy };
    case GUIControlType.Button:
      return { width: BUTTON_DEFAULTS.dx, height: BUTTON_DEFAULTS.dy };
    case GUIControlType.CheckBox:
      return { width: CHECKBOX_DEFAULTS.dx, height: CHECKBOX_DEFAULTS.dy };
    case GUIControlType.RadioButton:
      return { width: RADIOBUTTON_DEFAULTS.dx, height: RADIOBUTTON_DEFAULTS.dy };
    case GUIControlType.Slider:
      return { width: SLIDER_DEFAULTS.dx, height: SLIDER_DEFAULTS.dy };
    case GUIControlType.ColorPicker:
      return { width: COLORPICKER_DEFAULTS.dx, height: COLORPICKER_DEFAULTS.dy };
    case GUIControlType.Label:
      return { width: LABEL_DEFAULTS.dx, height: LABEL_DEFAULTS.dy };
    case GUIControlType.Panel:
      return { width: PANEL_DEFAULTS.dx, height: PANEL_DEFAULTS.dy };
    default:
      return { width: FALLBACK_DEFAULTS.dx, height: FALLBACK_DEFAULTS.dy };
  }
}

export function rsControl(control: GUIControl): Rs {
  const { type, props } = control;
  const { dx, dy } = props;
  const rsFallback = rsFallbackForControlType(type);
  
  if (dx !== undefined && dy !== undefined) {
    return { width: dx, height: dy };
  }

  switch (type) {
    case GUIControlType.HStack:
    case GUIControlType.VStack:
      return rsStack(control);
    case GUIControlType.Grid:
      return rsGrid(control);
    case GUIControlType.Slider: {
      const { orientation } = props as GUIControlOfType<GUIControlType.Slider>['props'];
      const fVertical = orientation === 'vertical';
      return {
        width: dx ?? (fVertical ? SLIDER_DEFAULTS.dy : SLIDER_DEFAULTS.dx),
        height: dy ?? (fVertical ? SLIDER_DEFAULTS.dx : SLIDER_DEFAULTS.dy)
      };
    }
    default:
      return { width: dx ?? rsFallback.width, height: dy ?? rsFallback.height };
  }
}

function rsStack(control: GUIControlOfType<GUIControlType.HStack | GUIControlType.VStack>): Rs {
  const { props } = control;
  const { dx, dy, duSpacing, duPadding } = props;
  const direction = control.type === GUIControlType.HStack ? 'horizontal' : 'vertical';
  const spacing = duSpacing || COMMON_DEFAULTS.duSpacing;
  const padding = duPadding || COMMON_DEFAULTS.duPadding;
  
  if (!control.children || control.children.length === 0) {
    return { width: dx ?? 0, height: dy ?? 0 };
  }
  
  let mainAxis = padding;
  let maxCrossAxis = 0;
  
  for (const child of control.children) {
    const rsChild = rsControl(child);
    mainAxis += (direction === 'horizontal' ? rsChild.width : rsChild.height) + spacing;
    if (direction === 'horizontal') {
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.height);
    } else {
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.width);
    }
  }
  
  mainAxis = mainAxis - spacing + padding;
  const crossAxis = maxCrossAxis + 2 * padding;
  
  return {
    width: dx ?? (direction === 'horizontal' ? mainAxis : crossAxis),
    height: dy ?? (direction === 'horizontal' ? crossAxis : mainAxis)
  };
}

function rsGrid(control: GUIControlOfType<GUIControlType.Grid>): Rs {
  const { props } = control;
  const { dx, dy, cColumns, duSpacing, duPadding } = props;
  const columns = cColumns || 3;
  const spacing = duSpacing || COMMON_DEFAULTS.duSpacing;
  const padding = duPadding || COMMON_DEFAULTS.duPadding;
  
  if (!control.children || control.children.length === 0) {
    return { width: dx ?? 0, height: dy ?? 0 };
  }
  
  const maxColWidth: number[] = [];
  const maxRowHeight: number[] = [];
  
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const rsChild = rsControl(child);
    maxColWidth[col] = Math.max(maxColWidth[col] || 0, rsChild.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || 0, rsChild.height);
  });
  
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + (columns - 1) * spacing + 2 * padding;
  const numRows = Math.ceil(control.children.length / columns);
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + (numRows - 1) * spacing + 2 * padding;
  
  return {
    width: dx ?? totalWidth,
    height: dy ?? totalHeight
  };
}

export function transformGUIChildren(
  children: GUIControl[],
  context: TransformContext,
  dxpOffset: number = COMMON_DEFAULTS.x,
  dypOffset: number = COMMON_DEFAULTS.y
): Block[] {
  return children.map(child => {
    const transformed = transformGUIControl(child, context);
    const { props } = transformed;
    const { x: xp = COMMON_DEFAULTS.x, y: yp = COMMON_DEFAULTS.y } = props;
    return repositionBlock(
      transformed,
      xp + dxpOffset,
      yp + dypOffset
    );
  });
}

// Main transformation function
export function transformGUIControl(
  control: GUIControl,
  context: TransformContext,
  state?: any
): Block {
  switch (control.type) {
    case GUIControlType.TextBox:
      return transformTextBox(control, context, state);
    case GUIControlType.CheckBox:
      return transformCheckBox(control, context, state);
    case GUIControlType.RadioButton:
      return transformRadioButton(control, context, state);
    case GUIControlType.Button:
      return transformButton(control, context, state);
    case GUIControlType.Slider:
      return transformSlider(control, context, state);
    case GUIControlType.Dropdown:
      return transformDropdown(control, context, state);
    case GUIControlType.ColorPicker:
      return transformColorPicker(control, context, state);
    case GUIControlType.Label:
      return transformLabel(control, context);
    case GUIControlType.Image:
      return transformGUIImage(control, context);
    case GUIControlType.Panel:
      return transformPanel(control, context);
    case GUIControlType.HStack:
    case GUIControlType.VStack:
      return transformStack(control, context);
    case GUIControlType.Carousel:
      return transformCarousel(control, context);
    case GUIControlType.Grid:
      return transformGrid(control, context);
    case GUIControlType.CalendarDayView:
      return rsCalendarDayView(control.props);
    case GUIControlType.CalendarMonthView:
      return rsCalendarMonthView(control.props);
    default:
      return group({}, []);
  }
}
