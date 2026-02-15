// Transform GUI DSL to Core DSL

import type { Block } from '../core/types.js';
import { rectangle, circle, text, group, image } from '../core/blocks.js';
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
} from './types.js';
import { GUIControlType } from './types.js';

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
      return { width: props.width || 300, height: props.height || 50 };
    case GUIControlType.Button:
      return { width: props.width || 160, height: props.height || 50 };
    case GUIControlType.CheckBox:
      return { width: props.width || 200, height: props.height || 28 };
    case GUIControlType.RadioButton:
      return { width: props.width || 200, height: props.height || 28 };
    case GUIControlType.Slider:
      return { width: props.width || 300, height: props.height || 24 };
    case GUIControlType.Label:
      return { width: props.width || 200, height: props.height || 20 };
    case GUIControlType.Panel:
      return { width: props.width || 400, height: props.height || 300 };
    default:
      return { width: props.width || 100, height: props.height || 40 };
  }
}

// Compute dimensions for stack-based layouts
function computeStackDimensions(control: GUIControl): { width: number; height: number } {
  const props = control.props as StackProps;
  const direction = (control.type === GUIControlType.HStack) ? 'horizontal' :
                    (control.type === GUIControlType.VStack) ? 'vertical' :
                    (props.direction || 'vertical');
  const spacing = props.spacing || 10;
  const padding = props.padding || 0;
  
  if (!control.children || control.children.length === 0) {
    return { width: 2 * padding, height: 2 * padding };
  }
  
  let totalMainAxis = padding;
  let maxCrossAxis = 0;
  
  control.children.forEach((child, index) => {
    const childDims = getControlDimensions(child);
    
    if (direction === 'horizontal') {
      totalMainAxis += childDims.width;
      maxCrossAxis = Math.max(maxCrossAxis, childDims.height);
    } else {
      totalMainAxis += childDims.height;
      maxCrossAxis = Math.max(maxCrossAxis, childDims.width);
    }
    
    // Add spacing between children (but not after the last one)
    if (index < control.children!.length - 1) {
      totalMainAxis += spacing;
    }
  });
  
  totalMainAxis += padding;
  const totalCrossAxis = maxCrossAxis + 2 * padding;
  
  return direction === 'horizontal' 
    ? { width: totalMainAxis, height: totalCrossAxis }
    : { width: totalCrossAxis, height: totalMainAxis };
}

// Compute dimensions for grid layout
function computeGridDimensions(control: GUIControl): { width: number; height: number } {
  const props = control.props as GridProps;
  const columns = props.columns || 3;
  const spacing = props.spacing || 10;
  const padding = props.padding || 0;
  
  if (!control.children || control.children.length === 0) {
    return { width: 2 * padding, height: 2 * padding };
  }
  
  const maxColWidth: number[] = [];
  const maxRowHeight: number[] = [];
  
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const childDims = getControlDimensions(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || 0, childDims.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || 0, childDims.height);
  });
  
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + 
                     Math.max(0, maxColWidth.length - 1) * spacing + 
                     2 * padding;
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + 
                      Math.max(0, maxRowHeight.length - 1) * spacing + 
                      2 * padding;
  
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
  
  const width = props.width || 300;
  const height = props.height || 50;
  
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
      width,
      height,
      fill: bgColor,
      stroke: borderColor,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius,
      onClick: props.onClick,
      onHover: props.onHover
    })
  );
  
  // Text content
  const displayText = props.value || props.placeholder || '';
  if (displayText) {
    children.push(
      text({
        text: displayText,
        x: style.padding || 12,
        y: height / 2,
        fill: props.value ? style.textColor : (style.disabledTextColor || style.textColor),
        fontSize: style.fontSize,
        font: style.fontFamily,
        baseline: 'middle'
      })
    );
  }
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
  
  const boxSize = 28;
  const labelSpacing = 12;
  
  const children: Block[] = [];
  
  // Checkbox box
  const bgColor = props.checked
    ? style.checkedBackgroundColor
    : state.hovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  children.push(
    rectangle({
      width: boxSize,
      height: boxSize,
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
        text: '✓',
        x: boxSize / 2,
        y: boxSize / 2,
        fill: '#ffffff',
        fontSize: 18,
        align: 'center',
        baseline: 'middle'
      })
    );
  }
  
  // Label
  if (props.label) {
    children.push(
      text({
        text: props.label,
        x: boxSize + labelSpacing,
        y: boxSize / 2,
        fill: style.textColor,
        fontSize: style.fontSize,
        font: style.fontFamily,
        baseline: 'middle'
      })
    );
  }
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
  
  const radius = 14;
  const labelSpacing = 12;
  
  const children: Block[] = [];
  
  // Radio circle
  const bgColor = state.hovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  children.push(
    circle({
      radius,
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
        radius: 8,
        fill: style.checkedBackgroundColor
      })
    );
  }
  
  // Label
  if (props.label) {
    children.push(
      text({
        text: props.label,
        x: radius + labelSpacing,
        y: 0,
        fill: style.textColor,
        fontSize: style.fontSize,
        font: style.fontFamily,
        baseline: 'middle'
      })
    );
  }
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
  
  const style = getControlStyle({ ...control, props: { ...props, className } }, context);
  
  const width = props.width || 160;
  const height = props.height || 50;
  
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
      width,
      height,
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
      x: width / 2,
      y: height / 2,
      fill: textColor,
      fontSize: style.fontSize,
      font: style.fontFamily,
      align: 'center',
      baseline: 'middle'
    })
  );
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
  
  const width = props.width || 300;
  const trackHeight = 6;
  const thumbRadius = 12;
  
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const value = props.value ?? min;
  const normalizedValue = (value - min) / (max - min);
  const thumbX = normalizedValue * width;
  
  // Persistent drag state (stored on props to survive re-renders)
  if (!(props as any)._dragState) {
    (props as any)._dragState = { dragging: false, startX: 0, startValue: 0 };
  }
  const dragState = (props as any)._dragState;
  
  const children: Block[] = [];
  
  // Visual track
  children.push(
    rectangle({
      x: 0,
      y: -trackHeight / 2,
      width,
      height: trackHeight,
      fill: style.sliderTrackColor || '#4b5563',
      cornerRadius: trackHeight / 2,
      stroke: '#888888',
      strokeWidth: 1
    })
  );
  
  // Thumb - draggable
  children.push(
    circle({
      x: thumbX,
      y: 0,
      radius: thumbRadius,
      fill: style.sliderThumbColor || '#3b82f6',
      stroke: '#ffffff',
      strokeWidth: 3,
      onPointerDown: props.onChange ? (e: PointerEvent) => {
        dragState.dragging = true;
        dragState.startX = e.clientX;
        dragState.startValue = value;
      } : undefined,
      onDrag: props.onChange ? (e: PointerEvent) => {
        if (!dragState.dragging) return;
        
        const canvas = e.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        
        // Calculate delta from drag start
        const deltaX = (e.clientX - dragState.startX) * scaleX;
        const deltaValue = (deltaX / width) * (max - min);
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
      x: props.x || 0,
      y: props.y || 0,
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
  
  const width = props.width || 300;
  const height = props.height || 50;
  
  const bgColor = state.hovered
    ? style.hoverBackgroundColor || style.backgroundColor
    : style.backgroundColor;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      width,
      height,
      fill: bgColor,
      stroke: style.borderColor,
      strokeWidth: style.borderWidth,
      cornerRadius: style.borderRadius
    })
  );
  
  // Display text
  const selectedOption = props.options.find(opt => opt.value === props.value);
  const displayText = selectedOption?.label || props.placeholder || 'Select...';
  
  children.push(
    text({
      text: displayText,
      x: style.padding || 12,
      y: height / 2,
      fill: selectedOption ? style.textColor : (style.disabledTextColor || style.textColor),
      fontSize: style.fontSize,
      font: style.fontFamily,
      baseline: 'middle'
    })
  );
  
  // Arrow indicator
  children.push(
    text({
      text: '▼',
      x: width - (style.padding || 12) - 8,
      y: height / 2,
      fill: style.textColor,
      fontSize: 14,
      baseline: 'middle'
    })
  );
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
      x: props.x || 0,
      y: props.y || 0,
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
  
  const width = props.width || 100;
  const height = props.height || 100;
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
      visible: props.visible !== false,
      id: props.id
    },
    [
      image({
        src: props.src,
        width,
        height
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
  
  const width = props.width || 300;
  const height = props.height || 200;
  const padding = props.padding || style.padding || 16;
  
  const children: Block[] = [];
  
  // Background
  children.push(
    rectangle({
      width,
      height,
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
    const contentY = props.title ? padding + (style.fontSize || 16) + 10 : padding;
    const transformedChildren = transformGUIChildren(control.children, context, padding, contentY);
    children.push(...transformedChildren);
  }
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
  const direction = props.direction || 'vertical';
  const spacing = props.spacing || 10;
  const padding = props.padding || 0;
  
  if (!control.children) {
    return group({ x: props.x || 0, y: props.y || 0 }, []);
  }
  
  const children: Block[] = [];
  let offset = padding;
  let maxCrossAxis = 0; // Track maximum width (for vstack) or height (for hstack)
  
  for (const child of control.children) {
    const transformed = transformGUIControl(child, context);
    const childDims = getControlDimensions(child);
    
    // Create a new block with updated coordinates instead of mutating
    const positionedBlock: Block = {
      ...transformed,
      props: {
        ...transformed.props,
        x: direction === 'horizontal' ? offset : padding,
        y: direction === 'horizontal' ? padding : offset
      }
    };
    
    offset += (direction === 'horizontal' ? childDims.width : childDims.height) + spacing;
    
    // Track the maximum size in the cross-axis direction
    if (direction === 'horizontal') {
      maxCrossAxis = Math.max(maxCrossAxis, childDims.height);
    } else {
      maxCrossAxis = Math.max(maxCrossAxis, childDims.width);
    }
    
    children.push(positionedBlock);
  }
  
  // Remove the trailing spacing from the last child
  const totalMainAxis = offset - spacing + padding;
  const totalCrossAxis = maxCrossAxis + 2 * padding;
  
  // Calculate the container's computed size (for documentation/debugging purposes)
  // Note: Group blocks don't have explicit size; they're sized by their children
  const computedWidth = direction === 'horizontal' ? totalMainAxis : totalCrossAxis;
  const computedHeight = direction === 'horizontal' ? totalCrossAxis : totalMainAxis;
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
      props: { ...props, direction: 'horizontal' } as StackProps
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
      props: { ...props, direction: 'vertical' } as StackProps
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
  const currentIndex = props.currentIndex || 0;
  
  if (!control.children || control.children.length === 0) {
    return group({ x: props.x || 0, y: props.y || 0 }, []);
  }
  
  // Only show the current item
  const currentChild = control.children[currentIndex];
  const transformed = currentChild ? transformGUIControl(currentChild, context) : null;
  
  const children: Block[] = transformed ? [transformed] : [];
  
  // Add navigation dots
  const dotY = (props.height || 200) + 20;
  const dotSpacing = 15;
  const totalWidth = control.children.length * dotSpacing;
  const startX = ((props.width || 300) - totalWidth) / 2;
  
  for (let i = 0; i < control.children.length; i++) {
    children.push(
      circle({
        x: startX + i * dotSpacing,
        y: dotY,
        radius: 4,
        fill: i === currentIndex ? '#3b82f6' : '#d1d5db'
      })
    );
  }
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
  const columns = props.columns || 3;
  const spacing = props.spacing || 10;
  const padding = props.padding || 0;
  
  if (!control.children) {
    return group({ x: props.x || 0, y: props.y || 0 }, []);
  }
  
  const children: Block[] = [];
  let maxRowHeight: number[] = []; // Track height of each row
  let maxColWidth: number[] = []; // Track width of each column
  
  // First pass: determine the maximum dimensions for each row and column
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const childDims = getControlDimensions(child);
    
    maxColWidth[col] = Math.max(maxColWidth[col] || 0, childDims.width);
    maxRowHeight[row] = Math.max(maxRowHeight[row] || 0, childDims.height);
  });
  
  // Second pass: position children
  control.children.forEach((child, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    // Calculate x position based on previous column widths
    let xPos = padding;
    for (let c = 0; c < col; c++) {
      xPos += maxColWidth[c] + spacing;
    }
    
    // Calculate y position based on previous row heights
    let yPos = padding;
    for (let r = 0; r < row; r++) {
      yPos += maxRowHeight[r] + spacing;
    }
    
    const transformed = transformGUIControl(child, context);
    
    // Create a new block with updated coordinates instead of mutating
    const positionedBlock: Block = {
      ...transformed,
      props: {
        ...transformed.props,
        x: xPos,
        y: yPos
      }
    };
    
    children.push(positionedBlock);
  });
  
  // Calculate total grid size (for documentation/debugging purposes)
  // Note: Group blocks don't have explicit size; they're sized by their children
  const totalWidth = maxColWidth.reduce((sum, w) => sum + w, 0) + (columns - 1) * spacing + 2 * padding;
  const numRows = Math.ceil(control.children.length / columns);
  const totalHeight = maxRowHeight.reduce((sum, h) => sum + h, 0) + (numRows - 1) * spacing + 2 * padding;
  
  return group(
    {
      x: props.x || 0,
      y: props.y || 0,
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
  offsetX: number = 0,
  offsetY: number = 0
): Block[] {
  return children.map(child => {
    const transformed = transformGUIControl(child, context);
    // Create a new block with updated coordinates instead of mutating
    return {
      ...transformed,
      props: {
        ...transformed.props,
        x: (transformed.props.x || 0) + offsetX,
        y: (transformed.props.y || 0) + offsetY
      }
    };
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
      // Fallback for unknown types
      return group({ x: control.props.x || 0, y: control.props.y || 0 }, []);
  }
}
