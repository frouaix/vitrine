// Copyright (c) 2026 François Rouaix

// Transform GUI DSL to Core DSL

import type { Block } from '../core/types.ts';
import { rectangle, circle, text, group, image } from '../core/blocks.ts';
import type {
  Rs,
  LayoutDirection,
  GUIControl,
  GUIControlOfType,
  TransformContext,
  ControlStyle,
  CheckBoxProps,
  RadioButtonProps,
  ButtonProps,
  SliderProps,
  DropdownProps,
  CarouselProps,
  GridProps,
  LabelProps,
  GUIImageProps,
  PanelProps
} from './types.ts';
import { GUIControlType } from './types.ts';
import { GUI_DEFAULTS } from './constants.ts';
import { resolveFlag, resolveUserString, resolveDx, resolveDy } from './transformUtils.ts';

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
    default:
      return { width: resolveDx(props, rsFallback.width), height: resolveDy(props, rsFallback.height) };
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
    colBackground,
    colHoverBackground,
    colFocusBorder,
    colBorder: colBorderStyle,
    colText,
    colDisabledText,
    borderWidth,
    borderRadius,
    duPadding,
    fontSize,
    fontFamily
  } = style;
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, onClick, onHover } = props;
  
  const dxp = resolveDx(props, GUI_DEFAULTS.textBox.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.textBox.dy);
  
  const { fFocused, fHovered } = state;
  const stValue = resolveUserString(props as unknown as Record<string, unknown>, 'stValue');
  const stPlaceholder = resolveUserString(props as unknown as Record<string, unknown>, 'stPlaceholder');
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible');

  const colBg = fFocused
    ? colBackground
    : fHovered
    ? colHoverBackground || colBackground
    : colBackground;
  
  const colBorder = fFocused
    ? colFocusBorder || colBorderStyle
    : colBorderStyle;
  const colTextActual = stValue ? colText : (colDisabledText || colText);
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBg,
      stroke: colBorder,
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
  control: GUIControl,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control as { props: CheckBoxProps };
  const style = getControlStyle(control, context);
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, onHover, onChange } = props;
  
  const dypBox = GUI_DEFAULTS.checkBox.duBox;
  const dxpLabelSpacing = GUI_DEFAULTS.checkBox.duLabelSpacing;
  const { colBorder, colText } = style;
  
  const children: Block[] = [];
  
  const fHovered = state.fHovered;
  const fChecked = resolveFlag(props as unknown as Record<string, unknown>, 'fChecked') === true;
  const stLabel = resolveUserString(props as unknown as Record<string, unknown>, 'stLabel');
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible');

  // Checkbox box
  const colBg = fChecked
    ? style.colCheckedBackground
    : fHovered
    ? style.colHoverBackground || style.colBackground
    : style.colBackground;
  
  children.push(
    rectangle({
      dx: dypBox,
      dy: dypBox,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius,
      onClick: onChange ? (event: PointerEvent) => onChange(!fChecked) : undefined,
      onHover
    })
  );
  
  // Check mark
  if (fChecked) {
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
        fontSize: style.fontSize,
        font: style.fontFamily,
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
  control: GUIControl,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control as { props: RadioButtonProps };
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, stValue, onChange, onHover } = props;
  const fHovered = state.fHovered;
  const fChecked = resolveFlag(props as unknown as Record<string, unknown>, 'fChecked') === true;
  const stLabel = resolveUserString(props as unknown as Record<string, unknown>, 'stLabel');
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible');
  const style = getControlStyle(control, context);
  
  const rl = GUI_DEFAULTS.radioButton.duRadius;
  const dxpLabelSpacing = GUI_DEFAULTS.radioButton.duLabelSpacing;
  const {
    colBorder,
    colCheckedBackground: colChecked,
    colText
  } = style;
  
  const children: Block[] = [];
  
  // Radio circle
  const colBg = fHovered
    ? style.colHoverBackground || style.colBackground
    : style.colBackground;
  
  children.push(
    circle({
      radius: rl,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: style.borderWidth,
      onClick: onChange && stValue ? (event: PointerEvent) => onChange(stValue) : undefined,
      onHover
    })
  );
  
  // Inner dot when checked
  if (fChecked) {
    children.push(
      circle({
        radius: GUI_DEFAULTS.radioButton.duInnerDotRadius,
        fill: colChecked
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
        fontSize: style.fontSize,
        font: style.fontFamily,
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
  control: GUIControl,
  context: TransformContext,
  state: { fHovered?: boolean; fPressed?: boolean } = {}
): Block {
  const { props } = control as { props: ButtonProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    variant,
    onClick,
    onHover
  } = props;
  const fEnabled = resolveFlag(props as unknown as Record<string, unknown>, 'fEnabled');
  const stLabel = resolveUserString(props as unknown as Record<string, unknown>, 'stLabel') || '';
  const fHovered = state.fHovered;
  const fPressed = state.fPressed;
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible');
  
  // Use className based on variant if no className specified
  let { className } = props;
  if (!className && variant) {
    className = `${variant}-button`;
  }
  
  const style = getControlStyle({ ...control, props: { ...props, className } } as GUIControl, context);
  
  const dxp = resolveDx(props, GUI_DEFAULTS.button.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.button.dy);
  
  const colBg = !fEnabled && fEnabled !== undefined
    ? style.colDisabledBackground
    : fPressed
    ? style.colActiveBackground
    : fHovered
    ? style.colHoverBackground
    : style.colBackground;
  
  const colText = !fEnabled && fEnabled !== undefined
    ? style.colDisabledText
    : style.colText;
  const { colBorder } = style;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius
    })
  );
  
  // Label
  children.push(
    text({
      text: stLabel,
      x: dxp / 2,
      y: dyp / 2,
      fill: colText,
      fontSize: style.fontSize,
      font: style.fontFamily,
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
  control: GUIControl,
  context: TransformContext,
  state: { fHovered?: boolean } = {}
): Block {
  const { props } = control as { props: SliderProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    min: minProp,
    max: maxProp,
    value: valueProp,
    onChange,
    onHover
  } = props;
  const style = getControlStyle(control, context);
  
  const dxp = resolveDx(props, GUI_DEFAULTS.slider.dx);
  const dypTrack = GUI_DEFAULTS.slider.duTrack;
  const rlThumb = GUI_DEFAULTS.slider.duThumbRadius;
  
  const min = minProp ?? GUI_DEFAULTS.slider.min;
  const max = maxProp ?? GUI_DEFAULTS.slider.max;
  const value = valueProp ?? min;
  const colTrackFill = style.colSliderTrack || GUI_DEFAULTS.slider.colTrackFill;
  const colTrackStroke = GUI_DEFAULTS.slider.colTrackStroke;
  const colThumbFill = style.colSliderThumb || GUI_DEFAULTS.slider.colThumbFill;
  const colThumbStroke = GUI_DEFAULTS.slider.colThumbStroke;
  const normalizedValue = (value - min) / (max - min);
  const xlpThumb = normalizedValue * dxp;
  
  // Persistent drag state (stored on props to survive re-renders)
  if (!(props as any)._dragState) {
    (props as any)._dragState = { fDragging: false, xwStart: 0, startValue: 0 };
  }
  const dragState = (props as any)._dragState;
  
  const children: Block[] = [];
  
  // Visual track
  children.push(
    rectangle({
      x: 0,
      y: -dypTrack / 2,
      dx: dxp,
      dy: dypTrack,
      fill: colTrackFill,
      cornerRadius: dypTrack / 2,
      stroke: colTrackStroke,
      strokeWidth: GUI_DEFAULTS.slider.duTrackStroke
    })
  );
  
  // Thumb - draggable
  children.push(
    circle({
      x: xlpThumb,
      y: 0,
      radius: rlThumb,
      fill: colThumbFill,
      stroke: colThumbStroke,
      strokeWidth: GUI_DEFAULTS.slider.duThumbStroke,
      onPointerDown: onChange ? (e: PointerEvent) => {
        dragState.fDragging = true;
        dragState.xwStart = e.clientX;
        dragState.startValue = value;
      } : undefined,
      onDrag: onChange ? (e: PointerEvent) => {
        if (!dragState.fDragging) return;
        
        const { target: canvas } = e as PointerEvent & { target: HTMLCanvasElement };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        
        // Calculate delta from drag start
        const dxc = (e.clientX - dragState.xwStart) * scaleX;
        const deltaValue = (dxc / dxp) * (max - min);
        const newValue = Math.max(min, Math.min(max, dragState.startValue + deltaValue));
        
        onChange?.(newValue);
      } : undefined,
      onPointerUp: () => {
        dragState.fDragging = false;
      }
    })
  );

  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible');
  
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
  control: GUIControl,
  context: TransformContext,
  state: { fHovered?: boolean; fOpen?: boolean } = {}
): Block {
  const { props } = control as { props: DropdownProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    stValue,
    options,
    onClick,
    onHover
  } = props;
  const style = getControlStyle(control, context);
  
  const dxp = resolveDx(props, GUI_DEFAULTS.dropdown.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.dropdown.dy);
  
  const fHovered = state.fHovered;
  const stPlaceholder = resolveUserString(props as unknown as Record<string, unknown>, 'stPlaceholder');
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible');

  const colBg = fHovered
    ? style.colHoverBackground || style.colBackground
    : style.colBackground;
  const { colBorder } = style;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius
    })
  );
  
  // Display text
  const selectedOption = options.find(opt => opt.value === stValue);
  const colText = selectedOption ? style.colText : (style.colDisabledText || style.colText);
  const stDisplay = selectedOption?.stLabel || stPlaceholder || GUI_DEFAULTS.dropdown.stPlaceholder;
  
  children.push(
    text({
      text: stDisplay,
      x: style.duPadding || GUI_DEFAULTS.dropdown.duTextPadding,
      y: dyp / 2,
      fill: colText,
      fontSize: style.fontSize,
      font: style.fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  // Arrow indicator
  children.push(
    text({
      text: GUI_DEFAULTS.dropdown.stArrow,
      x: dxp - (style.duPadding || GUI_DEFAULTS.dropdown.duTextPadding) - GUI_DEFAULTS.dropdown.duArrowOffsetX,
      y: dyp / 2,
      fill: colText,
      fontSize: GUI_DEFAULTS.dropdown.duArrowFont,
      baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id,
      onClick,
      onHover
    },
    children
  );
}

// Transform label to core blocks
function transformLabel(
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: LabelProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    fontSize: duFont,
    align,
    ...propsRest
  } = props;
  const style = getControlStyle(control, context);
  const { colText } = style;
  const stText = resolveUserString(propsRest as unknown as Record<string, unknown>, 'stText') || '';
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible');
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id
    },
    [
      text({
        text: stText,
        fill: colText,
        fontSize: duFont || style.fontSize,
        font: style.fontFamily,
        align
      })
    ]
  );
}

// Transform GUI image to core blocks
function transformGUIImage(
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: GUIImageProps };
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, src, ...propsRest } = props;
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible');
  
  const dxp = resolveDx(props, GUI_DEFAULTS.image.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.image.dy);
  
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
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: PanelProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    duPadding,
    ...propsRest
  } = props;
  const style = getControlStyle(control, context);
  const stTitle = resolveUserString(propsRest as unknown as Record<string, unknown>, 'stTitle');
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible');
  
  const dxp = resolveDx(props, GUI_DEFAULTS.panel.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.panel.dy);
  const padding = duPadding || style.duPadding || GUI_DEFAULTS.panel.duPadding;
  const {
    colBackground: colBg,
    colBorder,
    colText
  } = style;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius
    })
  );
  
  // Title if provided
  if (stTitle) {
    children.push(
      text({
        text: stTitle,
        x: padding,
        y: padding,
        fill: colText,
        fontSize: style.fontSize,
        font: style.fontFamily
      })
    );
  }
  
  // Transform children
  if (control.children) {
    const ypContent = stTitle ? padding + (style.fontSize || GUI_DEFAULTS.panel.duTitleFont) + GUI_DEFAULTS.panel.duTitleGap : padding;
    const transformedChildren = transformGUIChildren(control.children, context, padding, ypContent);
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
    ...propsRest
  } = props;
  const direction: LayoutDirection = control.type === GUIControlType.HStack ? 'horizontal' : 'vertical';
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible');

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
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: CarouselProps };
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, currentIndex: indexProp, ...propsRest } = props;
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible');
  const currentIndex = indexProp || GUI_DEFAULTS.carousel.currentIndex;
  
  if (!control.children || control.children.length === 0) {
    return group({ x: xp, y: yp }, []);
  }
  
  // Only show the current item
  const currentChild = control.children[currentIndex];
  const transformed = currentChild ? transformGUIControl(currentChild, context) : null;
  
  const children: Block[] = transformed ? [transformed] : [];
  
  // Add navigation dots
  const ypDot = resolveDy(props, GUI_DEFAULTS.carousel.dy) + GUI_DEFAULTS.carousel.duDotOffsetY;
  const dxpDotSpacing = GUI_DEFAULTS.carousel.duDotSpacing;
  const dxpTotal = control.children.length * dxpDotSpacing;
  const xpStart = (resolveDx(props, GUI_DEFAULTS.carousel.dx) - dxpTotal) / 2;
  
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
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: GridProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    cColumns,
    duSpacing,
    duPadding,
    ...propsRest
  } = props;
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible');

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
    default:
      // Exhaustive check
      return group({}, []);
  }
}
