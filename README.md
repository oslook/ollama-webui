# Ollama Web UI

A modern web interface for [Ollama](https://ollama.ai/), featuring a clean design and essential chat functionalities.

![Ollama Web UI Screenshot](screenshot.png)

## Features

### Chat Interface
- 🚀 Real-time streaming responses
- 💬 Multi-conversation management
- 🔄 Conversation history
- 📝 Markdown and code syntax highlighting support
- 🌓 Clean and modern UI design

### Model Management
- 📋 List available models
- 🔄 Auto-select first available model
- 🎯 Easy model switching

### Settings & Configuration
- ⚙️ Configurable Ollama server URL
- 💾 Settings persistence
- 📤 Export chat history to JSON
- 📥 Import chat history from JSON

## Getting Started

### Prerequisites
- [Ollama](https://ollama.ai/) installed and running on your machine
- Node.js 18+ installed (for development)
- Docker (optional, for containerized deployment)

### Installation

#### Method 1: Docker (Recommended)

1. Using Docker Compose (includes Ollama service):
```bash
wget https://raw.githubusercontent.com/oslook/ollama-webui/main/docker-compose.yml
docker compose up -d
```

2. Using Docker directly:
```bash
docker run -d -p 3000:3000 ghcr.io/oslook/ollama-webui:latest
```

#### Method 2: Development Setup

1. Clone the repository:
```bash
git clone https://github.com/oslook/ollama-webui.git
cd ollama-webui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. Ensure your Ollama server is running (default: http://127.0.0.1:11434)
2. Select a model from the dropdown menu
3. Start chatting!

### Configuration

- Click the settings icon (⚙️) to:
  - Configure Ollama server URL
  - Export chat history
  - Import chat history

## Docker Support

### Available Tags

- `latest`: Latest stable release
- `main`: Latest development build
- `vX.Y.Z`: Specific version releases

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Node environment | production |
| PORT | Port to run the server on | 3000 |

### Building Locally

```bash
# Build the image
docker build -t ollama-webui .

# Run the container
docker run -d -p 3000:3000 ollama-webui
```

### Using Docker Compose

The included `docker-compose.yml` provides two services:
1. `ollama-webui`: The web interface
2. `ollama`: The Ollama server (optional)

To use only the web interface:
```bash
docker compose up -d ollama-webui
```

To run both services:
```bash
docker compose up -d
```

## Built With

- [Next.js](https://nextjs.org/) - React Framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [DaisyUI](https://daisyui.com/) - UI Components
- [TypeScript](https://www.typescriptlang.org/) - Type Safety

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This project was generated by an AI agent (Cursor) and has been human-verified for functionality and best practices. The implementation combines modern web development patterns with practical user experience considerations.
