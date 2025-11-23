/**
 * Ayiti Home - Simple static server
 * ayiti.com landing page
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.HOME_PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// All routes serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Ayiti Home running on http://localhost:${PORT}`);
});
