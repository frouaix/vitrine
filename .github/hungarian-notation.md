# Hungarian Notation

## Geometric variable

All variables denoting coordinates should include the coordinate system they refer to
- xl, yl: local coordinate system of an object
- xp, yp: coordinate system of the parent container
- xc, yc: coordinate system of the enclosing canvas
- xw, yw: coordinate system of the browser / window

Widths are denoted using dx, using the same coordinate system convention (dxl, dxp, dxc, dxw).
Heights are similarly denoted using dy (dyl, dyp, dyc, dyw).
