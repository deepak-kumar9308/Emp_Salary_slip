require('dotenv').config();
const http = require('http');
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});