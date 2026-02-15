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

// Helper to get style for a control
function getControlStyle(
  control: GUIControl,
  context: TransformContext
): ControlStyle {
  const { theme } = context;
  
  // Check for custom class style first
  if (control.props.className && theme.styles[control.props.className]) {
    return { ...(theme.defaults[control.type] || {}), ...theme.styles[control.props.className] };
  }
  
  // Fall back to default style for control type
  return theme.defaults[control.type] || {};
}

// Helper to get the rendered dimensions of a control
function getControlDimensions(control: GUIControl): { width: number; height: number } {
  const props = control.props;
  
  // If dimensions are explicitly set, use them
  if (props.width && props.height) {
    return { width: props.width, height: props.height };
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
      return { width: props.width || GUI_DEFAULTS.controls.textBox.width, height: props.height || GUI_DEFAULTS.controls.textBox.height };
    case GUIControlType.Button:
      return { width: props.width || GUI_DEFAULTS.controls.button.width, height: props.height || GUI_DEFAULTS.controls.button.height };
    case GUIControlType.CheckBox:
      return { width: props.width || GUI_DEFAULTS.controls.checkBox.width, height: props.height || GUI_DEFAULTS.controls.checkBox.height };
    case GUIControlType.RadioButton:
      return { width: props.width || GUI_DEFAULTS.controls.radioButton.width, height: props.height || GUI_DEFAULTS.controls.radioButton.height };
    case GUIControlType.Slider:
      return { width: props.width || GUI_DEFAULTS.controls.slider.width, height: props.height || GUI_DEFAULTS.controls.slider.height };
    case GUIControlType.Label:
      return { width: props.width || GUI_DEFAULTS.controls.label.width, height: props.height || GUI_DEFAULTS.controls.label.height };
    case GUIControlType.Panel:
      return { width: props.width || GUI_DEFAULTS.controls.panel.width, height: props.height || GUI_DEFAULTS.controls.panel.height };
    default:
      return { width: props.width || GUI_DEFAULTS.controls.fallback.width, height: props.height || GUI_DEFAULTS.controls.fallback.height };
  }
}

// Compute dimensions for stack-based layouts
function computeStackDimensions(control: GUIControl): { width: number; height: number } {
  const props = control.props as StackProps;
  const direction = (control.type === GUIControlType.HStack) ? GUI_DEFAULTS.layout.directionHorizontal :
                    (control.type === GUIControlType.VStack) ? GUI_DEFAULTS.layout.directionVertical :
                    (props.direction || GUI_DEFAULTS.controls.stack.direction);
  const spacing = props.spacing || GUI_DEFAULTS.common.spacing;
  const padding = props.padding || GUI_DEFAULTS.common.padding;
  
  if (!control.children || control.children.length === 0) {
    return { width: GUI_DEFAULTS.common.multiplier2 * padding, height: GUI_DEFAULTS.common.multiplier2 * padding };
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
    if (index < control.children!.length - GUI_DEFAULTS.common.one) {
      totalMainAxis += spacing;
    }
  });
  
  totalMainAxis += padding;
  const totalCrossAxis = maxCrossAxis + GUI_DEFAULTS.common.multiplier2 * padding;
  
  return direction === GUI_DEFAULTS.layout.directionHorizontal 
    ? { width: totalMainAxis, height: totalCrossAxis }
    : { width: totalCrossAxis, height: totalMainAxis };
}

// Compute dimensions for grid layout
function computeGridDimensions(control: GUIControl): { width: number; height: number } {
  const props = control.props as GridProps;
  const columns = props.columns || GUI_DEFAULTS.controls.grid.columns;
  const spacing = props.spacing || GUI_DEFAULTS.common.spacing;
  const padding = props.padding || GUI_DEFAULTS.common.padding;
  
  if (!control.children || control.children.length === 0) {
    return { width: GUI_DEFAULTS.common.multiplier2 * padding, height: GUI_DEFAULTS.common.multiplier2 * padding };
  }
  
  const maxColWidth: number[] = [];
  const maxRowHeight: number[] = [];
  
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const childDims = getControlDimensions(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || GUI_DEFAULTS.common.axisStart, childDims.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || GUI_DEFAULTS.common.axisStart, childDims.height);
  });
  
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + 
                     Math.max(GUI_DEFAULTS.common.axisStart, maxColWidth.length - GUI_DEFAULTS.common.one) * spacing + 
                     GUI_DEFAULTS.common.multiplier2 * padding;
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + 
                      Math.max(GUI_DEFAULTS.common.axisStart, maxRowHeight.length - GUI_DEFAULTS.common.one) * spacing + 
                      GUI_DEFAULTS.common.multiplier2 * padding;
  
  return { width: totalWidth, height: totalHeight };
}

// Transform textbox to core blocks
function transformTextBox(
  control: GUIControl,
  context: TransformContext,
  state: { hovered?: boolean; focused?: boolean } = {}
): Block {
  const props = control.props as TextBoxProps;
  const style = getControlStyle(control, context);
  
  const dxp = props.width || GUI_DEFAULTS.controls.textBox.width;
  const dyp = props.height || GUI_DEFAULTS.controls.textBox.height;
  
  const bgColor = state.focused
    ? style.backgroundColor
    : state.hovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  const borderColor = state.focused
    ? style.focusBorderColor || style.borderColor
    : style.borderColor;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: bgColor,
      stroke: borderColor,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius,
      onClick: props.onClick,
      onHover: props.onHover
    })
  );
  
  // Text content
  const displayText = props.value || props.placeholder || GUI_DEFAULTS.common.emptyText;
  if (displayText) {
    children.push(
      text({
        text: displayText,
        x: style.padding || GUI_DEFAULTS.controls.textBox.textPadding,
        y: dyp / 2,
        fill: props.value ? style.textColor : (style.disabledTextColor || style.textColor),
        fontSize: style.fontSize,
        font: style.fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    children
  );
}

// Transform checkbox to core blocks
function transformCheckBox(
  control: GUIControl,
  context: TransformContext,
  state: { hovered?: boolean } = {}
): Block {
  const props = control.props as CheckBoxProps;
  const style = getControlStyle(control, context);
  
  const dypBox = GUI_DEFAULTS.controls.checkBox.boxSize;
  const dxpLabelSpacing = GUI_DEFAULTS.controls.checkBox.labelSpacing;
  
  const children: Block[] = [];
  
  // Checkbox box
  const bgColor = props.checked
    ? style.checkedBackgroundColor
    : state.hovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  children.push(
    rectangle({
      dx: dypBox,
      dy: dypBox,
      fill: bgColor,
      stroke: style.borderColor,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius,
      onClick: props.onChange ? (event: PointerEvent) => props.onChange!(!props.checked) : undefined,
      onHover: props.onHover
    })
  );
  
  // Check mark
  if (props.checked) {
    children.push(
      text({
        text: GUI_DEFAULTS.controls.checkBox.checkmark.text,
        x: dypBox / 2,
        y: dypBox / 2,
        fill: GUI_DEFAULTS.controls.checkBox.checkmark.fill,
        fontSize: GUI_DEFAULTS.controls.checkBox.checkmark.fontSize,
        align: GUI_DEFAULTS.text.alignCenter,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  // Label
  if (props.label) {
    children.push(
      text({
        text: props.label,
        x: dypBox + dxpLabelSpacing,
        y: dypBox / 2,
        fill: style.textColor,
        fontSize: style.fontSize,
        font: style.fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    children
  );
}

// Transform radio button to core blocks
function transformRadioButton(
  control: GUIControl,
  context: TransformContext,
  state: { hovered?: boolean } = {}
): Block {
  const props = control.props as RadioButtonProps;
  const style = getControlStyle(control, context);
  
  const rl = GUI_DEFAULTS.controls.radioButton.radius;
  const dxpLabelSpacing = GUI_DEFAULTS.controls.radioButton.labelSpacing;
  
  const children: Block[] = [];
  
  // Radio circle
  const bgColor = state.hovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  children.push(
    circle({
      radius: rl,
      fill: bgColor,
      stroke: style.borderColor,
      strokeWidth: style.borderWidth,
      onClick: props.onChange && props.value ? (event: PointerEvent) => props.onChange!(props.value!) : undefined,
      onHover: props.onHover
    })
  );
  
  // Inner dot when checked
  if (props.checked) {
    children.push(
      circle({
        radius: GUI_DEFAULTS.controls.radioButton.innerDotRadius,
        fill: style.checkedBackgroundColor
      })
    );
  }
  
  // Label
  if (props.label) {
    children.push(
      text({
        text: props.label,
        x: rl + dxpLabelSpacing,
        y: 0,
        fill: style.textColor,
        fontSize: style.fontSize,
        font: style.fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
      })
    );
  }
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    children
  );
}

// Transform button to core blocks
function transformButton(
  control: GUIControl,
  context: TransformContext,
  state: { hovered?: boolean; pressed?: boolean } = {}
): Block {
  const props = control.props as ButtonProps;
  
  // Use className based on variant if no className specified
  let className = props.className;
  if (!className && props.variant) {
    className = `${props.variant}-button`;
  }
  
  const style = getControlStyle({ ...control, props: { ...props, className } } as GUIControl, context);
  
  const dxp = props.width || GUI_DEFAULTS.controls.button.width;
  const dyp = props.height || GUI_DEFAULTS.controls.button.height;
  
  const bgColor = !props.enabled && props.enabled !== undefined
    ? style.disabledBackgroundColor
    : state.pressed
    ? style.activeBackgroundColor
    : state.hovered
    ? style.hoverBackgroundColor
    : style.backgroundColor;
  
  const textColor = !props.enabled && props.enabled !== undefined
    ? style.disabledTextColor
    : style.textColor;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: bgColor,
      stroke: style.borderColor,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius
    })
  );
  
  // Label
  children.push(
    text({
      text: props.label,
      x: dxp / 2,
      y: dyp / 2,
      fill: textColor,
      fontSize: style.fontSize,
      font: style.fontFamily,
      align: GUI_DEFAULTS.text.alignCenter,
      baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id,
      onClick: props.enabled !== false && props.onClick ? (event: PointerEvent) => props.onClick!() : undefined,
      onHover: props.onHover
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
  const props = control.props as SliderProps;
  const style = getControlStyle(control, context);
  
  const dxp = props.width || GUI_DEFAULTS.controls.slider.width;
  const dypTrack = GUI_DEFAULTS.controls.slider.trackHeight;
  const rlThumb = GUI_DEFAULTS.controls.slider.thumbRadius;
  
  const min = props.min ?? GUI_DEFAULTS.controls.slider.min;
  const max = props.max ?? GUI_DEFAULTS.controls.slider.max;
  const value = props.value ?? min;
  const normalizedValue = (value - min) / (max - min);
  const xlpThumb = normalizedValue * dxp;
  
  // Persistent drag state (stored on props to survive re-renders)
  if (!(props as any)._dragState) {
    (props as any)._dragState = { dragging: false, xwStart: 0, startValue: 0 };
  }
  const dragState = (props as any)._dragState;
  
  const children: Block[] = [];
  
  // Visual track
  children.push(
    rectangle({
      x: 0,
      y: -dypTrack / GUI_DEFAULTS.common.multiplier2,
      dx: dxp,
      dy: dypTrack,
      fill: style.sliderTrackColor || GUI_DEFAULTS.controls.slider.trackFill,
      cornerRadius: dypTrack / GUI_DEFAULTS.common.multiplier2,
      stroke: GUI_DEFAULTS.controls.slider.trackStroke,
      strokeWidth: GUI_DEFAULTS.controls.slider.trackStrokeWidth
    })
  );
  
  // Thumb - draggable
  children.push(
    circle({
      x: xlpThumb,
      y: 0,
      radius: rlThumb,
      fill: style.sliderThumbColor || GUI_DEFAULTS.controls.slider.thumbFill,
      stroke: GUI_DEFAULTS.controls.slider.thumbStroke,
      strokeWidth: GUI_DEFAULTS.controls.slider.thumbStrokeWidth,
      onPointerDown: props.onChange ? (e: PointerEvent) => {
        dragState.dragging = true;
        dragState.xwStart = e.clientX;
        dragState.startValue = value;
      } : undefined,
      onDrag: props.onChange ? (e: PointerEvent) => {
        if (!dragState.dragging) return;
        
        const canvas = e.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        
        // Calculate delta from drag start
        const dxc = (e.clientX - dragState.xwStart) * scaleX;
        const deltaValue = (dxc / dxp) * (max - min);
        const newValue = Math.max(min, Math.min(max, dragState.startValue + deltaValue));
        
        props.onChange?.(newValue);
      } : undefined,
      onPointerUp: () => {
        dragState.dragging = false;
      }
    })
  );
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id,
      onHover: props.onHover
    },
    children
  );
}

// Transform dropdown to core blocks
function transformDropdown(
  control: GUIControl,
  context: TransformContext,
  state: { hovered?: boolean; open?: boolean } = {}
): Block {
  const props = control.props as DropdownProps;
  const style = getControlStyle(control, context);
  
  const dxp = props.width || GUI_DEFAULTS.controls.dropdown.width;
  const dyp = props.height || GUI_DEFAULTS.controls.dropdown.height;
  
  const bgColor = state.hovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: bgColor,
      stroke: style.borderColor,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius
    })
  );
  
  // Display text
  const selectedOption = props.options.find(opt => opt.value === props.value);
  const displayText = selectedOption?.label || props.placeholder || GUI_DEFAULTS.controls.dropdown.placeholder;
  
  children.push(
    text({
      text: displayText,
      x: style.padding || GUI_DEFAULTS.controls.dropdown.textPadding,
      y: dyp / 2,
      fill: selectedOption ? style.textColor : (style.disabledTextColor || style.textColor),
      fontSize: style.fontSize,
      font: style.fontFamily,
        baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  // Arrow indicator
  children.push(
    text({
      text: GUI_DEFAULTS.controls.dropdown.arrowText,
      x: dxp - (style.padding || GUI_DEFAULTS.controls.dropdown.textPadding) - GUI_DEFAULTS.controls.dropdown.arrowOffsetX,
      y: dyp / 2,
      fill: style.textColor,
      fontSize: GUI_DEFAULTS.controls.dropdown.arrowFontSize,
      baseline: GUI_DEFAULTS.text.baselineMiddle
    })
  );
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id,
      onClick: props.onClick,
      onHover: props.onHover
    },
    children
  );
}

// Transform label to core blocks
function transformLabel(
  control: GUIControl,
  context: TransformContext
): Block {
  const props = control.props as LabelProps;
  const style = getControlStyle(control, context);
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    [
      text({
        text: props.text,
        fill: style.textColor,
        fontSize: props.fontSize || style.fontSize,
        font: style.fontFamily,
        align: props.align
      })
    ]
  );
}

// Transform GUI image to core blocks
function transformGUIImage(
  control: GUIControl,
  context: TransformContext
): Block {
  const props = control.props as GUIImageProps;
  
  const dxp = props.width || GUI_DEFAULTS.controls.image.width;
  const dyp = props.height || GUI_DEFAULTS.controls.image.height;
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    [
      image({
        src: props.src,
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
  const props = control.props as PanelProps;
  const style = getControlStyle(control, context);
  
  const dxp = props.width || GUI_DEFAULTS.controls.panel.width;
  const dyp = props.height || GUI_DEFAULTS.controls.panel.height;
  const padding = props.padding || style.padding || GUI_DEFAULTS.controls.panel.padding;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: style.backgroundColor,
      stroke: style.borderColor,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius
    })
  );
  
  // Title if provided
  if (props.title) {
    children.push(
      text({
        text: props.title,
        x: padding,
        y: padding,
        fill: style.textColor,
        fontSize: style.fontSize,
        font: style.fontFamily
      })
    );
  }
  
  // Transform children
  if (control.children) {
    const ypContent = props.title ? padding + (style.fontSize || GUI_DEFAULTS.controls.panel.titleFontSize) + GUI_DEFAULTS.controls.panel.titleGap : padding;
    const transformedChildren = transformGUIChildren(control.children, context, padding, ypContent);
    children.push(...transformedChildren);
  }
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    children
  );
}

// Transform stack layouts
function transformStack(
  control: GUIControl,
  context: TransformContext
): Block {
  const props = control.props as StackProps;
  const direction = props.direction || GUI_DEFAULTS.controls.stack.direction;
  const spacing = props.spacing || GUI_DEFAULTS.common.spacing;
  const padding = props.padding || GUI_DEFAULTS.common.padding;
  
  if (!control.children) {
    return group({ x: props.x || GUI_DEFAULTS.common.x, y: props.y || GUI_DEFAULTS.common.y }, []);
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
  const totalCrossAxis = maxCrossAxis + GUI_DEFAULTS.common.multiplier2 * padding;
  
  // Calculate the container's computed size (for documentation/debugging purposes)
  // Note: Group blocks don't have explicit size; they're sized by their children
  const computedWidth = direction === GUI_DEFAULTS.layout.directionHorizontal ? totalMainAxis : totalCrossAxis;
  const computedHeight = direction === GUI_DEFAULTS.layout.directionHorizontal ? totalCrossAxis : totalMainAxis;
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    children
  );
}

// Transform HStack
function transformHStack(
  control: GUIControl,
  context: TransformContext
): Block {
  const props = control.props as HStackProps;
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
  const props = control.props as VStackProps;
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
  const props = control.props as CarouselProps;
  const currentIndex = props.currentIndex || GUI_DEFAULTS.controls.carousel.currentIndex;
  
  if (!control.children || control.children.length === 0) {
    return group({ x: props.x || GUI_DEFAULTS.common.x, y: props.y || GUI_DEFAULTS.common.y }, []);
  }
  
  // Only show the current item
  const currentChild = control.children[currentIndex];
  const transformed = currentChild ? transformGUIControl(currentChild, context) : null;
  
  const children: Block[] = transformed ? [transformed] : [];
  
  // Add navigation dots
  const ypDot = (props.height || GUI_DEFAULTS.controls.carousel.height) + GUI_DEFAULTS.controls.carousel.dotYOffset;
  const dxpDotSpacing = GUI_DEFAULTS.controls.carousel.dotSpacing;
  const dxpTotal = control.children.length * dxpDotSpacing;
  const xpStart = ((props.width || GUI_DEFAULTS.controls.carousel.width) - dxpTotal) / 2;
  
  for (let i = 0; i < control.children.length; i++) {
    children.push(
      circle({
        x: xpStart + i * dxpDotSpacing,
        y: ypDot,
        radius: GUI_DEFAULTS.controls.carousel.dotRadius,
        fill: i === currentIndex ? GUI_DEFAULTS.controls.carousel.activeDotFill : GUI_DEFAULTS.controls.carousel.inactiveDotFill
      })
    );
  }
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
    },
    children
  );
}

// Transform grid
function transformGrid(
  control: GUIControl,
  context: TransformContext
): Block {
  const props = control.props as GridProps;
  const columns = props.columns || GUI_DEFAULTS.controls.grid.columns;
  const spacing = props.spacing || GUI_DEFAULTS.common.spacing;
  const padding = props.padding || GUI_DEFAULTS.common.padding;
  
  if (!control.children) {
    return group({ x: props.x || GUI_DEFAULTS.common.x, y: props.y || GUI_DEFAULTS.common.y }, []);
  }
  
  const children: Block[] = [];
  let maxRowHeight: number[] = []; // Track height of each row
  let maxColWidth: number[] = []; // Track width of each column
  
  // First pass: determine the maximum dimensions for each row and column
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const childDims = getControlDimensions(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || GUI_DEFAULTS.common.axisStart, childDims.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || GUI_DEFAULTS.common.axisStart, childDims.height);
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
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + (columns - GUI_DEFAULTS.common.one) * spacing + GUI_DEFAULTS.common.multiplier2 * padding;
  const numRows = Math.ceil(control.children.length / columns);
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + (numRows - GUI_DEFAULTS.common.one) * spacing + GUI_DEFAULTS.common.multiplier2 * padding;
  
  return group(
    {
      x: props.x || GUI_DEFAULTS.common.x,
      y: props.y || GUI_DEFAULTS.common.y,
      visible: props.visible !== false,
      id: props.id
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
    return repositionBlock(
      transformed,
      (transformed.props.x || GUI_DEFAULTS.common.x) + dxpOffset,
      (transformed.props.y || GUI_DEFAULTS.common.y) + dypOffset
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
