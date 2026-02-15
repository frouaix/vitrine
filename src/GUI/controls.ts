// GUI control factory functions

import type {
  GUIControl,
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

// Interactive controls
export function textbox(props: TextBoxProps): GUIControl {
  return {
    type: GUIControlType.TextBox,
    props
  };
}

export function checkbox(props: CheckBoxProps): GUIControl {
  return {
    type: GUIControlType.CheckBox,
    props
  };
}

export function radiobutton(props: RadioButtonProps): GUIControl {
  return {
    type: GUIControlType.RadioButton,
    props
  };
}

export function button(props: ButtonProps): GUIControl {
  return {
    type: GUIControlType.Button,
    props
  };
}

export function slider(props: SliderProps): GUIControl {
  return {
    type: GUIControlType.Slider,
    props
  };
}

export function dropdown(props: DropdownProps): GUIControl {
  return {
    type: GUIControlType.Dropdown,
    props
  };
}

// Layout controls
export function stack(props: StackProps, children: GUIControl[]): GUIControl {
  return {
    type: GUIControlType.Stack,
    props,
    children
  };
}

export function hstack(props: HStackProps, children: GUIControl[]): GUIControl {
  return {
    type: GUIControlType.HStack,
    props,
    children
  };
}

export function vstack(props: VStackProps, children: GUIControl[]): GUIControl {
  return {
    type: GUIControlType.VStack,
    props,
    children
  };
}

export function carousel(props: CarouselProps, children: GUIControl[]): GUIControl {
  return {
    type: GUIControlType.Carousel,
    props,
    children
  };
}

export function grid(props: GridProps, children: GUIControl[]): GUIControl {
  return {
    type: GUIControlType.Grid,
    props,
    children
  };
}

// Content controls
export function label(props: LabelProps): GUIControl {
  return {
    type: GUIControlType.Label,
    props
  };
}

export function guiImage(props: GUIImageProps): GUIControl {
  return {
    type: GUIControlType.Image,
    props
  };
}

export function panel(props: PanelProps, children?: GUIControl[]): GUIControl {
  return {
    type: GUIControlType.Panel,
    props,
    children
  };
}
