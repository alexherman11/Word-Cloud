// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const path = require('path');
const os = require('os');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Store all words and connections server-side
let words = new Map(); // Each word: { count, embedding, color }
let connections = [];
let totalSubmissions = 0;

// Proxy spaCy service requests (so we only need one ngrok tunnel)
app.use('/spacy', createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: {
        '^/spacy': '' // remove /spacy prefix when forwarding
    }
}));

// Serve static files
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin reset endpoint
app.post('/admin/reset', (req, res) => {
    words.clear();
    connections = [];
    totalSubmissions = 0;
    io.emit('initialize', { words: [], connections: [] });
    console.log('Word cloud reset via admin endpoint');
    res.json({ success: true, message: 'Word cloud reset successfully' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);
    
    // Send current state to new user
    socket.emit('initialize', {
        words: Array.from(words.entries()).map(([text, data]) => ({
            text,
            count: data.count,
            embedding: data.embedding,
            color: data.color || null
        })),
        connections: connections
    });
    
    // Handle new word submission
    socket.on('addWord', async (data) => {
        const { word, embedding } = data;
        const normalizedWord = word.toLowerCase().trim();
        
        if (normalizedWord) {
            totalSubmissions++;
            
            // Update word count
            if (words.has(normalizedWord)) {
                const wordData = words.get(normalizedWord);
                wordData.count++;
                words.set(normalizedWord, wordData);
            } else {
                words.set(normalizedWord, {
                    count: 1,
                    embedding: embedding,
                    color: null
                });
            }

            // Broadcast to all clients including sender
            io.emit('wordAdded', {
                word: normalizedWord,
                count: words.get(normalizedWord).count,
                embedding: embedding,
                color: words.get(normalizedWord).color,
                totalSubmissions: totalSubmissions
            });
            
            console.log(`Word added: "${normalizedWord}" (Count: ${words.get(normalizedWord).count})`);
        }
    });
    
    // Handle connection updates
    socket.on('updateConnections', (newConnections) => {
        connections = newConnections;
        // Broadcast connections to all other clients
        socket.broadcast.emit('connectionsUpdated', connections);
    });

    // Handle color changes
    socket.on('changeColor', (data) => {
        const { word, color } = data;
        const normalizedWord = word.toLowerCase().trim();

        if (words.has(normalizedWord)) {
            const wordData = words.get(normalizedWord);
            wordData.color = color;
            words.set(normalizedWord, wordData);

            // Broadcast color change to ALL clients (including sender for confirmation)
            io.emit('colorChanged', {
                word: normalizedWord,
                color: color
            });

            console.log(`Color changed for "${normalizedWord}": ${color}`);
        }
    });

    // Handle reset request (optional - for admin)
    socket.on('reset', () => {
        words.clear();
        connections = [];
        totalSubmissions = 0;
        io.emit('initialize', { words: [], connections: [] });
        console.log('Word cloud reset');
    });
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Function to get local IP addresses
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    name: name,
                    address: iface.address
                });
            }
        }
    }
    return addresses;
}

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('🚀 Word Cloud Server Started!');
    console.log('========================================\n');
    
    console.log(`Local access: http://localhost:${PORT}`);
    
    const ips = getLocalIPs();
    if (ips.length > 0) {
        console.log('\nNetwork access URLs:');
        ips.forEach(({name, address}) => {
            console.log(`  ${name}: http://${address}:${PORT}`);
        });
        console.log('\n👆 Share one of these URLs with your students');
    }
    
    console.log('\n⚠️  Note: These URLs only work if devices can');
    console.log('   communicate on the same network (may not work on eduroam)');
    console.log('\n💡 Tip: Consider using ngrok for a public URL:');
    console.log(`   npx ngrok http ${PORT}`);
    console.log('\n========================================\n');
});