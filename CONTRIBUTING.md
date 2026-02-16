# Contributing to Vitrine

Thank you for contributing to Vitrine.

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10.x
- Git

### Initial Setup

```bash
git clone https://github.com/frouaix/vitrine.git
cd vitrine
pnpm install
pnpm dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Refactoring
- `chore/` - Build/tooling changes

### 2. Make Changes

- Keep commits focused and small
- Follow coding conventions in `.github/copilot-instructions.md`
- Use hungarian notation when documented in `.github/hungarian-notation.md`
- Update docs when behavior changes

### 3. Validate Changes

```bash
pnpm build
pnpm build:examples
```

### 4. Commit and Open PR

Use descriptive commit messages:

```bash
git add .
git commit -m "feat: add new primitive block"
```

Open a PR to `main` and use the PR template checklist.

## Pull Request Process

Before submitting:
- ✅ `pnpm build` passes
- ✅ `pnpm build:examples` passes
- ✅ Documentation updated if needed
- ✅ Changes are scoped to the task

## Branch Protection

For `main`, enable these repository settings:
- Require pull request before merging
- Require status checks to pass before merging
- Required checks:
  - `test / Build Library and Examples`
  - `lint / Type Check`
- Block force pushes
- Block branch deletion

## License

By contributing, you agree contributions are licensed under MIT.
