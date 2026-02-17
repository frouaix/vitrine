// Copyright (c) 2026 François Rouaix

// Transform GUI DSL to Core DSL

import type { Block } from '../core/types.ts';
import { rectangle, circle, text, group, image, portal } from '../core/blocks.ts';
import type {
  Rs,
  LayoutDirection,
  GUIControl,
  GUIControlOfType,
  TransformContext,
  ControlStyle
} from './types.ts';
import { GUIControlType } from './types.ts';
import { GUI_DEFAULTS } from './constants.ts';
import { DEFAULTS as colorPickerDefaults, transformColorPicker } from './color-picker.ts';
import { rsCalendarDayView, rsCalendarMonthView } from './calendar.ts';

function repositionBlock<T extends Block>(block: T, xp: number, yp: number): T {
  return {
    ...block,
    props: {
      ...block.props,
      x: xp,
      y: yp
    }
  } as T;
}

// Helper to get style for a control
function getControlStyle(
  control: GUIControl,
  context: TransformContext
): ControlStyle {
  const { theme } = context;
  const { props, type } = control;
  const { className } = props;
  
  // Check for custom class style first
  if (className && theme.styles[className]) {
    return { ...(theme.defaults[type] || {}), ...theme.styles[className] };
  }
  
  // Fall back to default style for control type
  return theme.defaults[type] || {};
}

// Helper to get the rendered dimensions of a control
function rsFallbackForControlType(type: GUIControlType): Rs {
  switch (type) {
    case GUIControlType.TextBox:
    case GUIControlType.Dropdown:
      return { width: GUI_DEFAULTS.textBox.dx, height: GUI_DEFAULTS.textBox.dy };
    case GUIControlType.Button:
      return { width: GUI_DEFAULTS.button.dx, height: GUI_DEFAULTS.button.dy };
    case GUIControlType.CheckBox:
      return { width: GUI_DEFAULTS.checkBox.dx, height: GUI_DEFAULTS.checkBox.dy };
    case GUIControlType.RadioButton:
      return { width: GUI_DEFAULTS.radioButton.dx, height: GUI_DEFAULTS.radioButton.dy };
    case GUIControlType.Slider:
      return { width: GUI_DEFAULTS.slider.dx, height: GUI_DEFAULTS.slider.dy };
    case GUIControlType.ColorPicker:
      return { width: colorPickerDefaults.dx, height: colorPickerDefaults.dy };
    case GUIControlType.Label:
      return { width: GUI_DEFAULTS.label.dx, height: GUI_DEFAULTS.label.dy };
    case GUIControlType.Panel:
      return { width: GUI_DEFAULTS.panel.dx, height: GUI_DEFAULTS.panel.dy };
    default:
      return { width: GUI_DEFAULTS.fallback.dx, height: GUI_DEFAULTS.fallback.dy };
  }
}

function rsControl(control: GUIControl): Rs {
  const { type, props } = control;
  const { dx, dy } = props;
  const rsFallback = rsFallbackForControlType(type);
  
  // If dimensions are explicitly set, use them
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
        width: dx ?? (fVertical ? GUI_DEFAULTS.slider.dy : GUI_DEFAULTS.slider.dx),
        height: dy ?? (fVertical ? GUI_DEFAULTS.slider.dx : GUI_DEFAULTS.slider.dy)
      };
    }
    default:
      return { width: dx ?? rsFallback.width, height: dy ?? rsFallback.height };
  }
}

// Compute dimensions for stack-based layouts
function rsStack(control: GUIControlOfType<GUIControlType.HStack | GUIControlType.VStack>): Rs {
  const { type, props, children } = control;
  const { duSpacing, duPadding } = props;
  const direction: LayoutDirection = type === GUIControlType.HStack ? 'horizontal' : 'vertical';
  const duSpacingActual = duSpacing || GUI_DEFAULTS.common.duSpacing;
  const duPaddingActual = duPadding || GUI_DEFAULTS.common.duPadding;
  
  if (!children || children.length === 0) {
    return { width: 2 * duPaddingActual, height: 2 * duPaddingActual };
  }
  
  let totalMainAxis = duPaddingActual;
  let maxCrossAxis = 0;
  
  children.forEach((child, index) => {
    const rsChild = rsControl(child);
    
    if (direction === 'horizontal') {
      totalMainAxis += rsChild.width;
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.height);
    } else {
      totalMainAxis += rsChild.height;
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.width);
    }
    
    // Add spacing between children (but not after the last one)
    if (index < children.length - 1) {
      totalMainAxis += duSpacingActual;
    }
  });
  
  totalMainAxis += duPaddingActual;
  const totalCrossAxis = maxCrossAxis + 2 * duPaddingActual;
  
  return direction === 'horizontal'
    ? { width: totalMainAxis, height: totalCrossAxis }
    : { width: totalCrossAxis, height: totalMainAxis };
}

// Compute dimensions for grid layout
function rsGrid(control: GUIControlOfType<GUIControlType.Grid>): Rs {
  const { props, children } = control;
  const { cColumns, duSpacing, duPadding } = props;
  const cColumnsActual = cColumns || GUI_DEFAULTS.grid.cColumns;
  const duSpacingActual = duSpacing || GUI_DEFAULTS.common.duSpacing;
  const duPaddingActual = duPadding || GUI_DEFAULTS.common.duPadding;
  
  if (!children || children.length === 0) {
    return { width: 2 * duPaddingActual, height: 2 * duPaddingActual };
  }
  
  const maxColWidth: number[] = [];
  const maxRowHeight: number[] = [];
  
  children.forEach((child, iColumn) => {
    const iColActual = iColumn % cColumnsActual;
    const iRow = Math.floor(iColumn / cColumnsActual);
    const rsChild = rsControl(child);
    
    maxColWidth[iColActual] = Math.max(maxColWidth[iColActual] || GUI_DEFAULTS.common.duAxisStart, rsChild.width);
    maxRowHeight[iRow] = Math.max(maxRowHeight[iRow] || GUI_DEFAULTS.common.duAxisStart, rsChild.height);
  });
  
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + 
                     Math.max(GUI_DEFAULTS.common.duAxisStart, maxColWidth.length - 1) * duSpacingActual + 
                     2 * duPaddingActual;
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + 
                      Math.max(GUI_DEFAULTS.common.duAxisStart, maxRowHeight.length - 1) * duSpacingActual + 
                      2 * duPaddingActual;
  
  return { width: totalWidth, height: totalHeight };
}

// Transform textbox to core blocks
function transformTextBox(
  control: GUIControlOfType<GUIControlType.TextBox>,
  context: TransformContext,
  state: { fHovered?: boolean; fFocused?: boolean } = {}
): Block {
  const { props } = control;
  const style = getControlStyle(control, context);
  const {
    colBg,
    colBgHover,
    colBorderFocus,
    colBorder,
    colText,
    colTextDisabled,
    borderWidth,
    borderRadius,
    duPadding,
    fontSize,
    fontFamily
  } = style;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    dx,
    dy,
    id,
    stValue,
    stPlaceholder,
    fVisible,
    onClick,
    onHover
  } = props;
  
  const dxp = dx ?? GUI_DEFAULTS.textBox.dx;
  const dyp = dy ?? GUI_DEFAULTS.textBox.dy;
  
  const { fFocused, fHovered } = state;

  const colBgActual = fFocused
    ? colBg
    : fHovered
    ? colBgHover || colBg
    : colBg;
  
  const colBorderActual = fFocused
    ? colBorderFocus || colBorder
    : colBorder;
  const colTextActual = stValue ? colText : (colTextDisabled || colText);
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBgActual,
      stroke: colBorderActual,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius,
      onClick,
      onHover
    })
  );
  
  // Text content
  const stDisplay = stValue || stPlaceholder || GUI_DEFAULTS.common.stEmpty;
  if (stDisplay) {
    children.push(
      text({
        text: stDisplay,
        x: duPadding || GUI_DEFAULTS.textBox.duTextPadding,
        y: dyp / 2,
        fill: colTextActual,
        fontSize,
        font: fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Transform checkbox to core blocks
function transformCheckBox(
  control: GUIControlOfType<GUIControlType.CheckBox>,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control;
  const style = getControlStyle(control, context);
  const {
    colBgChecked,
    colBgHover,
    colBg,
    colBorder,
    colText,
    borderWidth,
    borderRadius,
    fontSize,
    fontFamily
  } = style;
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, fChecked, stLabel, fVisible, onHover, onChange } = props;
  
  const dypBox = GUI_DEFAULTS.checkBox.duBox;
  const dxpLabelSpacing = GUI_DEFAULTS.checkBox.duLabelSpacing;
  
  const children: Block[] = [];
  
  const { fHovered } = state;
  const fCheckedActual = fChecked === true;

  // Checkbox box
  const colBgActual = fCheckedActual
    ? colBgChecked
    : fHovered
    ? colBgHover || colBg
    : colBg;
  
  children.push(
    rectangle({
      dx: dypBox,
      dy: dypBox,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius,
      onClick: onChange ? (event: PointerEvent) => onChange(!fCheckedActual) : undefined,
      onHover
    })
  );
  
  // Check mark
  if (fCheckedActual) {
    children.push(
      text({
        text: GUI_DEFAULTS.checkBox.checkmark.stText,
        x: dypBox / 2,
        y: dypBox / 2,
        fill: GUI_DEFAULTS.checkBox.checkmark.colFill,
        fontSize: GUI_DEFAULTS.checkBox.checkmark.duFont,
        align: GUI_DEFAULTS.text.alignCenter,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  // Label
  if (stLabel) {
    children.push(
      text({
        text: stLabel,
        x: dypBox + dxpLabelSpacing,
        y: dypBox / 2,
        fill: colText,
        fontSize,
        font: fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Transform radio button to core blocks
function transformRadioButton(
  control: GUIControlOfType<GUIControlType.RadioButton>,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control;
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, stValue, stLabel, fChecked, fVisible, onChange, onHover } = props;
  const { fHovered } = state;
  const style = getControlStyle(control, context);
  const {
    colBgHover,
    colBg,
    colBorder,
    colBgChecked,
    colText,
    borderWidth,
    fontSize,
    fontFamily
  } = style;
  
  const rl = GUI_DEFAULTS.radioButton.duRadius;
  const dxpLabelSpacing = GUI_DEFAULTS.radioButton.duLabelSpacing;
  
  const children: Block[] = [];
  
  // Radio circle
  const colBgActual = fHovered
    ? colBgHover || colBg
    : colBg;
  
  children.push(
    circle({
      radius: rl,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      onClick: onChange && stValue ? (event: PointerEvent) => onChange(stValue) : undefined,
      onHover
    })
  );
  
  // Inner dot when checked
  if (fChecked) {
    children.push(
      circle({
        radius: GUI_DEFAULTS.radioButton.duInnerDotRadius,
        fill: colBgChecked
      })
    );
  }
  
  // Label
  if (stLabel) {
    children.push(
      text({
        text: stLabel,
        x: rl + dxpLabelSpacing,
        y: 0,
        fill: colText,
        fontSize,
        font: fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Transform button to core blocks
function transformButton(
  control: GUIControlOfType<GUIControlType.Button>,
  context: TransformContext,
  state: { fHovered?: boolean; fPressed?: boolean } = {}
): Block {
  const { props } = control;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    dx,
    dy,
    id,
    variant,
    className,
    stLabel,
    fEnabled,
    fVisible,
    onClick,
    onHover
  } = props;
  const stLabelActual = stLabel || '';
  const { fHovered, fPressed } = state;
  
  // Use className based on variant if no className specified
  let classNameActual = className;
  if (!classNameActual && variant) {
    classNameActual = `${variant}-button`;
  }
  
  const style = getControlStyle({ ...control, props: { ...props, className: classNameActual } } as GUIControl, context);
  const {
    colBgDisabled,
    colBgActive,
    colBgHover,
    colBg,
    colText,
    colTextDisabled,
    colBorder,
    borderWidth,
    borderRadius,
    fontSize,
    fontFamily
  } = style;
  
  const dxp = dx ?? GUI_DEFAULTS.button.dx;
  const dyp = dy ?? GUI_DEFAULTS.button.dy;
  
  const colBgActual = !fEnabled && fEnabled !== undefined
    ? colBgDisabled
    : fPressed
    ? colBgActive
    : fHovered
    ? colBgHover
    : colBg;
  
  const colTextActual = !fEnabled && fEnabled !== undefined
    ? colTextDisabled
    : colText;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius
    })
  );
  
  // Label
  children.push(
    text({
      text: stLabelActual,
      x: dxp / 2,
      y: dyp / 2,
      fill: colTextActual,
      fontSize,
      font: fontFamily,
      align: GUI_DEFAULTS.text.alignCenter,
      baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id,
      onClick: fEnabled !== false && onClick ? (event: PointerEvent) => onClick() : undefined,
      onHover
    },
    children
  );
}

// Transform slider to core blocks
function transformSlider(
  control: GUIControlOfType<GUIControlType.Slider>,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    dx,
    dy,
    id,
    orientation,
    min,
    max,
    value: valueProp,
    fVisible,
    onChange,
    onHover
  } = props;
  const style = getControlStyle(control, context);
  const {
    colSliderTrack,
    colSliderThumb
  } = style;

  const fVertical = orientation === 'vertical';
  const duLength = fVertical
    ? (dy ?? dx ?? GUI_DEFAULTS.slider.dx)
    : (dx ?? GUI_DEFAULTS.slider.dx);
  const duCross = fVertical
    ? (dx ?? GUI_DEFAULTS.slider.dy)
    : (dy ?? GUI_DEFAULTS.slider.dy);
  const dypTrack = GUI_DEFAULTS.slider.duTrack;
  const rlThumb = GUI_DEFAULTS.slider.duThumbRadius;
  const dypHitArea = rlThumb * 2;
  const duCrossCenter = duCross / 2;
  
  const minActual = min ?? GUI_DEFAULTS.slider.min;
  const maxActual = max ?? GUI_DEFAULTS.slider.max;
  const value = valueProp ?? minActual;
  const range = maxActual - minActual;
  const colTrackFill = colSliderTrack || GUI_DEFAULTS.slider.colTrackFill;
  const colTrackStroke = GUI_DEFAULTS.slider.colTrackStroke;
  const colThumbFill = colSliderThumb || GUI_DEFAULTS.slider.colThumbFill;
  const colThumbStroke = GUI_DEFAULTS.slider.colThumbStroke;
  const normalizedValue = range === 0
    ? 0
    : Math.max(0, Math.min(1, (value - minActual) / range));
  const duThumbMin = Math.min(rlThumb, duLength / 2);
  const duThumbMax = Math.max(duThumbMin, duLength - rlThumb);
  const duThumbAxis = duThumbMin + (fVertical ? (1 - normalizedValue) : normalizedValue) * (duThumbMax - duThumbMin);

  type VitrinePointerEvent = PointerEvent & {
    vtrLocalX?: number;
    vtrLocalY?: number;
  };

  const getEventLocalPosition = (event: PointerEvent): number | null => {
    const eventWithLocal = event as VitrinePointerEvent;
    const local = fVertical ? eventWithLocal.vtrLocalY : eventWithLocal.vtrLocalX;
    return typeof local === 'number' ? local : null;
  };

  const getValueFromLocalPosition = (duLocal: number): number => {
    if (range === 0) {
      return minActual;
    }

    const normalizedPosition = Math.max(0, Math.min(1, duLocal / duLength));
    const normalizedForValue = fVertical ? (1 - normalizedPosition) : normalizedPosition;
    return minActual + normalizedForValue * range;
  };

  const applyFromTrackPosition = (duLocal: number): number => {
    const nextValue = getValueFromLocalPosition(duLocal);
    onChange?.(nextValue);
    return nextValue;
  };

  const startTrackDrag = (event: PointerEvent): void => {
    const duLocal = getEventLocalPosition(event);
    const startValue = duLocal !== null
      ? applyFromTrackPosition(duLocal)
      : value;

    dragState.fDragging = true;
    dragState.xwStart = fVertical ? event.clientY : event.clientX;
    dragState.startValue = startValue;
  };

  const clickTrack = (event: PointerEvent): void => {
    const duLocal = getEventLocalPosition(event);
    if (duLocal === null) {
      return;
    }

    applyFromTrackPosition(duLocal);
  };

  const dragToValue = (event: PointerEvent): void => {
    if (!dragState.fDragging) {
      return;
    }

    const { target: canvas } = event as PointerEvent & { target: HTMLCanvasElement };
    const rect = canvas.getBoundingClientRect();
    const scale = fVertical
      ? (canvas.height / rect.height)
      : (canvas.width / rect.width);

    if (range === 0) {
      onChange?.(minActual);
      return;
    }

    const duDeltaWorld = (fVertical ? event.clientY : event.clientX) - dragState.xwStart;
    const duDeltaCanvas = duDeltaWorld * scale;
    const normalizedDelta = duDeltaCanvas / duLength;
    const deltaValue = (fVertical ? -normalizedDelta : normalizedDelta) * range;
    const newValue = Math.max(minActual, Math.min(maxActual, dragState.startValue + deltaValue));

    onChange?.(newValue);
  };
  
  // Persistent drag state (stored on props to survive re-renders)
  if (!(props as any)._dragState) {
    (props as any)._dragState = { fDragging: false, xwStart: 0, startValue: 0 };
  }
  const dragState = (props as any)._dragState;
  
  const children: Block[] = [];
  
  // Visual track
  children.push(
    rectangle({
      x: fVertical ? (duCrossCenter - dypTrack / 2) : 0,
      y: fVertical ? 0 : (duCrossCenter - dypTrack / 2),
      dx: fVertical ? dypTrack : duLength,
      dy: fVertical ? duLength : dypTrack,
      fill: colTrackFill,
      cornerRadius: dypTrack / 2,
      stroke: colTrackStroke,
      strokeWidth: GUI_DEFAULTS.slider.duTrackStroke
    })
  );

  children.push(
    rectangle({
      x: fVertical ? (duCrossCenter - rlThumb) : 0,
      y: fVertical ? 0 : (duCrossCenter - rlThumb),
      dx: fVertical ? dypHitArea : duLength,
      dy: fVertical ? duLength : dypHitArea,
      fill: 'transparent',
      onClick: onChange ? (event: PointerEvent) => clickTrack(event) : undefined,
      onPointerDown: onChange ? (event: PointerEvent) => startTrackDrag(event) : undefined,
      onDrag: onChange ? (event: PointerEvent) => dragToValue(event) : undefined,
      onPointerUp: () => {
        dragState.fDragging = false;
      }
    })
  );
  
  // Thumb - draggable
  children.push(
    circle({
      x: fVertical ? duCrossCenter : duThumbAxis,
      y: fVertical ? duThumbAxis : duCrossCenter,
      radius: rlThumb,
      disableCulling: true,
      fill: colThumbFill,
      stroke: colThumbStroke,
      strokeWidth: GUI_DEFAULTS.slider.duThumbStroke,
      onPointerDown: onChange ? (e: PointerEvent) => {
        dragState.fDragging = true;
        dragState.xwStart = e.clientX;
        dragState.startValue = value;
      } : undefined,
      onDrag: onChange ? (event: PointerEvent) => dragToValue(event) : undefined,
      onPointerUp: () => {
        dragState.fDragging = false;
      }
    })
  );
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id,
      onHover
    },
    children
  );
}

// Transform dropdown to core blocks
function transformDropdown(
  control: GUIControlOfType<GUIControlType.Dropdown>,
  context: TransformContext,
  state: { fHovered?: boolean; fOpen?: boolean } = {}
): Block {
  const { props } = control;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    dx,
    dy,
    id,
    stValue,
    stPlaceholder,
    fVisible,
    fOpen,
    options,
    onChange,
    onToggle,
    onClick,
    onHover
  } = props;
  const style = getControlStyle(control, context);
  const {
    colBgHover,
    colBg,
    colBorder,
    borderWidth,
    borderRadius,
    colText,
    colTextDisabled,
    duPadding,
    fontSize,
    fontFamily
  } = style;
  
  const dxp = dx ?? GUI_DEFAULTS.dropdown.dx;
  const dyp = dy ?? GUI_DEFAULTS.dropdown.dy;
  
  const { fHovered } = state;

  const colBgActual = fHovered
    ? colBgHover || colBg
    : colBg;
  
  // Main dropdown click handler
  const handleMainClick = (event: PointerEvent) => {
    if (onToggle) {
      onToggle(!fOpen);
    }
    if (onClick) {
      onClick(event);
    }
  };
  
  const children: Block[] = [];
  
  // Background for main dropdown - attach click handler here since groups don't receive events
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius,
      onClick: handleMainClick,
      onHover
    })
  );
  
  // Display text
  const selectedOption = options.find(opt => opt.value === stValue);
  const colTextActual = selectedOption ? colText : (colTextDisabled || colText);
  const stDisplay = selectedOption?.stLabel || stPlaceholder || GUI_DEFAULTS.dropdown.stPlaceholder;
  
  children.push(
    text({
      text: stDisplay,
      x: duPadding || GUI_DEFAULTS.dropdown.duTextPadding,
      y: dyp / 2,
      fill: colTextActual,
      fontSize,
      font: fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  // Arrow indicator
  const stArrow = fOpen ? '▲' : GUI_DEFAULTS.dropdown.stArrow;
  children.push(
    text({
      text: stArrow,
      x: dxp - (duPadding || GUI_DEFAULTS.dropdown.duTextPadding) - GUI_DEFAULTS.dropdown.duArrowOffsetX,
      y: dyp / 2,
      fill: colTextActual,
      fontSize: GUI_DEFAULTS.dropdown.duArrowFont,
      baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  // Expanded menu
  if (fOpen && options.length > 0) {
    const duItemHeight = dyp;
    const duMenuHeight = Math.min(options.length * duItemHeight, dyp * 6); // Max 6 items visible
    const cVisibleItems = Math.floor(duMenuHeight / duItemHeight);
    const colItemSelected = colBgHover || colBg;
    
    // Build menu blocks
    const menuBlocks: Block[] = [];
    
    // Invisible backdrop for click-blocking
    menuBlocks.push(
      rectangle({
        x: 0,
        y: 0,
        dx: dxp,
        dy: duMenuHeight,
        fill: 'transparent',
        onClick: () => {
          // Click on empty menu space closes dropdown
          if (onToggle) onToggle(false);
        }
      })
    );
    
    // Menu background
    menuBlocks.push(
      rectangle({
        x: 0,
        y: 0,
        dx: dxp,
        dy: duMenuHeight,
        fill: colBg,
        stroke: colBorder,
        strokeWidth: borderWidth,
        cornerRadius: borderRadius
      })
    );
    
    // Menu items
    const itemsToShow = options.slice(0, cVisibleItems);
    itemsToShow.forEach((option, index) => {
      const ypItem = index * duItemHeight;
      const fSelected = option.value === stValue;
      
      // Item click handler
      const handleItemClick = () => {
        if (onChange) {
          onChange(option.value);
        }
        if (onToggle) {
          onToggle(false);
        }
      };
      
      // Item background (highlighted if selected)
      menuBlocks.push(
        rectangle({
          x: 0,
          y: ypItem,
          dx: dxp,
          dy: duItemHeight,
          fill: fSelected ? colItemSelected : 'transparent',
          onClick: handleItemClick
        })
      );
      
      // Item text
      menuBlocks.push(
        text({
          text: option.stLabel || option.value,
          x: duPadding || GUI_DEFAULTS.dropdown.duTextPadding,
          y: ypItem + duItemHeight / 2,
          fill: colText,
          fontSize,
          font: fontFamily,
          baseline: GUI_DEFAULTS.text.baselineMiddle
        })
      );
    });
    
    // Wrap menu in portal so it renders on top
    children.push(
      portal(
        {
          x: 0,
          y: dyp + 2  // Position relative to dropdown
        },
        menuBlocks
      )
    );
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Transform label to core blocks
function transformLabel(
  control: GUIControlOfType<GUIControlType.Label>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    fontSize: duFont,
    stText,
    fVisible,
    align,
  } = props;
  const style = getControlStyle(control, context);
  const { colText, fontSize, fontFamily } = style;
  const stTextActual = stText || '';
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    [
      text({
        text: stTextActual,
        fill: colText,
        fontSize: duFont || fontSize,
        font: fontFamily,
        align
      })
    ]
  );
}

// Transform GUI image to core blocks
function transformGUIImage(
  control: GUIControlOfType<GUIControlType.Image>,
  context: TransformContext
): Block {
  const { props } = control;
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, dx, dy, id, src, fVisible } = props;
  
  const dxp = dx ?? GUI_DEFAULTS.image.dx;
  const dyp = dy ?? GUI_DEFAULTS.image.dy;
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    [
      image({
        src,
        dx: dxp,
        dy: dyp
      })
    ]
  );
}

// Transform panel to core blocks
function transformPanel(
  control: GUIControlOfType<GUIControlType.Panel>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    dx,
    dy,
    id,
    duPadding,
    stTitle,
    fVisible
  } = props;
  const style = getControlStyle(control, context);
  const {
    duPadding: duPaddingStyle,
    colBg: colBg,
    colBorder,
    colText,
    borderWidth,
    borderRadius,
    fontSize,
    fontFamily
  } = style;
  
  const dxp = dx ?? GUI_DEFAULTS.panel.dx;
  const dyp = dy ?? GUI_DEFAULTS.panel.dy;
  const duPaddingActual = duPadding || duPaddingStyle || GUI_DEFAULTS.panel.duPadding;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius
    })
  );
  
  // Title if provided
  if (stTitle) {
    children.push(
      text({
        text: stTitle,
        x: duPaddingActual,
        y: duPaddingActual,
        fill: colText,
        fontSize,
        font: fontFamily
      })
    );
  }
  
  // Transform children
  if (control.children) {
    const ypContent = stTitle ? duPaddingActual + (fontSize || GUI_DEFAULTS.panel.duTitleFont) + GUI_DEFAULTS.panel.duTitleGap : duPaddingActual;
    const transformedChildren = transformGUIChildren(control.children, context, duPaddingActual, ypContent);
    children.push(...transformedChildren);
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Transform stack layouts
function transformStack(
  control: GUIControlOfType<GUIControlType.HStack | GUIControlType.VStack>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    duSpacing,
    duPadding,
    fVisible
  } = props;
  const direction: LayoutDirection = control.type === GUIControlType.HStack ? 'horizontal' : 'vertical';

  const spacing = duSpacing || GUI_DEFAULTS.common.duSpacing;
  const padding = duPadding || GUI_DEFAULTS.common.duPadding;
  
  if (!control.children) {
    return group({ x: xp, y: yp }, []);
  }
  
  const children: Block[] = [];
  let dypOffset = padding;
  let maxCrossAxis = 0; // Track maximum width (for vstack) or height (for hstack)
  
  for (const child of control.children) {
    const transformed = transformGUIControl(child, context);
    const rsChild = rsControl(child);
    
    // Create a new block with updated coordinates instead of mutating
    const positionedBlock = repositionBlock(
      transformed,
      direction === 'horizontal' ? dypOffset : padding,
      direction === 'horizontal' ? padding : dypOffset
    );
    
    dypOffset += (direction === 'horizontal' ? rsChild.width : rsChild.height) + spacing;
    
    // Track the maximum size in the cross-axis direction
    if (direction === 'horizontal') {
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.height);
    } else {
      maxCrossAxis = Math.max(maxCrossAxis, rsChild.width);
    }
    
    children.push(positionedBlock);
  }
  
  // Remove the trailing spacing from the last child
  const totalMainAxis = dypOffset - spacing + padding;
  const totalCrossAxis = maxCrossAxis + 2 * padding;
  
  // Calculate the container's computed size (for documentation/debugging purposes)
  // Note: Group blocks don't have explicit size; they're sized by their children
  const computedWidth = direction === 'horizontal' ? totalMainAxis : totalCrossAxis;
  const computedHeight = direction === 'horizontal' ? totalCrossAxis : totalMainAxis;
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Transform carousel
function transformCarousel(
  control: GUIControlOfType<GUIControlType.Carousel>,
  context: TransformContext
): Block {
  const { props } = control;
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, dx, dy, id, currentIndex: indexProp, fVisible } = props;
  const currentIndex = indexProp || GUI_DEFAULTS.carousel.currentIndex;
  
  if (!control.children || control.children.length === 0) {
    return group({ x: xp, y: yp }, []);
  }
  
  // Only show the current item
  const currentChild = control.children[currentIndex];
  const transformed = currentChild ? transformGUIControl(currentChild, context) : null;
  
  const children: Block[] = transformed ? [transformed] : [];
  
  // Add navigation dots
  const ypDot = (dy ?? GUI_DEFAULTS.carousel.dy) + GUI_DEFAULTS.carousel.duDotOffsetY;
  const dxpDotSpacing = GUI_DEFAULTS.carousel.duDotSpacing;
  const dxpTotal = control.children.length * dxpDotSpacing;
  const xpStart = ((dx ?? GUI_DEFAULTS.carousel.dx) - dxpTotal) / 2;
  
  for (let i = 0; i < control.children.length; i++) {
    children.push(
      circle({
        x: xpStart + i * dxpDotSpacing,
        y: ypDot,
        radius: GUI_DEFAULTS.carousel.duDotRadius,
        fill: i === currentIndex ? GUI_DEFAULTS.carousel.colActiveDotFill : GUI_DEFAULTS.carousel.colInactiveDotFill
      })
    );
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Transform grid
function transformGrid(
  control: GUIControlOfType<GUIControlType.Grid>,
  context: TransformContext
): Block {
  const { props } = control;
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    cColumns,
    duSpacing,
    duPadding,
    fVisible
  } = props;

  const columns = cColumns || GUI_DEFAULTS.grid.cColumns;
  const spacing = duSpacing || GUI_DEFAULTS.common.duSpacing;
  const padding = duPadding || GUI_DEFAULTS.common.duPadding;
  
  if (!control.children) {
    return group({ x: xp, y: yp }, []);
  }
  
  const children: Block[] = [];
  let maxRowHeight: number[] = []; // Track height of each row
  let maxColWidth: number[] = []; // Track width of each column
  
  // First pass: determine the maximum dimensions for each row and column
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const rsChild = rsControl(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || GUI_DEFAULTS.common.duAxisStart, rsChild.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || GUI_DEFAULTS.common.duAxisStart, rsChild.height);
  });
  
  // Second pass: position children
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    // Calculate x position based on previous column widths
    let xp = padding;
    for (let c = 0; c < col; c++) {
      xp += maxColWidth[c] + spacing;
    }
    
    // Calculate y position based on previous row heights
    let yp = padding;
    for (let r = 0; r < row; r++) {
      yp += maxRowHeight[r] + spacing;
    }
    
    const transformed = transformGUIControl(child, context);
    
    // Create a new block with updated coordinates instead of mutating
    const positionedBlock = repositionBlock(transformed, xp, yp);
    
    children.push(positionedBlock);
  });
  
  // Calculate total grid size (for documentation/debugging purposes)
  // Note: Group blocks don't have explicit size; they're sized by their children
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + (columns - 1) * spacing + 2 * padding;
  const numRows = Math.ceil(control.children.length / columns);
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + (numRows - 1) * spacing + 2 * padding;
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    children
  );
}

// Helper to transform children with offset
function transformGUIChildren(
  children: GUIControl[],
  context: TransformContext,
  dxpOffset: number = GUI_DEFAULTS.common.x,
  dypOffset: number = GUI_DEFAULTS.common.y
): Block[] {
  return children.map(child => {
    const transformed = transformGUIControl(child, context);
    const { props } = transformed;
    const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y } = props;
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
      // Exhaustive check
      return group({}, []);
  }
}
