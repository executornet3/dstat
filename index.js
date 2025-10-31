const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();

let requestCount = 0;
let biggestRPS = 0;

// Load biggest RPS from file
try {
    biggestRPS = parseInt(fs.readFileSync('rps.txt', 'utf8')) || 0;
} catch (error) {
    // File doesn't exist or other error, keep biggestRPS as 0
}

// Count all requests
app.use((req, res, next) => {
    requestCount++;
    next();
});

// API endpoint that returns current RPS and total
app.get('/api/requests', (req, res) => {
    const currentRPS = requestCount;

    // Update biggest RPS if current is higher
    if (currentRPS > biggestRPS) {
        biggestRPS = currentRPS;
        try {
            fs.writeFileSync('rps.txt', biggestRPS.toString());
        } catch (error) {
            console.error('Error writing rps.txt:', error);
        }
    }

    // Update total requests to file
    let totalRequests = 0;
    try {
        totalRequests = parseInt(fs.readFileSync('total.txt', 'utf8')) || 0;
    } catch (error) {
        // File doesn't exist yet
    }
    totalRequests += currentRPS;
    try {
        fs.writeFileSync('total.txt', totalRequests.toString());
    } catch (error) {
        console.error('Error writing total.txt:', error);
    }

    // Send response with both current RPS and total
    res.json({
        rps: currentRPS,
        total: totalRequests,
        peak: biggestRPS
    });

    // Reset counter after sending
    requestCount = 0;
});

// New endpoint for /hit that loads ASCII art from /public/nkri.txt
app.get('/hit', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'nkri.txt');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading nkri.txt:', err);
            return res.status(500).send('Error loading ASCII art.');
        }
        // Set response type as plain text to preserve ASCII formatting
        res.type('text/plain');
        res.send(data);
    });
});

// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve main.html as index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Dashboard available at https://dstats.qzz.io:${PORT}`);
});
