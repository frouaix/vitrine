// Copyright (c) 2026 François Rouaix

// GUI control factory functions

import type {
  GUIControl,
  GUIControlForType,
  GUIControlOfType,
  GUIPropsByType
} from './types.ts';
import { GUIControlType } from './types.ts';
export { colorpicker } from './color-picker.ts';

type RequiredChildrenControlType =
  | GUIControlType.HStack
  | GUIControlType.VStack
  | GUIControlType.Carousel
  | GUIControlType.Grid;
type OptionalChildrenControlType = Exclude<GUIControlType, RequiredChildrenControlType>;

export function control<T extends RequiredChildrenControlType>(
  type: T,
  props: GUIPropsByType[T],
  children: GUIControl[]
): GUIControlForType<T>;
export function control<T extends OptionalChildrenControlType>(
  type: T,
  props: GUIPropsByType[T],
  children?: GUIControl[]
): GUIControlForType<T>;
export function control<T extends GUIControlType>(
  type: T,
  props: GUIPropsByType[T],
  children?: GUIControl[]
): GUIControlForType<T> {
  return {
    type,
    props,
    children
  };
}

// Interactive controls
export function textbox(props: GUIPropsByType[GUIControlType.TextBox]): GUIControlOfType<GUIControlType.TextBox> {
  return control(GUIControlType.TextBox, props);
}

export function checkbox(props: GUIPropsByType[GUIControlType.CheckBox]): GUIControlOfType<GUIControlType.CheckBox> {
  return control(GUIControlType.CheckBox, props);
}

export function radiobutton(props: GUIPropsByType[GUIControlType.RadioButton]): GUIControlOfType<GUIControlType.RadioButton> {
  return control(GUIControlType.RadioButton, props);
}

export function button(props: GUIPropsByType[GUIControlType.Button]): GUIControlOfType<GUIControlType.Button> {
  return control(GUIControlType.Button, props);
}

export function slider(props: GUIPropsByType[GUIControlType.Slider]): GUIControlOfType<GUIControlType.Slider> {
  return control(GUIControlType.Slider, props);
}

export function dropdown(props: GUIPropsByType[GUIControlType.Dropdown]): GUIControlOfType<GUIControlType.Dropdown> {
  return control(GUIControlType.Dropdown, props);
}

// Layout controls
export function hstack(props: GUIPropsByType[GUIControlType.HStack], children: GUIControl[]): GUIControlOfType<GUIControlType.HStack> {
  return control(GUIControlType.HStack, props, children);
}

export function vstack(props: GUIPropsByType[GUIControlType.VStack], children: GUIControl[]): GUIControlOfType<GUIControlType.VStack> {
  return control(GUIControlType.VStack, props, children);
}

export function carousel(props: GUIPropsByType[GUIControlType.Carousel], children: GUIControl[]): GUIControlOfType<GUIControlType.Carousel> {
  return control(GUIControlType.Carousel, props, children);
}

export function grid(props: GUIPropsByType[GUIControlType.Grid], children: GUIControl[]): GUIControlOfType<GUIControlType.Grid> {
  return control(GUIControlType.Grid, props, children);
}

// Content controls
export function label(props: GUIPropsByType[GUIControlType.Label]): GUIControlOfType<GUIControlType.Label> {
  return control(GUIControlType.Label, props);
}

export function guiImage(props: GUIPropsByType[GUIControlType.Image]): GUIControlOfType<GUIControlType.Image> {
  return control(GUIControlType.Image, props);
}

export function panel(props: GUIPropsByType[GUIControlType.Panel], children?: GUIControl[]): GUIControlOfType<GUIControlType.Panel> {
  return control(GUIControlType.Panel, props, children);
}
