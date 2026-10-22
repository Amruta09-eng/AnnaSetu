// AnnaSetu REST API Server

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { seedDemoData } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allows cross-origin requests from frontend apps or deployment domains
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (suppressed during unit tests)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health check endpoint for container orchestrators (Render / Railway / AWS / Docker)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'AnnaSetu Backend'
  });
});

// Mount REST API routes
app.use('/api', apiRoutes);

// Serve frontend static assets if frontend directory exists alongside backend
const possibleFrontendPaths = [
  path.join(__dirname, '../public'),
  path.join(__dirname, '../../frontend'),
  path.join(process.cwd(), 'frontend'),
  path.join(process.cwd(), 'backend/public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, '../frontend')
];

let frontendServed = false;
for (const frontendDir of possibleFrontendPaths) {
  if (fs.existsSync(frontendDir) && fs.existsSync(path.join(frontendDir, 'index.html'))) {
    app.use(express.static(frontendDir));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') return next();
      res.sendFile(path.join(frontendDir, 'index.html'));
    });
    frontendServed = true;
    break;
  }
}

// Fallback for API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ errors: ['No such endpoint'] });
});

// Fallback if no frontend static served
if (!frontendServed) {
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'AnnaSetu RESTful API',
      status: 'active',
      version: '1.0.0',
      docs: '/api/health',
      health: '/health'
    });
  });
}

// Global error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ errors: ['Malformed JSON in request body'] });
  }
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ errors: ['Internal server error', err.message || 'Unknown error'] });
});

// Server launcher
let server = null;
if (require.main === module) {
  (async () => {
    try {
      await seedDemoData();
    } catch (err) {
      console.error('Database bootstrap error:', err);
    }
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌾 AnnaSetu Backend running on port ${PORT}`);
      console.log(`📡 Health Check: /health`);
      console.log(`🔗 API Base: /api`);
    });
  })();
}


module.exports = {
  app,
  server,
  seed: seedDemoData
};
