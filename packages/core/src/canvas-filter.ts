// Copyright (c) 2026 François Rouaix

// Polyfill for CanvasRenderingContext2D.filter on browsers that do not support it natively.
// As of 2026, Safari (macOS/iOS/iPadOS) does not support ctx.filter in stable releases.
// This module provides pixel-manipulation-based fallbacks for all standard CSS filter functions.

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

let _isCanvasFilterSupported: boolean | null = null;

/** Returns true if the browser natively supports CanvasRenderingContext2D.filter. */
export function isCanvasFilterSupported(): boolean {
  if (typeof document === 'undefined') return true; // SSR / Node
  if (_isCanvasFilterSupported !== null) return _isCanvasFilterSupported;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    _isCanvasFilterSupported = ctx !== null && 'filter' in ctx;
  } catch {
    _isCanvasFilterSupported = false;
  }
  return _isCanvasFilterSupported;
}

// ---------------------------------------------------------------------------
// CSS filter string parsing
// ---------------------------------------------------------------------------

interface FilterFn {
  name: string;
  args: string[];
}

function parseFilterFunctions(filterStr: string): FilterFn[] {
  const results: FilterFn[] = [];
  const re = /([\w-]+)\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(filterStr)) !== null) {
    const name = match[1];
    const args = match[2].trim().split(/\s+/).filter(Boolean);
    results.push({ name, args });
  }
  return results;
}

function normalizeNumberPercentage(value: string): number {
  let n = parseFloat(value);
  if (value.trimEnd().endsWith('%')) n /= 100;
  return n;
}

function normalizeAngleToDeg(value: string): number {
  const n = parseFloat(value);
  if (value.endsWith('rad')) return n * 180 / Math.PI;
  if (value.endsWith('grad')) return n * 0.9;
  if (value.endsWith('turn')) return n * 360;
  return n; // already degrees
}

// ---------------------------------------------------------------------------
// HSL utilities (used by hue-rotate and saturate)
// ---------------------------------------------------------------------------

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255; const gn = g / 255; const bn = b / 255;
  const max = Math.max(rn, gn, bn); const min = Math.min(rn, gn, bn);
  let h = 0; let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  ];
}

// ---------------------------------------------------------------------------
// Individual pixel-manipulation filter implementations
// ---------------------------------------------------------------------------

function filterBrightness(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * amount);
    data[i + 1] = Math.min(255, data[i + 1] * amount);
    data[i + 2] = Math.min(255, data[i + 2] * amount);
  }
}

function filterContrast(data: Uint8ClampedArray, amount: number): void {
  // CSS contrast(n): each channel x → clamp(amount * (x/255 - 0.5) + 0.5) * 255
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, amount * (data[i] - 127.5) + 127.5));
    data[i + 1] = Math.min(255, Math.max(0, amount * (data[i + 1] - 127.5) + 127.5));
    data[i + 2] = Math.min(255, Math.max(0, amount * (data[i + 2] - 127.5) + 127.5));
  }
}

function filterGrayscale(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i] = Math.round(data[i] + (gray - data[i]) * amount);
    data[i + 1] = Math.round(data[i + 1] + (gray - data[i + 1]) * amount);
    data[i + 2] = Math.round(data[i + 2] + (gray - data[i + 2]) * amount);
  }
}

function filterSepia(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
    const sr = Math.min(255, r * (1 - 0.607 * amount) + g * 0.769 * amount + b * 0.189 * amount);
    const sg = Math.min(255, r * 0.349 * amount + g * (1 - 0.314 * amount) + b * 0.168 * amount);
    const sb = Math.min(255, r * 0.272 * amount + g * 0.534 * amount + b * (1 - 0.869 * amount));
    data[i] = sr; data[i + 1] = sg; data[i + 2] = sb;
  }
}

function filterInvert(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * (1 - amount) + (255 - data[i]) * amount);
    data[i + 1] = Math.round(data[i + 1] * (1 - amount) + (255 - data[i + 1]) * amount);
    data[i + 2] = Math.round(data[i + 2] * (1 - amount) + (255 - data[i + 2]) * amount);
  }
}

function filterOpacity(data: Uint8ClampedArray, amount: number): void {
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * amount);
  }
}

function filterSaturate(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const [r, g, b] = hslToRgb(h, Math.min(1, s * amount), l);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

function filterHueRotate(data: Uint8ClampedArray, angleDeg: number): void {
  const deltaH = ((angleDeg / 360) % 1 + 1) % 1;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const [r, g, b] = hslToRgb((h + deltaH) % 1, s, l);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

// Fast box-blur kernel (3 passes to approximate Gaussian).
// Algorithm based on the QuasiMondo box-blur for canvas.
function filterBlur(ctx: CanvasRenderingContext2D, radius: number): void {
  if (radius <= 0) return;
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const wm = width - 1;
  const hm = height - 1;
  const rad1 = radius + 1;

  // Precomputed multiplication tables for fast integer blur
  const mulTable = [
    1, 57, 41, 21, 203, 34, 97, 73, 227, 91, 149, 62, 105, 45, 39, 137, 241,
    107, 3, 173, 39, 71, 65, 238, 219, 101, 187, 87, 81, 151, 141, 133, 249,
    117, 221, 209, 197, 187, 177, 169, 5, 153, 73, 139, 133, 127, 243, 233, 223,
    107, 103, 99, 191, 23, 177, 171, 165, 159, 77, 149, 9, 139, 135, 131, 253,
    245, 119, 231, 224, 109, 211, 103, 25, 195, 189, 23, 45, 175, 171, 83, 81,
    79, 155, 151, 147, 9, 141, 137, 67, 131, 129, 251, 123, 30, 235, 115, 113,
    221, 217, 53, 13, 51, 50, 49, 193, 189, 185, 91, 179, 175, 43, 169, 83, 163,
    5, 79, 155, 19, 75, 147, 145, 143, 35, 69, 17, 67, 33, 65, 255, 251, 247,
    243, 239, 59, 29, 229, 113, 111, 219, 27, 213, 105, 207, 51, 201, 199, 49,
    193, 191, 47, 93, 183, 181, 179, 11, 87, 43, 85, 167, 165, 163, 161, 159,
    157, 155, 77, 19, 75, 37, 73, 145, 143, 141, 35, 138, 137, 135, 67, 33, 131,
    129, 255, 63, 250, 247, 61, 121, 239, 237, 117, 29, 229, 227, 225, 111, 55,
    109, 216, 213, 211, 209, 207, 205, 203, 201, 199, 197, 195, 193, 48, 190,
    47, 93, 185, 183, 181, 179, 178, 176, 175, 173, 171, 85, 21, 167, 165, 41,
    163, 161, 5, 79, 157, 78, 154, 153, 19, 75, 149, 74, 147, 73, 144, 143, 71,
    141, 140, 139, 137, 17, 135, 134, 133, 66, 131, 65, 129, 1
  ];
  const shgTable = [
    0, 9, 10, 10, 14, 12, 14, 14, 16, 15, 16, 15, 16, 15, 15, 17, 18, 17, 12,
    18, 16, 17, 17, 19, 19, 18, 19, 18, 18, 19, 19, 19, 20, 19, 20, 20, 20, 20,
    20, 20, 15, 20, 19, 20, 20, 20, 21, 21, 21, 20, 20, 20, 21, 18, 21, 21, 21,
    21, 20, 21, 17, 21, 21, 21, 22, 22, 21, 22, 22, 21, 22, 21, 19, 22, 22, 19,
    20, 22, 22, 21, 21, 21, 22, 22, 22, 18, 22, 22, 21, 22, 22, 23, 22, 20, 23,
    22, 22, 23, 23, 21, 19, 21, 21, 21, 23, 23, 23, 22, 23, 23, 21, 23, 22, 23,
    18, 22, 23, 20, 22, 23, 23, 23, 21, 22, 20, 22, 21, 22, 24, 24, 24, 24, 24,
    22, 21, 24, 23, 23, 24, 21, 24, 23, 24, 22, 24, 24, 22, 24, 24, 22, 23, 24,
    24, 24, 20, 23, 22, 23, 24, 24, 24, 24, 24, 24, 24, 23, 21, 23, 22, 23, 24,
    24, 24, 22, 24, 24, 24, 23, 22, 24, 24, 25, 23, 25, 25, 23, 24, 25, 25, 24,
    22, 25, 25, 25, 24, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25,
    23, 25, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 22, 25, 25, 23, 25,
    25, 20, 24, 25, 24, 25, 25, 22, 24, 25, 24, 25, 24, 25, 25, 24, 25, 25, 25,
    25, 22, 25, 25, 25, 24, 25, 24, 25, 18
  ];

  if (radius >= mulTable.length) return; // radius too large for tables

  const mulSum = mulTable[radius];
  const shgSum = shgTable[radius];

  const r: number[] = []; const g: number[] = [];
  const b: number[] = []; const a: number[] = [];
  const vmin: number[] = []; const vmax: number[] = [];

  let passes = 3;
  let p: number; let p1: number; let p2: number; let pa: number;

  while (passes-- > 0) {
    let yw = 0; let yi = 0;

    for (let y = 0; y < height; y++) {
      let rsum = data[yw] * rad1; let gsum = data[yw + 1] * rad1;
      let bsum = data[yw + 2] * rad1; let asum = data[yw + 3] * rad1;

      for (let i = 1; i <= radius; i++) {
        p = yw + ((i > wm ? wm : i) << 2);
        rsum += data[p++]; gsum += data[p++]; bsum += data[p++]; asum += data[p];
      }

      for (let x = 0; x < width; x++) {
        r[yi] = rsum; g[yi] = gsum; b[yi] = bsum; a[yi] = asum;

        if (y === 0) {
          vmin[x] = ((p = x + rad1) < wm ? p : wm) << 2;
          vmax[x] = (p = x - radius) > 0 ? p << 2 : 0;
        }

        p1 = yw + vmin[x]; p2 = yw + vmax[x];
        rsum += data[p1++] - data[p2++];
        gsum += data[p1++] - data[p2++];
        bsum += data[p1++] - data[p2++];
        asum += data[p1] - data[p2];
        yi++;
      }
      yw += width << 2;
    }

    for (let x = 0; x < width; x++) {
      let yp = x;
      let rsum = r[yp] * rad1; let gsum = g[yp] * rad1;
      let bsum = b[yp] * rad1; let asum = a[yp] * rad1;

      for (let i = 1; i <= radius; i++) {
        yp += i > hm ? 0 : width;
        rsum += r[yp]; gsum += g[yp]; bsum += b[yp]; asum += a[yp];
      }

      yi = x << 2;

      for (let y = 0; y < height; y++) {
        data[yi + 3] = pa = (asum * mulSum) >>> shgSum;
        if (pa > 0) {
          pa = 255 / pa;
          data[yi] = ((rsum * mulSum) >>> shgSum) * pa;
          data[yi + 1] = ((gsum * mulSum) >>> shgSum) * pa;
          data[yi + 2] = ((bsum * mulSum) >>> shgSum) * pa;
        } else {
          data[yi] = data[yi + 1] = data[yi + 2] = 0;
        }

        if (x === 0) {
          vmin[y] = ((p = y + rad1) < hm ? p : hm) * width;
          vmax[y] = (p = y - radius) > 0 ? p * width : 0;
        }

        p1 = x + vmin[y]; p2 = x + vmax[y];
        rsum += r[p1] - r[p2]; gsum += g[p1] - g[p2];
        bsum += b[p1] - b[p2]; asum += a[p1] - a[p2];
        yi += width << 2;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ---------------------------------------------------------------------------
// drop-shadow helper
// ---------------------------------------------------------------------------

/** Parse a CSS color string into { r, g, b, a } (a in 0-1). */
function parseCssColor(color: string): { r: number; g: number; b: number; a: number } {
  const defaultResult = { r: 0, g: 0, b: 0, a: 1 };
  if (!color) return defaultResult;

  // Use the browser to parse the color by drawing a pixel
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 1; tmpCanvas.height = 1;
  const tmpCtx = tmpCanvas.getContext('2d');
  if (!tmpCtx) return defaultResult;
  tmpCtx.fillStyle = color;
  tmpCtx.fillRect(0, 0, 1, 1);
  const pixel = tmpCtx.getImageData(0, 0, 1, 1).data;
  return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] / 255 };
}

function filterDropShadow(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  blurRadius: number,
  color: string
): void {
  const { width, height } = ctx.canvas;
  const origData = ctx.getImageData(0, 0, width, height);

  // Build shadow silhouette: same alpha as original, but shadow colour
  const shadowColor = parseCssColor(color);
  const shadowData = new ImageData(new Uint8ClampedArray(origData.data), width, height);
  const sd = shadowData.data;
  for (let i = 0; i < sd.length; i += 4) {
    if (sd[i + 3] > 0) {
      sd[i] = shadowColor.r;
      sd[i + 1] = shadowColor.g;
      sd[i + 2] = shadowColor.b;
      sd[i + 3] = Math.round(sd[i + 3] * shadowColor.a);
    }
  }

  // Blur the shadow silhouette
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = width; shadowCanvas.height = height;
  const shadowCtx = shadowCanvas.getContext('2d')!;
  shadowCtx.putImageData(shadowData, 0, 0);
  if (blurRadius > 0) filterBlur(shadowCtx, blurRadius);

  // Composite: shadow at offset, then original on top
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = width; resultCanvas.height = height;
  const rCtx = resultCanvas.getContext('2d')!;
  rCtx.drawImage(shadowCanvas, offsetX, offsetY);

  const origCanvas = document.createElement('canvas');
  origCanvas.width = width; origCanvas.height = height;
  origCanvas.getContext('2d')!.putImageData(origData, 0, 0);
  rCtx.drawImage(origCanvas, 0, 0);

  // Write result back
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(resultCanvas, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Public API: apply a CSS filter string to a canvas context's pixels
// ---------------------------------------------------------------------------

/**
 * Apply a CSS filter string (e.g. 'blur(4px) brightness(1.2)') to the current
 * pixel contents of the given CanvasRenderingContext2D.
 *
 * This is called after rendering a block to an offscreen canvas so that the
 * filtered result can then be composited back onto the main canvas.
 */
export function applyPixelFilter(ctx: CanvasRenderingContext2D, filterStr: string): void {
  if (!filterStr || filterStr === 'none') return;

  const fns = parseFilterFunctions(filterStr);
  if (fns.length === 0) return;

  const { width, height } = ctx.canvas;

  for (const { name, args } of fns) {
    switch (name) {
      case 'blur': {
        const radius = Math.round(Math.abs(parseFloat(args[0] ?? '0')));
        filterBlur(ctx, radius);
        break;
      }
      case 'brightness': {
        const amount = normalizeNumberPercentage(args[0] ?? '1');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterBrightness(imageData.data, amount);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'contrast': {
        const amount = normalizeNumberPercentage(args[0] ?? '1');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterContrast(imageData.data, amount);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'grayscale': {
        const amount = normalizeNumberPercentage(args[0] ?? '1');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterGrayscale(imageData.data, amount);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'sepia': {
        const amount = normalizeNumberPercentage(args[0] ?? '1');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterSepia(imageData.data, amount);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'invert': {
        const amount = normalizeNumberPercentage(args[0] ?? '1');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterInvert(imageData.data, amount);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'opacity': {
        const amount = normalizeNumberPercentage(args[0] ?? '1');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterOpacity(imageData.data, amount);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'saturate': {
        const amount = normalizeNumberPercentage(args[0] ?? '1');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterSaturate(imageData.data, amount);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'hue-rotate': {
        const angleDeg = normalizeAngleToDeg(args[0] ?? '0');
        const imageData = ctx.getImageData(0, 0, width, height);
        filterHueRotate(imageData.data, angleDeg);
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      case 'drop-shadow': {
        // drop-shadow(offsetX offsetY blurRadius color)
        // Args may be split on whitespace; colour may contain spaces (e.g. rgba(...))
        // We reconstruct the full argument string and re-parse carefully.
        const full = args.join(' ');
        // Match leading numeric tokens for offset/blur, then the rest is colour.
        const numRe = /^(-?[\d.]+(?:px|em|rem|%)?\s*)/;
        let rest = full.trim();
        const nums: number[] = [];
        for (let k = 0; k < 3; k++) {
          const m = numRe.exec(rest);
          if (!m) break;
          nums.push(parseFloat(m[1]));
          rest = rest.slice(m[0].length);
        }
        const oX = nums[0] ?? 0;
        const oY = nums[1] ?? 0;
        const blur = nums[2] ?? 0;
        const shadowColor = rest.trim() || 'rgba(0,0,0,0.5)';
        filterDropShadow(ctx, oX, oY, Math.round(blur), shadowColor);
        break;
      }
      default:
        // Unknown or unsupported filter — skip silently
        break;
    }
  }
}
