<div align="center">

# nocommit

**AI-powered git commit messages using Google Gemini**

Never write a commit message again.

[![npm version](https://img.shields.io/npm/v/nocommit)](https://www.npmjs.com/package/nocommit)
[![License](https://img.shields.io/npm/l/nocommit)](https://github.com/asimar007/no-commit/blob/main/LICENSE)

</div>

---

## Why nocommit?

Writing good commit messages takes time. **nocommit** analyzes your staged changes and generates meaningful, conventional commit messages in seconds using Google's Gemini AI.

```bash
$ git add .
$ nocommit

✨ Generated commit message:
feat: add user authentication with JWT tokens

? What would you like to do?
❯ Commit
  Edit
  Regenerate
  Cancel
```

## Quick Start

```bash
# Install (choose one)
brew tap asimar007/no-commit && brew install nocommit  # Homebrew
npm install -g nocommit                                 # npm

# Set your Gemini API key
nocommit config set GEMINI_API_KEY=your_api_key_here

# Stage changes and generate commit
git add .
nocommit
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

## Requirements

- Node.js v18 or higher
- A Google Gemini API key

## Installation

### Using Homebrew (macOS/Linux)

```bash
brew tap asimar007/no-commit
brew install nocommit
```

### Using npm

```bash
npm install -g nocommit
```

Verify installation:

```bash
nocommit --version
```

### Upgrading

```bash
# Homebrew
brew upgrade nocommit

# npm
npm update -g nocommit
```

## Usage

### Basic Usage

Stage your changes, then run nocommit:

```bash
git add <files...>
nocommit
```

### Command Options

| Flag         | Description                                 |
| ------------ | ------------------------------------------- |
| `-a, --all`  | Stage all tracked changes before generating |
| `-y, --yes`  | Skip confirmation and commit immediately    |
| `-h, --help` | Show help                                   |
| `--version`  | Show version number                         |

### Examples

```bash
# Generate message for staged changes
nocommit

# Stage all changes and generate message
nocommit -a

# Stage all and commit without confirmation
nocommit --yes
```

### Interactive Menu

After generating a message, you'll see these options:

- **Commit** — Use the message and commit
- **Edit** — Modify the message before committing
- **Regenerate** — Get a new suggestion
- **Cancel** — Exit without committing

## Configuration

Manage settings with `nocommit config`:

```bash
# View all settings
nocommit config get

# Get a specific value
nocommit config get model

# Set a value
nocommit config set model=gemini-2.0-flash
```

### Available Options

| Option           | Default            | Description                             |
| ---------------- | ------------------ | --------------------------------------- |
| `GEMINI_API_KEY` | —                  | Your Google Gemini API key (required)   |
| `model`          | `gemini-2.5-flash` | Gemini model to use                     |
| `maxLength`      | `72`               | Max commit message length (20–500)      |
| `timeout`        | `30000`            | API timeout in ms (5000–120000)         |
| `generate`       | `3`                | Number of suggestions to generate (1–5) |

### Example Configuration

```bash
# Use a different model
nocommit config set model=gemini-2.0-flash

# Allow longer commit messages
nocommit config set maxLength=100

# Generate only one suggestion
nocommit config set generate=1

# Increase timeout for slow connections
nocommit config set timeout=60000
```

## How It Works

1. **Diff** — nocommit runs `git diff --staged` to capture your changes
2. **Analyze** — Changes are sent to Google's Gemini AI
3. **Generate** — Gemini returns commit message suggestions following conventional commit format
4. **Commit** — You review, optionally edit, and commit

## Troubleshooting

**"No staged changes found"**  
Stage files first with `git add <files>` or use `nocommit -a`.

**"API key not configured"**  
Set your key with `nocommit config set GEMINI_API_KEY=your_key`.

**Request timeout**  
Increase timeout: `nocommit config set timeout=60000`

## Contributing

Contributions are welcome! Check out the [GitHub repository](https://github.com/asimar007/no-commit) to report issues or submit pull requests.

## Maintainers

- **Asim Sk** — [@asimar007](https://github.com/asimar007)
