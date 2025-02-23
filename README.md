# YouTube Client

A minimal, ad-free YouTube client built with Next.js and FastAPI. This project provides a clean and distraction-free YouTube viewing experience.

## 🌟 Features

- 🚫 Ad-free YouTube experience
- 🎯 Minimal and clean interface
- 🔄 Video recommendations
- 🎨 Modern, responsive design
- 💨 Fast and efficient playback
- 🔒 Secure cookie-based authentication

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) for frontend package management and development
- [uv](https://astral.sh/uv) for Python package management
- [Cookie Editor](https://github.com/Moustachauve/cookie-editor) browser extension
- Python 3.8 or higher

### Installation

#### Frontend Setup

```bash
# Install Bun (macOS & Linux)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun i

# Start development server
bun run dev
```

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create and activate virtual environment
uv venv
source .venv/bin/activate

# Install Python dependencies
uv pip install -r requirements.txt

# Start backend server
uvicorn main:app
```

### Configuration

1. Install the [Cookie Editor](https://github.com/Moustachauve/cookie-editor) extension in your browser
2. Visit [YouTube](https://youtube.com)
3. Open Cookie Editor and export cookies in Netscape format
4. Navigate to `localhost:3000` in your browser
5. When prompted, select "cookies" option and paste your YouTube cookies

## 🛠️ Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- Bun package manager

### Backend
- FastAPI (Python)
- Redis for caching
- MongoDB for data storage
- yt-dlp for YouTube integration

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and enhancement requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This project is for educational purposes only. Please ensure you comply with YouTube's terms of service when using this application.

## 📝 License

[MIT License](LICENSE)

---
Made with ❤️ by [S4tyendra](https://github.com/S4tyendra)
