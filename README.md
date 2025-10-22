# Romeo & Juliet Semantic Word Cloud

An interactive, collaborative word cloud visualization that uses AI-powered word embeddings to create semantic connections between words. Built for classroom use with real-time multi-user collaboration.

![Word Cloud Demo](https://img.shields.io/badge/Status-Live-success)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)

## 📖 Overview

This project creates a beautiful, interactive word cloud where words that are semantically similar (like "love" and "romance") are automatically connected with lines. Unlike traditional word clouds that just show frequency, this visualization shows the **relationships between concepts** using advanced natural language processing.

![til](./demo_video.gif)

### Key Features

- **AI-Powered Semantic Analysis** - Uses spaCy's word embeddings to understand word meanings
- **Multi-User Collaboration** - Real-time updates via WebSocket (Socket.IO)
- **Mobile Friendly** - Responsive design works on phones and tablets
- **Customizable Colors** - Right-click or long-press to change node colors
- **Smart Connections** - Automatically creates up to 7 connections per word based on similarity
- **Interactive Physics** - Drag nodes, zoom, and pan to explore relationships
- **Network Accessible** - Share with students via ngrok tunnel (works on restricted networks like eduroam)

## Architecture

The project consists of three main components:

### 1. **Node.js Web Server** (`server.js`)
- **Express.js** server serving the web interface
- **Socket.IO** for real-time bi-directional communication
- **HTTP Proxy Middleware** to route spaCy requests (solving the "one ngrok tunnel" limitation)
- Maintains shared state (words, connections, colors) across all connected users

### 2. **spaCy Embedding Service** (`spacy_service.py`)
- **Flask API** providing word embeddings via HTTP endpoints
- Uses **spaCy's `en_core_web_lg` model** (300-dimensional word vectors)
- Endpoints:
  - `/health` - Service health check
  - `/embedding` - Get word embedding for a single word
  - `/similarity` - Calculate similarity between two words
  - `/batch_similarity` - Efficient batch similarity calculations

### 3. **Frontend Visualization** (`public/index.html`)
- **D3.js** for force-directed graph visualization
- **Custom physics simulation** with semantic-based repulsion
- Real-time updates via Socket.IO client
- Touch-optimized for mobile devices

### How It All Works Together

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Phone/Browser                      │
│              (Connected via ngrok URL)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────────┐
         │     ngrok Tunnel (Public URL)         │
         │  https://xxxx.ngrok-free.app          │
         └───────────────┬───────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────────┐
         │   Node.js Server (Port 3000)          │
         │   • Serves web interface              │
         │   • Socket.IO for real-time updates   │
         │   • Proxies /spacy/* requests         │
         └───────────────┬───────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
   ┌────────────────┐      ┌─────────────────────┐
   │   WebSocket    │      │  HTTP Proxy to      │
   │  (Socket.IO)   │      │  localhost:5000     │
   │                │      │  (/spacy/*)         │
   └────────────────┘      └──────────┬──────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │  spaCy Service        │
                          │  (Port 5000)          │
                          │  • Word embeddings    │
                          │  • Similarity calc    │
                          └───────────────────────┘
```

**Why the proxy?** ngrok's free plan only allows one tunnel. By proxying spaCy requests through the Node.js server, we only need one public tunnel while still accessing both services.

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **Python** 3.8 or higher ([Download](https://www.python.org/))
- **npm** (comes with Node.js)
- **pip** (comes with Python)

### Installation

#### 1. Clone or Download the Project

```bash
cd path/to/Romeo-Juliet-Wordcloud
```

#### 2. Install Node.js Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `socket.io` - Real-time communication
- `http-proxy-middleware` - Proxy for spaCy requests

#### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `flask` - Python web framework
- `flask-cors` - Cross-origin resource sharing
- `spacy` - NLP library
- `numpy` - Numerical computing

#### 4. Download the spaCy Language Model

```bash
python -m spacy download en_core_web_lg
```

This downloads the large English model (~800MB) with word vectors.

### Running the Application

You need to run **two services** in separate terminal windows:

#### Terminal 1: Start the spaCy Service

```bash
python spacy_service.py
```

You should see:
```
Starting spaCy Embedding Service...
Vector dimensions: 300
Service running on http://localhost:5000
```

#### Terminal 2: Start the Node.js Server

```bash
node server.js
```

You should see:
```
🚀 Word Cloud Server Started!
Local access: http://localhost:3000
```

#### Terminal 3: Start ngrok (for remote access)

```bash
npx ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**Share that ngrok URL** with students or access it on your phone!

## 📱 Usage

### Basic Usage

1. **Open the application** in your browser (local or ngrok URL)
2. **Type a word** in the input box at the bottom
3. **Press Enter** or click "Add Word"
4. **Watch** as the word appears and connects to similar words automatically

### Advanced Features

#### Adjusting Node Colors
- **Desktop**: Right-click a word node to open the color picker
- **Mobile**: Long-press a word node (600ms) to open the color picker
- **Alternative**: Double-click on desktop

#### Navigation
- **Pan**: Click and drag on empty space
- **Zoom**: Scroll wheel or use the +/- buttons
- **Reset View**: Click the ⟲ button
- **Reorganize**: Drag individual word nodes to reposition them

#### Understanding Connections

The visualization uses three connection strengths based on semantic similarity:

| Strength | Similarity Range | Visual Style | Example |
|----------|-----------------|--------------|---------|
| **Strong** | ≥40% | Thick, bright line | love ↔ romance |
| **Medium** | 30-40% | Medium line | love ↔ affection |
| **Weak** | 22-30% | Thin, faint line | love ↔ emotion |

Each word can have up to **7 connections** to its most similar neighbors.

### Multi-User Collaboration

All users viewing the same URL see:
- ✅ **Real-time word additions** from all users
- ✅ **Shared connection graph** (connections calculated by first user to add a word)
- ✅ **Color changes** synchronized across all devices
- ✅ **Word count statistics** updated live

Perfect for classroom activities where students contribute words simultaneously!

## 🔧 Configuration

### Adjusting Similarity Threshold

Edit `public/index.html` around line 1071:

```javascript
// Only consider meaningful similarity (above 35%)
if (similarity > 0.35) {
```

Lower values = more connections (but potentially weaker relationships)
Higher values = fewer connections (only very similar words)

### Changing Maximum Connections per Node

Edit `public/index.html` around line 1085:

```javascript
const top7ForNewWord = similarities.slice(0, 7);
```

Change `7` to any number (e.g., `5` for fewer connections, `10` for more)

### Customizing Colors

Edit the color palette in `public/index.html` around line 617:

```javascript
const pastelColors = [
    '#F48771', // coral/salmon
    '#89D185', // vibrant green
    '#4EC9B0', // cyan/teal
    '#bd9b2b', // golden yellow
    '#5e28b5', // purple
    '#e622df'  // magenta
];
```

## Project Statistics

- **Lines of Code**: ~1,500
- **Dependencies**: 13 npm packages, 4 Python packages
- **Model Size**: ~800MB (spaCy en_core_web_lg)
- **Vector Dimensions**: 300
- **WebSocket Events**: 5 custom events
- **API Endpoints**: 4

## Security Notes

- The application is **not production-ready** as-is
- No authentication or rate limiting implemented
- ngrok URLs are publicly accessible (but obscured)
- For classroom use on trusted networks only

**Built with ❤️ for interactive learning experiences**
