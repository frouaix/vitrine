// Transform GUI DSL to Core DSL

import type { Block } from '../core/types.ts';
import { rectangle, circle, text, group, image } from '../core/blocks.ts';
import type {
  GUIControl,
  TransformContext,
  ControlStyle,
  TextBoxProps,
  CheckBoxProps,
  RadioButtonProps,
  ButtonProps,
  SliderProps,
  DropdownProps,
  StackProps,
  HStackProps,
  VStackProps,
  CarouselProps,
  GridProps,
  LabelProps,
  GUIImageProps,
  PanelProps
} from './types.ts';
import { GUIControlType } from './types.ts';
import { GUI_TO_BLOCK_DEFAULTS } from './constants.ts';

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

const GUI_DEFAULTS = GUI_TO_BLOCK_DEFAULTS;

function resolveFlag(props: Record<string, unknown>, stFlag: string, legacyFlag: string): boolean | undefined {
  const fPrimary = props[stFlag] as boolean | undefined;
  const fLegacy = props[legacyFlag] as boolean | undefined;
  return fPrimary ?? fLegacy;
}

function resolveUserString(props: Record<string, unknown>, stKey: string, legacyKey: string): string | undefined {
  const stPrimary = props[stKey] as string | undefined;
  const stLegacy = props[legacyKey] as string | undefined;
  return stPrimary ?? stLegacy;
}

function resolveDx(props: { dx?: number; width?: number }, dxDefault: number): number {
  const { dx, width } = props;
  return dx ?? width ?? dxDefault;
}

function resolveDy(props: { dy?: number; height?: number }, dyDefault: number): number {
  const { dy, height } = props;
  return dy ?? height ?? dyDefault;
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
function getControlDimensions(control: GUIControl): { width: number; height: number } {
  const { props } = control;
  const { dx, dy, width, height } = props;
  
  // If dimensions are explicitly set, use them
  if ((dx ?? width) !== undefined && (dy ?? height) !== undefined) {
    return { width: resolveDx(props, GUI_DEFAULTS.controls.fallback.dx), height: resolveDy(props, GUI_DEFAULTS.controls.fallback.dy) };
  }
  
  // For layout controls, compute size from children
  if (control.type === GUIControlType.Stack || 
      control.type === GUIControlType.VStack || 
      control.type === GUIControlType.HStack) {
    return computeStackDimensions(control);
  }
  
  if (control.type === GUIControlType.Grid) {
    return computeGridDimensions(control);
  }
  
  // Otherwise, use type-specific defaults
  switch (control.type) {
    case GUIControlType.TextBox:
    case GUIControlType.Dropdown:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.textBox.dx), height: resolveDy(props, GUI_DEFAULTS.controls.textBox.dy) };
    case GUIControlType.Button:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.button.dx), height: resolveDy(props, GUI_DEFAULTS.controls.button.dy) };
    case GUIControlType.CheckBox:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.checkBox.dx), height: resolveDy(props, GUI_DEFAULTS.controls.checkBox.dy) };
    case GUIControlType.RadioButton:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.radioButton.dx), height: resolveDy(props, GUI_DEFAULTS.controls.radioButton.dy) };
    case GUIControlType.Slider:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.slider.dx), height: resolveDy(props, GUI_DEFAULTS.controls.slider.dy) };
    case GUIControlType.Label:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.label.dx), height: resolveDy(props, GUI_DEFAULTS.controls.label.dy) };
    case GUIControlType.Panel:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.panel.dx), height: resolveDy(props, GUI_DEFAULTS.controls.panel.dy) };
    default:
      return { width: resolveDx(props, GUI_DEFAULTS.controls.fallback.dx), height: resolveDy(props, GUI_DEFAULTS.controls.fallback.dy) };
  }
}

// Compute dimensions for stack-based layouts
function computeStackDimensions(control: GUIControl): { width: number; height: number } {
  const { props } = control as { props: StackProps };
  const { direction: directionProp, spacing: duSpacing, padding: duPadding } = props;
  const direction = (control.type === GUIControlType.HStack) ? GUI_DEFAULTS.layout.directionHorizontal :
                    (control.type === GUIControlType.VStack) ? GUI_DEFAULTS.layout.directionVertical :
                    (directionProp || GUI_DEFAULTS.controls.stack.direction);
  const spacing = duSpacing || GUI_DEFAULTS.common.duSpacing;
  const padding = duPadding || GUI_DEFAULTS.common.duPadding;
  
  if (!control.children || control.children.length === 0) {
    return { width: GUI_DEFAULTS.common.duMultiplier2 * padding, height: GUI_DEFAULTS.common.duMultiplier2 * padding };
  }
  
  let totalMainAxis = padding;
  let maxCrossAxis = 0;
  
  control.children.forEach((child, index) => {
    const childDims = getControlDimensions(child);
    
    if (direction === GUI_DEFAULTS.layout.directionHorizontal) {
      totalMainAxis += childDims.width;
      maxCrossAxis = Math.max(maxCrossAxis, childDims.height);
    } else {
      totalMainAxis += childDims.height;
      maxCrossAxis = Math.max(maxCrossAxis, childDims.width);
    }
    
    // Add spacing between children (but not after the last one)
    if (index < control.children!.length - GUI_DEFAULTS.common.duOne) {
      totalMainAxis += spacing;
    }
  });
  
  totalMainAxis += padding;
  const totalCrossAxis = maxCrossAxis + GUI_DEFAULTS.common.duMultiplier2 * padding;
  
  return direction === GUI_DEFAULTS.layout.directionHorizontal 
    ? { width: totalMainAxis, height: totalCrossAxis }
    : { width: totalCrossAxis, height: totalMainAxis };
}

// Compute dimensions for grid layout
function computeGridDimensions(control: GUIControl): { width: number; height: number } {
  const { props } = control as { props: GridProps };
  const { columns: duColumns, spacing: duSpacing, padding: duPadding } = props;
  const columns = duColumns || GUI_DEFAULTS.controls.grid.duColumns;
  const spacing = duSpacing || GUI_DEFAULTS.common.duSpacing;
  const padding = duPadding || GUI_DEFAULTS.common.duPadding;
  
  if (!control.children || control.children.length === 0) {
    return { width: GUI_DEFAULTS.common.duMultiplier2 * padding, height: GUI_DEFAULTS.common.duMultiplier2 * padding };
  }
  
  const maxColWidth: number[] = [];
  const maxRowHeight: number[] = [];
  
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const childDims = getControlDimensions(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || GUI_DEFAULTS.common.duAxisStart, childDims.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || GUI_DEFAULTS.common.duAxisStart, childDims.height);
  });
  
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + 
                     Math.max(GUI_DEFAULTS.common.duAxisStart, maxColWidth.length - GUI_DEFAULTS.common.duOne) * spacing + 
                     GUI_DEFAULTS.common.duMultiplier2 * padding;
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + 
                      Math.max(GUI_DEFAULTS.common.duAxisStart, maxRowHeight.length - GUI_DEFAULTS.common.duOne) * spacing + 
                      GUI_DEFAULTS.common.duMultiplier2 * padding;
  
  return { width: totalWidth, height: totalHeight };
}

// Transform textbox to core blocks
function transformTextBox(
  control: GUIControl,
  context: TransformContext,
  state: { fHovered?: boolean; fFocused?: boolean; hovered?: boolean; focused?: boolean } = {}
): Block {
  const { props } = control as { props: TextBoxProps };
  const style = getControlStyle(control, context);
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, onClick, onHover } = props;
  
  const dxp = resolveDx(props, GUI_DEFAULTS.controls.textBox.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.controls.textBox.dy);
  
  const fFocused = state.fFocused ?? state.focused;
  const fHovered = state.fHovered ?? state.hovered;
  const stValue = resolveUserString(props as unknown as Record<string, unknown>, 'stValue', 'value');
  const stPlaceholder = resolveUserString(props as unknown as Record<string, unknown>, 'stPlaceholder', 'placeholder');
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible', 'visible');

  const colBg = fFocused
    ? style.backgroundColor
    : fHovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  const colBorder = fFocused
    ? style.focusBorderColor || style.borderColor
    : style.borderColor;
  const colText = stValue ? style.textColor : (style.disabledTextColor || style.textColor);
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBg,
      stroke: colBorder,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius,
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
        x: style.padding || GUI_DEFAULTS.controls.textBox.duTextPadding,
        y: dyp / 2,
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

// Transform checkbox to core blocks
function transformCheckBox(
  control: GUIControl,
  context: TransformContext,
  state: { fHovered?: boolean; hovered?: boolean } = {}
): Block {
  const { props } = control as { props: CheckBoxProps };
  const style = getControlStyle(control, context);
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, onHover, onChange } = props;
  
  const dypBox = GUI_DEFAULTS.controls.checkBox.duBox;
  const dxpLabelSpacing = GUI_DEFAULTS.controls.checkBox.duLabelSpacing;
  const { borderColor: colBorder, textColor: colText } = style;
  
  const children: Block[] = [];
  
  const fHovered = state.fHovered ?? state.hovered;
  const fChecked = resolveFlag(props as unknown as Record<string, unknown>, 'fChecked', 'checked') === true;
  const stLabel = resolveUserString(props as unknown as Record<string, unknown>, 'stLabel', 'label');
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible', 'visible');

  // Checkbox box
  const colBg = fChecked
    ? style.checkedBackgroundColor
    : fHovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
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
        text: GUI_DEFAULTS.controls.checkBox.checkmark.stText,
        x: dypBox / 2,
        y: dypBox / 2,
        fill: GUI_DEFAULTS.controls.checkBox.checkmark.colFill,
        fontSize: GUI_DEFAULTS.controls.checkBox.checkmark.duFont,
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
  state: { fHovered?: boolean; hovered?: boolean } = {}
): Block {
  const { props } = control as { props: RadioButtonProps };
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, value: stValue, onChange, onHover } = props;
  const fHovered = state.fHovered ?? state.hovered;
  const fChecked = resolveFlag(props as unknown as Record<string, unknown>, 'fChecked', 'checked') === true;
  const stLabel = resolveUserString(props as unknown as Record<string, unknown>, 'stLabel', 'label');
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible', 'visible');
  const style = getControlStyle(control, context);
  
  const rl = GUI_DEFAULTS.controls.radioButton.duRadius;
  const dxpLabelSpacing = GUI_DEFAULTS.controls.radioButton.duLabelSpacing;
  const {
    borderColor: colBorder,
    checkedBackgroundColor: colChecked,
    textColor: colText
  } = style;
  
  const children: Block[] = [];
  
  // Radio circle
  const colBg = fHovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
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
        radius: GUI_DEFAULTS.controls.radioButton.duInnerDotRadius,
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
  state: { fHovered?: boolean; fPressed?: boolean; hovered?: boolean; pressed?: boolean } = {}
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
  const fEnabled = resolveFlag(props as unknown as Record<string, unknown>, 'fEnabled', 'enabled');
  const stLabel = resolveUserString(props as unknown as Record<string, unknown>, 'stLabel', 'label') || '';
  const fHovered = state.fHovered ?? state.hovered;
  const fPressed = state.fPressed ?? state.pressed;
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible', 'visible');
  
  // Use className based on variant if no className specified
  let { className } = props;
  if (!className && variant) {
    className = `${variant}-button`;
  }
  
  const style = getControlStyle({ ...control, props: { ...props, className } } as GUIControl, context);
  
  const dxp = resolveDx(props, GUI_DEFAULTS.controls.button.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.controls.button.dy);
  
  const colBg = !fEnabled && fEnabled !== undefined
    ? style.disabledBackgroundColor
    : fPressed
    ? style.activeBackgroundColor
    : fHovered
    ? style.hoverBackgroundColor
    : style.backgroundColor;
  
  const colText = !fEnabled && fEnabled !== undefined
    ? style.disabledTextColor
    : style.textColor;
  const { borderColor: colBorder } = style;
  
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
  state: { hovered?: boolean } = {}
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
  
  const dxp = resolveDx(props, GUI_DEFAULTS.controls.slider.dx);
  const dypTrack = GUI_DEFAULTS.controls.slider.duTrack;
  const rlThumb = GUI_DEFAULTS.controls.slider.duThumbRadius;
  
  const min = minProp ?? GUI_DEFAULTS.controls.slider.min;
  const max = maxProp ?? GUI_DEFAULTS.controls.slider.max;
  const value = valueProp ?? min;
  const colTrackFill = style.sliderTrackColor || GUI_DEFAULTS.controls.slider.colTrackFill;
  const colTrackStroke = GUI_DEFAULTS.controls.slider.colTrackStroke;
  const colThumbFill = style.sliderThumbColor || GUI_DEFAULTS.controls.slider.colThumbFill;
  const colThumbStroke = GUI_DEFAULTS.controls.slider.colThumbStroke;
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
      y: -dypTrack / GUI_DEFAULTS.common.duMultiplier2,
      dx: dxp,
      dy: dypTrack,
      fill: colTrackFill,
      cornerRadius: dypTrack / GUI_DEFAULTS.common.duMultiplier2,
      stroke: colTrackStroke,
      strokeWidth: GUI_DEFAULTS.controls.slider.duTrackStroke
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
      strokeWidth: GUI_DEFAULTS.controls.slider.duThumbStroke,
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

  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible', 'visible');
  
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
  state: { fHovered?: boolean; fOpen?: boolean; hovered?: boolean; open?: boolean } = {}
): Block {
  const { props } = control as { props: DropdownProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    value: legacyValue,
    options,
    onClick,
    onHover
  } = props;
  const style = getControlStyle(control, context);
  
  const dxp = resolveDx(props, GUI_DEFAULTS.controls.dropdown.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.controls.dropdown.dy);
  
  const fHovered = state.fHovered ?? state.hovered;
  const stPlaceholder = resolveUserString(props as unknown as Record<string, unknown>, 'stPlaceholder', 'placeholder');
  const stValue = resolveUserString(props as unknown as Record<string, unknown>, 'stValue', 'value') ?? legacyValue;
  const fVisible = resolveFlag(props as unknown as Record<string, unknown>, 'fVisible', 'visible');

  const colBg = fHovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  const { borderColor: colBorder } = style;
  
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
  const colText = selectedOption ? style.textColor : (style.disabledTextColor || style.textColor);
  const stDisplay = selectedOption?.stLabel || selectedOption?.label || stPlaceholder || GUI_DEFAULTS.controls.dropdown.stPlaceholder;
  
  children.push(
    text({
      text: stDisplay,
      x: style.padding || GUI_DEFAULTS.controls.dropdown.duTextPadding,
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
      text: GUI_DEFAULTS.controls.dropdown.stArrow,
      x: dxp - (style.padding || GUI_DEFAULTS.controls.dropdown.duTextPadding) - GUI_DEFAULTS.controls.dropdown.duArrowOffsetX,
      y: dyp / 2,
      fill: colText,
      fontSize: GUI_DEFAULTS.controls.dropdown.duArrowFont,
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
  const { textColor: colText } = style;
  const stText = resolveUserString(propsRest as unknown as Record<string, unknown>, 'stText', 'text') || '';
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible', 'visible');
  
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
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible', 'visible');
  
  const dxp = resolveDx(props, GUI_DEFAULTS.controls.image.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.controls.image.dy);
  
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
    padding: duPadding,
    ...propsRest
  } = props;
  const style = getControlStyle(control, context);
  const stTitle = resolveUserString(propsRest as unknown as Record<string, unknown>, 'stTitle', 'title');
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible', 'visible');
  
  const dxp = resolveDx(props, GUI_DEFAULTS.controls.panel.dx);
  const dyp = resolveDy(props, GUI_DEFAULTS.controls.panel.dy);
  const padding = duPadding || style.padding || GUI_DEFAULTS.controls.panel.duPadding;
  const {
    backgroundColor: colBg,
    borderColor: colBorder,
    textColor: colText
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
    const ypContent = stTitle ? padding + (style.fontSize || GUI_DEFAULTS.controls.panel.duTitleFont) + GUI_DEFAULTS.controls.panel.duTitleGap : padding;
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
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: StackProps };
  const {
    x: xp = GUI_DEFAULTS.common.x,
    y: yp = GUI_DEFAULTS.common.y,
    id,
    direction: directionProp,
    spacing: duSpacing,
    padding: duPadding,
    ...propsRest
  } = props;
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible', 'visible');

  const direction = directionProp || GUI_DEFAULTS.controls.stack.direction;
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
    const childDims = getControlDimensions(child);
    
    // Create a new block with updated coordinates instead of mutating
    const positionedBlock = repositionBlock(
      transformed,
      direction === GUI_DEFAULTS.layout.directionHorizontal ? dypOffset : padding,
      direction === GUI_DEFAULTS.layout.directionHorizontal ? padding : dypOffset
    );
    
    dypOffset += (direction === GUI_DEFAULTS.layout.directionHorizontal ? childDims.width : childDims.height) + spacing;
    
    // Track the maximum size in the cross-axis direction
    if (direction === GUI_DEFAULTS.layout.directionHorizontal) {
      maxCrossAxis = Math.max(maxCrossAxis, childDims.height);
    } else {
      maxCrossAxis = Math.max(maxCrossAxis, childDims.width);
    }
    
    children.push(positionedBlock);
  }
  
  // Remove the trailing spacing from the last child
  const totalMainAxis = dypOffset - spacing + padding;
  const totalCrossAxis = maxCrossAxis + GUI_DEFAULTS.common.duMultiplier2 * padding;
  
  // Calculate the container's computed size (for documentation/debugging purposes)
  // Note: Group blocks don't have explicit size; they're sized by their children
  const computedWidth = direction === GUI_DEFAULTS.layout.directionHorizontal ? totalMainAxis : totalCrossAxis;
  const computedHeight = direction === GUI_DEFAULTS.layout.directionHorizontal ? totalCrossAxis : totalMainAxis;
  
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

// Transform HStack
function transformHStack(
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: HStackProps };
  return transformStack(
    {
      ...control,
      type: GUIControlType.Stack,
      props: { ...props, direction: GUI_DEFAULTS.layout.directionHorizontal } as StackProps
    },
    context
  );
}

// Transform VStack
function transformVStack(
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: VStackProps };
  return transformStack(
    {
      ...control,
      type: GUIControlType.Stack,
      props: { ...props, direction: GUI_DEFAULTS.layout.directionVertical } as StackProps
    },
    context
  );
}

// Transform carousel
function transformCarousel(
  control: GUIControl,
  context: TransformContext
): Block {
  const { props } = control as { props: CarouselProps };
  const { x: xp = GUI_DEFAULTS.common.x, y: yp = GUI_DEFAULTS.common.y, id, currentIndex: indexProp, ...propsRest } = props;
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible', 'visible');
  const currentIndex = indexProp || GUI_DEFAULTS.controls.carousel.currentIndex;
  
  if (!control.children || control.children.length === 0) {
    return group({ x: xp, y: yp }, []);
  }
  
  // Only show the current item
  const currentChild = control.children[currentIndex];
  const transformed = currentChild ? transformGUIControl(currentChild, context) : null;
  
  const children: Block[] = transformed ? [transformed] : [];
  
  // Add navigation dots
  const ypDot = resolveDy(props, GUI_DEFAULTS.controls.carousel.dy) + GUI_DEFAULTS.controls.carousel.duDotOffsetY;
  const dxpDotSpacing = GUI_DEFAULTS.controls.carousel.duDotSpacing;
  const dxpTotal = control.children.length * dxpDotSpacing;
  const xpStart = (resolveDx(props, GUI_DEFAULTS.controls.carousel.dx) - dxpTotal) / 2;
  
  for (let i = 0; i < control.children.length; i++) {
    children.push(
      circle({
        x: xpStart + i * dxpDotSpacing,
        y: ypDot,
        radius: GUI_DEFAULTS.controls.carousel.duDotRadius,
        fill: i === currentIndex ? GUI_DEFAULTS.controls.carousel.colActiveDotFill : GUI_DEFAULTS.controls.carousel.colInactiveDotFill
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
    columns: duColumns,
    spacing: duSpacing,
    padding: duPadding,
    ...propsRest
  } = props;
  const fVisible = resolveFlag(propsRest as unknown as Record<string, unknown>, 'fVisible', 'visible');

  const columns = duColumns || GUI_DEFAULTS.controls.grid.duColumns;
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
    const childDims = getControlDimensions(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || GUI_DEFAULTS.common.duAxisStart, childDims.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || GUI_DEFAULTS.common.duAxisStart, childDims.height);
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
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + (columns - GUI_DEFAULTS.common.duOne) * spacing + GUI_DEFAULTS.common.duMultiplier2 * padding;
  const numRows = Math.ceil(control.children.length / columns);
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + (numRows - GUI_DEFAULTS.common.duOne) * spacing + GUI_DEFAULTS.common.duMultiplier2 * padding;
  
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
    case GUIControlType.Stack:
      return transformStack(control, context);
    case GUIControlType.HStack:
      return transformHStack(control, context);
    case GUIControlType.VStack:
      return transformVStack(control, context);
    case GUIControlType.Carousel:
      return transformCarousel(control, context);
    case GUIControlType.Grid:
      return transformGrid(control, context);
    default:
      // Exhaustive check
      return group({}, []);
  }
}
