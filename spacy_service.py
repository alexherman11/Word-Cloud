"""
spaCy Embedding Service
Provides word embeddings and semantic similarity calculations using spaCy
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import numpy as np

app = Flask(__name__)
CORS(app)

# Load spaCy model with word vectors
# Using en_core_web_lg for large model with better quality (300 dimensions)
# For smaller/faster model, use en_core_web_md instead
try:
    nlp = spacy.load("en_core_web_lg")
    print("[OK] spaCy model 'en_core_web_lg' loaded successfully")
except OSError:
    print("Model 'en_core_web_lg' not found. Downloading...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_lg"])
    nlp = spacy.load("en_core_web_lg")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': nlp.meta['name'],
        'vector_size': nlp.vocab.vectors_length
    })

@app.route('/embedding', methods=['POST'])
def get_embedding():
    """
    Get word embedding for a single word or phrase

    Request body:
    {
        "text": "example word"
    }

    Response:
    {
        "text": "example word",
        "embedding": [0.123, -0.456, ...],
        "has_vector": true
    }
    """
    data = request.json
    text = data.get('text', '').strip().lower()

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Process the text
    doc = nlp(text)

    # Get the average vector for the document (handles multi-word phrases)
    if doc.has_vector:
        embedding = doc.vector.tolist()
        has_vector = True
    else:
        # Return zero vector if no embedding available
        embedding = [0.0] * nlp.vocab.vectors_length
        has_vector = False

    return jsonify({
        'text': text,
        'embedding': embedding,
        'has_vector': has_vector
    })

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """
    Calculate semantic similarity between two texts

    Request body:
    {
        "text1": "first word",
        "text2": "second word"
    }

    Response:
    {
        "text1": "first word",
        "text2": "second word",
        "similarity": 0.85
    }
    """
    data = request.json
    text1 = data.get('text1', '').strip().lower()
    text2 = data.get('text2', '').strip().lower()

    if not text1 or not text2:
        return jsonify({'error': 'Both text1 and text2 are required'}), 400

    # Process both texts
    doc1 = nlp(text1)
    doc2 = nlp(text2)

    # Calculate similarity
    if doc1.has_vector and doc2.has_vector:
        similarity = doc1.similarity(doc2)
    else:
        similarity = 0.0

    return jsonify({
        'text1': text1,
        'text2': text2,
        'similarity': float(similarity)
    })

@app.route('/batch_similarity', methods=['POST'])
def batch_similarity():
    """
    Calculate similarity between one word and multiple words

    Request body:
    {
        "target": "target word",
        "words": ["word1", "word2", "word3"]
    }

    Response:
    {
        "target": "target word",
        "similarities": [
            {"word": "word1", "similarity": 0.85},
            {"word": "word2", "similarity": 0.72},
            ...
        ]
    }
    """
    data = request.json
    target = data.get('target', '').strip().lower()
    words = data.get('words', [])

    if not target or not words:
        return jsonify({'error': 'Target and words array are required'}), 400

    # Process target word
    target_doc = nlp(target)

    if not target_doc.has_vector:
        return jsonify({'error': f'No vector available for "{target}"'}), 400

    # Calculate similarities
    similarities = []
    for word in words:
        word = word.strip().lower()
        if word == target:
            continue

        word_doc = nlp(word)
        if word_doc.has_vector:
            similarity = target_doc.similarity(word_doc)
            similarities.append({
                'word': word,
                'similarity': float(similarity)
            })

    # Sort by similarity (descending)
    similarities.sort(key=lambda x: x['similarity'], reverse=True)

    return jsonify({
        'target': target,
        'similarities': similarities
    })

if __name__ == '__main__':
    print("Starting spaCy Embedding Service...")
    print(f"Vector dimensions: {nlp.vocab.vectors_length}")
    print("Service running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
