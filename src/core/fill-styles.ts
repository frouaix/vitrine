// Copyright (c) 2026 François Rouaix

// Factory functions for gradient and pattern descriptors
import type {
  ColorStop,
  LinearGradientDescriptor,
  RadialGradientDescriptor,
  ConicGradientDescriptor,
  PatternDescriptor,
  Color
} from './types.ts';

/** Create a linear gradient descriptor. */
export function linearGradient(
  x0: number, y0: number,
  x1: number, y1: number,
  stops: ColorStop[]
): LinearGradientDescriptor {
  return { type: 'linear-gradient', x0, y0, x1, y1, stops };
}

/** Create a radial gradient descriptor. */
export function radialGradient(
  x0: number, y0: number, r0: number,
  x1: number, y1: number, r1: number,
  stops: ColorStop[]
): RadialGradientDescriptor {
  return { type: 'radial-gradient', x0, y0, r0, x1, y1, r1, stops };
}

/** Create a conic gradient descriptor. */
export function conicGradient(
  startAngle: number,
  x: number, y: number,
  stops: ColorStop[]
): ConicGradientDescriptor {
  return { type: 'conic-gradient', startAngle, x, y, stops };
}

/** Create a pattern descriptor from an image or canvas element. */
export function pattern(
  image: HTMLImageElement | HTMLCanvasElement,
  repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' = 'repeat'
): PatternDescriptor {
  return { type: 'pattern', image, repetition };
}

/** Convenience: create a color stop. */
export function stop(offset: number, color: Color): ColorStop {
  return { offset, color };
}
