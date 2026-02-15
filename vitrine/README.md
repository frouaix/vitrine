# Vitrine Graphics Library

Vitrine is an immediate-mode graphics library for TypeScript designed for high-performance rendering of visual elements on canvas. It provides a declarative, function-based DSL that simplifies the creation and manipulation of graphics, making it ideal for productivity applications that require rendering of tens of thousands of elements at high frame rates.

## Project Overview

The core philosophy of Vitrine is based on immediate-mode rendering, where the visual hierarchy is re-described each frame. This approach offers flexibility and simplicity, allowing developers to easily create and manage graphics without the overhead of a retained scene graph.

## Key Features

- **Block-based DSL**: Create visual elements using factory functions such as `rectangle()`, `circle()`, `text()`, and `group()`.
- **Transform Hierarchy**: Apply transformations (position, rotation, scale, skew) to blocks, affecting their children.
- **Event Handling**: Support for event handlers like `onClick`, `onHover`, and `onDrag`, with transform-aware hit testing.
- **Performance Optimization**: Built-in frustum culling and performance monitoring to ensure efficient rendering.

## Installation

To get started with Vitrine, clone the repository and install the dependencies:

```bash
# Clone the repository
git clone https://github.com/frouaix/vitrine.git

# Navigate to the project directory
cd vitrine

# Install dependencies
pnpm install
```

## Development

To run the development server and view examples:

```bash
pnpm dev
```

This will open the gallery at `localhost:8080`.

## Building the Library

To build the TypeScript library, use:

```bash
pnpm build
```

This will output the compiled files to the `dist/` directory.

## Examples

Examples are provided in the `examples/` directory. To build the examples for production:

```bash
pnpm build:examples
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.