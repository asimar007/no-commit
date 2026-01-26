# Contributing to nocommit

Thank you for your interest in contributing to nocommit! This guide will help you get started with the development setup and contribution process.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setting up the project](#setting-up-the-project)
- [Development workflow](#development-workflow)
- [Code quality guidelines](#code-quality-guidelines)
- [Contributing process](#contributing-process)
- [Project structure](#project-structure)
- [Getting help](#getting-help)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher (as specified in `.nvmrc`)
- **npm**: Comes with Node.js
- **nvm**: For managing Node.js versions (optional but recommended)
- **Git**: For version control
- **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/apikey)

## Setting up the project

### 1. Fork and clone the repository

```sh
git clone https://github.com/asimar007/no-commit.git
cd no-commit
```

### 2. Use the correct Node.js version

If you have [nvm](https://nvm.sh) installed:

```sh
nvm install
nvm use
```

### 3. Install dependencies

```sh
npm install
```

### 4. Set up your API key

```sh
node dist/index.js config set GEMINI_API_KEY=your_api_key_here
```

## Development workflow

### Building the project

Compile TypeScript to JavaScript:

```sh
npm run build
```

Output will be in the `dist/` directory.

### Development (watch) mode

Automatically rebuild on file changes:

```sh
npm run dev
```

### Type checking

Run TypeScript type checking without emitting files:

```sh
npm run type-check
```

### Running locally

After building, you can run the CLI directly:

```sh
node dist/index.js
```

Or link it globally for testing:

```sh
npm link
nocommit
```

## Code quality guidelines

### TypeScript

- Use strict TypeScript configuration
- Ensure all functions have proper type annotations
- Use meaningful variable and function names
- Handle errors appropriately using `KnownError` class

### Code style

- Follow the existing code patterns in the project
- Keep functions focused and single-purpose
- Use descriptive variable names
- Code should be self-documenting
- Avoid unnecessary complexity

### Commit messages

Use conventional commit format:

```
feat: add new feature
fix: resolve issue with X
docs: update README
refactor: improve code structure
chore: update dependencies
```

## Contributing process

### 1. Fork the repository

Fork the repository on GitHub and clone your fork locally.

### 2. Create a feature branch

```sh
git checkout -b feature/your-feature-name
```

### 3. Make your changes

- Write your code following the project's style guidelines
- Update documentation if needed
- Ensure the project builds without errors

### 4. Test your changes

```sh
# Run type checking
npm run type-check

# Build the project
npm run build

# Test the CLI manually
node dist/index.js --help
```

### 5. Commit your changes

```sh
git add .
git commit -m "feat: add your feature description"
```

### 6. Push and create a pull request

```sh
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Project structure

```
nocommit/
├── src/
│   ├── index.ts      # Main CLI entry point
│   ├── ai.ts         # Gemini AI integration
│   ├── config.ts     # Configuration management
│   ├── git.ts        # Git operations
│   └── error.ts      # Error handling utilities
├── dist/             # Compiled output
├── package.json      # Project configuration
├── tsconfig.json     # TypeScript configuration
├── .nvmrc            # Node.js version
├── .gitignore        # Git ignore rules
├── .npmignore        # npm publish ignore rules
├── LICENSE           # MIT License
└── README.md         # Documentation
```

### Key files

| File            | Description                             |
| --------------- | --------------------------------------- |
| `src/index.ts`  | Main CLI entry point using Commander.js |
| `src/ai.ts`     | Google Gemini API integration           |
| `src/config.ts` | Configuration management with Conf      |
| `src/git.ts`    | Git diff and commit operations          |
| `src/error.ts`  | Custom error handling                   |

### Dependencies

| Package          | Purpose                 |
| ---------------- | ----------------------- |
| `@google/genai`  | Google Gemini AI client |
| `commander`      | CLI framework           |
| `@clack/prompts` | Interactive CLI prompts |
| `conf`           | Configuration storage   |
| `execa`          | Process execution       |
| `picocolors`     | Terminal colors         |

## Getting help

- Check existing [Issues](https://github.com/asimar007/no-commit/issues)
- Create a new issue for bugs or feature requests
- Open a discussion for questions
