import express from 'express';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Simple auth middleware that accepts dev-token
const simpleAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth === 'Bearer dev-token') {
    req.user = { 
      id: 'dev-user-1', 
      tenantId: 'dev-tenant-1',
      email: 'dev@example.com' 
    };
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Auth endpoint
app.post('/auth', (req, res) => {
  res.json({ 
    token: 'dev-token',
    user: { id: 'dev-user-1', email: 'dev@example.com' }
  });
});

// Connections endpoint
app.get('/connections', simpleAuth, (req, res) => {
  console.log('GET /connections called by user:', req.user.id);
  res.json([]);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = 9090;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on http://localhost:${PORT}`);
});
