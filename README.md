# Smart Excalidraw - AI-Powered Diagram Generation

> **Note:** This is the English version fork of [smart-excalidraw-next](https://github.com/liujuntao123/smart-excalidraw-next) with all UI translated to English.

An intelligent diagram generation tool powered by AI that automatically creates professional Excalidraw diagrams from natural language descriptions.

## Features

- 🤖 **AI-Powered Generation**: Describe your diagram in plain English, AI generates it for you
- 🎨 **Excalidraw Integration**: Beautiful hand-drawn style diagrams
- 💾 **History Management**: Track and restore previous generations
- ⚙️ **Flexible Configuration**: Support for multiple LLM providers (OpenAI, Anthropic, etc.)
- 🔐 **Access Password Mode**: Server-side API key management for team use
- 📝 **Live Code Editor**: Edit generated Excalidraw JSON directly

## Quick Start

### Docker Deployment (Recommended)

```bash
# Using pre-built image
docker-compose up -d
```

Set environment variables in `.env`:
```bash
ANTHROPIC_API_KEY=your-api-key-here
ACCESS_PASSWORD=your-password  # Optional - for server-managed mode
```

### Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
pnpm start
```

## Configuration

### Server-Managed Mode
Set `ACCESS_PASSWORD` environment variable and users can access with the password - no personal API keys needed.

### Local/Custom Mode
Users configure their own LLM providers in the UI settings.

## Deployment

### Coolify
1. Add as **Public Repository**
2. Repository: `https://github.com/StardawnAI/excalidraw-plus`
3. Build Pack: **Docker Compose**
4. Set environment variables (optional)

### Manual Docker

```bash
# Build
docker build -t excalidraw-plus .

# Run
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key \
  excalidraw-plus
```

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **UI**: Tailwind CSS 4
- **Diagram Engine**: Excalidraw
- **Code Editor**: Monaco Editor
- **Deployment**: Docker

## Differences from Original

- ✅ Full English UI translation
- ✅ Docker & docker-compose support
- ✅ GitHub Actions for automated builds
- ✅ Upstream sync workflow
- ✅ English documentation

## Upstream Sync

This fork automatically checks for updates from the [original repository](https://github.com/liujuntao123/smart-excalidraw-next) weekly. The sync workflow creates a PR when new changes are available.

## License

MIT

## Credits

Original project: [smart-excalidraw-next](https://github.com/liujuntao123/smart-excalidraw-next) by [@liujuntao123](https://github.com/liujuntao123)
