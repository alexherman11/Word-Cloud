# spaCy Integration Setup Guide

This word cloud now uses **spaCy** for semantic word embeddings instead of TensorFlow.js, providing better contextual understanding and semantic similarity calculations.

## Architecture

- **Frontend**: Node.js + Express + Socket.IO (existing)
- **Backend**: Python Flask service with spaCy for embeddings
- Both services run simultaneously on different ports

## Installation Steps

### 1. Install Python Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Download spaCy model (medium size, 300-dimensional vectors)

```

**Note**: For better quality embeddings, you can use the large model:
```bash
python -m spacy download en_core_web_lg
```
Then update `spacy_service.py` to use `en_core_web_lg` instead of `en_core_web_md`.

### 2. Start the Services

You need to run **TWO** services simultaneously:

#### Terminal 1: Start the spaCy Service (Port 5000)
```bash
python spacy_service.py
```

You should see:
```
Starting spaCy Embedding Service...
Vector dimensions: 300
Service running on http://localhost:5000
```

#### Terminal 2: Start the Node.js Server (Port 3000)
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 3. Access the Application

Open your browser to: **http://localhost:3000**

The page will automatically check if the spaCy service is running. If it's not, you'll see an alert.

## How It Works

1. **Word Input**: User enters a word in the frontend
2. **Embedding Request**: Frontend sends the word to spaCy service via HTTP
3. **spaCy Processing**: Python backend generates 300-dimensional word vector using spaCy's trained model
4. **Similarity Calculation**: Frontend calculates cosine similarity between word embeddings
5. **Visualization**: D3.js displays words with connections based on semantic similarity

## API Endpoints

The spaCy service provides these endpoints:

### `GET /health`
Check if service is running
```json
{
  "status": "healthy",
  "model": "en_core_web_md",
  "vector_size": 300
}
```

### `POST /embedding`
Get embedding for a word
```json
// Request
{
  "text": "example"
}

// Response
{
  "text": "example",
  "embedding": [0.123, -0.456, ...],
  "has_vector": true
}
```

### `POST /similarity`
Calculate similarity between two words
```json
// Request
{
  "text1": "king",
  "text2": "queen"
}

// Response
{
  "text1": "king",
  "text2": "queen",
  "similarity": 0.85
}
```

### `POST /batch_similarity`
Calculate similarity between one word and multiple words
```json
// Request
{
  "target": "dog",
  "words": ["cat", "puppy", "car"]
}

// Response
{
  "target": "dog",
  "similarities": [
    {"word": "puppy", "similarity": 0.92},
    {"word": "cat", "similarity": 0.78},
    {"word": "car", "similarity": 0.15}
  ]
}
```

## Troubleshooting

### spaCy service not connecting
- Make sure you started `python spacy_service.py` first
- Check that port 5000 is not in use by another application
- Verify the model downloaded: `python -m spacy validate`

### No vector available for word
- Some words might not have embeddings in the model
- Try a different word or use the larger model (`en_core_web_lg`)

### CORS errors
- The Flask service has CORS enabled by default
- If issues persist, check firewall settings

## Performance Notes

- **en_core_web_md**: ~40MB, 300-dimensional vectors, good balance
- **en_core_web_lg**: ~780MB, 300-dimensional vectors, better quality
- First request may be slower as spaCy loads the model into memory
- Subsequent requests are fast (<10ms for embedding generation)

## Advantages of spaCy over TensorFlow.js

1. **Better Context**: spaCy uses linguistically-informed word vectors
2. **Faster**: Server-side processing is more efficient
3. **More Accurate**: Trained on larger, more diverse corpora
4. **Flexible**: Can handle phrases and multi-word expressions
5. **Smaller Frontend**: No need to load large ML models in browser
