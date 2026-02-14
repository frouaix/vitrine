// 2D transformation matrix utilities
// Using 2x3 affine transformation matrix: [a, b, c, d, e, f]
// | a  c  e |
// | b  d  f |
// | 0  0  1 |

export class Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  static identity(): Matrix2D {
    return new Matrix2D();
  }

  static translation(x: number, y: number): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, x, y);
  }

  static rotation(angle: number): Matrix2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Matrix2D(cos, sin, -sin, cos, 0, 0);
  }

  static scale(sx: number, sy: number): Matrix2D {
    return new Matrix2D(sx, 0, 0, sy, 0, 0);
  }

  static skew(skewX: number, skewY: number): Matrix2D {
    return new Matrix2D(1, Math.tan(skewY), Math.tan(skewX), 1, 0, 0);
  }

  clone(): Matrix2D {
    return new Matrix2D(this.a, this.b, this.c, this.d, this.e, this.f);
  }

  multiply(m: Matrix2D): Matrix2D {
    const a = this.a * m.a + this.c * m.b;
    const b = this.b * m.a + this.d * m.b;
    const c = this.a * m.c + this.c * m.d;
    const d = this.b * m.c + this.d * m.d;
    const e = this.a * m.e + this.c * m.f + this.e;
    const f = this.b * m.e + this.d * m.f + this.f;
    return new Matrix2D(a, b, c, d, e, f);
  }

  translate(x: number, y: number): Matrix2D {
    return this.multiply(Matrix2D.translation(x, y));
  }

  rotate(angle: number): Matrix2D {
    return this.multiply(Matrix2D.rotation(angle));
  }

  scaleXY(sx: number, sy: number): Matrix2D {
    return this.multiply(Matrix2D.scale(sx, sy));
  }

  skewXY(skewX: number, skewY: number): Matrix2D {
    return this.multiply(Matrix2D.skew(skewX, skewY));
  }

  transformPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f
    };
  }

  invert(): Matrix2D | null {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-10) return null;

    const invDet = 1 / det;
    return new Matrix2D(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.f - this.d * this.e) * invDet,
      (this.b * this.e - this.a * this.f) * invDet
    );
  }

  toCanvasTransform(): [number, number, number, number, number, number] {
    return [this.a, this.b, this.c, this.d, this.e, this.f];
  }
}

export class TransformStack {
  private stack: Matrix2D[] = [];
  private current: Matrix2D;

  constructor() {
    this.current = Matrix2D.identity();
  }

  save(): void {
    this.stack.push(this.current.clone());
  }

  restore(): void {
    const m = this.stack.pop();
    if (m) this.current = m;
  }

  reset(): void {
    this.stack = [];
    this.current = Matrix2D.identity();
  }

  getCurrent(): Matrix2D {
    return this.current;
  }

  apply(transform: {
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    skewX?: number;
    skewY?: number;
  }): void {
    if (transform.x !== undefined || transform.y !== undefined) {
      this.current = this.current.translate(transform.x ?? 0, transform.y ?? 0);
    }
    if (transform.rotation !== undefined) {
      this.current = this.current.rotate(transform.rotation);
    }
    if (transform.scaleX !== undefined || transform.scaleY !== undefined) {
      this.current = this.current.scaleXY(
        transform.scaleX ?? 1,
        transform.scaleY ?? 1
      );
    }
    if (transform.skewX !== undefined || transform.skewY !== undefined) {
      this.current = this.current.skewXY(
        transform.skewX ?? 0,
        transform.skewY ?? 0
      );
    }
  }
}
