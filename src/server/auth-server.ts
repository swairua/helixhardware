/**
 * Local Authentication Server
 * Provides a simple JWT-based auth endpoint for development
 * Stores users in a JSON file (not for production!)
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Database file path
const dbFile = path.join(process.cwd(), '.auth-db.json');

interface User {
  id: number;
  email: string;
  password: string; // bcrypt hash in real apps
  role: string;
  created_at: string;
}

interface AuthDatabase {
  users: User[];
  nextId: number;
}

// Initialize database
function initializeDb(): AuthDatabase {
  if (fs.existsSync(dbFile)) {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  }
  
  return {
    users: [],
    nextId: 1,
  };
}

// Save database
function saveDb(db: AuthDatabase) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

// Simple password hashing (NOT for production!)
function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + 'dev-salt-123')
    .digest('hex');
}

// Verify password
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate JWT token
function generateToken(userId: number, email: string, role: string): string {
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
    })
  ).toString('base64');

  const signature = crypto
    .createHmac('sha256', 'dev-secret-key-123')
    .update(`${header}.${payload}`)
    .digest('base64');

  return `${header}.${payload}.${signature}`;
}

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Local auth server is running' });
});

app.post('/api/auth/setup', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing email or password',
      });
    }

    const db = initializeDb();

    // Check if user exists
    const existingUser = db.users.find(u => u.email === email);

    if (existingUser) {
      // Update existing user
      existingUser.password = hashPassword(password);
      existingUser.role = 'admin';
      saveDb(db);

      return res.json({
        status: 'success',
        message: 'Admin user updated',
        email,
      });
    }

    // Create new user
    const user: User = {
      id: db.nextId++,
      email,
      password: hashPassword(password),
      role: 'admin',
      created_at: new Date().toISOString(),
    };

    db.users.push(user);
    saveDb(db);

    res.json({
      status: 'success',
      message: 'Admin user created',
      id: user.id,
      email,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing email or password',
      });
    }

    const db = initializeDb();
    const user = db.users.find(u => u.email === email);

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/check', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
    }

    // Very basic token validation (not secure, just for dev)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token format',
      });
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      res.json({
        status: 'success',
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        },
      });
    } catch {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Read all users (dev endpoint only)
app.get('/api/auth/users', (req: Request, res: Response) => {
  const db = initializeDb();
  res.json({
    status: 'success',
    users: db.users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
    })),
  });
});

// Reset all users (dev endpoint only)
app.post('/api/auth/reset', (req: Request, res: Response) => {
  const db: AuthDatabase = { users: [], nextId: 1 };
  saveDb(db);
  res.json({
    status: 'success',
    message: 'Database reset',
  });
});

// Admin API Endpoints for Database and Roles Management
// These endpoints provide mock responses for the settings pages

// Check database status endpoint
app.post('/api/admin/database/check-status', (req: Request, res: Response) => {
  res.json({
    success: true,
    connected: true,
    tablesFound: 15,
    totalTables: 15,
    missingTables: [],
    tables: [
      { name: 'users', exists: true },
      { name: 'companies', exists: true },
      { name: 'invoices', exists: true },
      { name: 'quotations', exists: true },
      { name: 'proformas', exists: true },
      { name: 'customers', exists: true },
      { name: 'products', exists: true },
      { name: 'categories', exists: true },
      { name: 'payments', exists: true },
      { name: 'delivery_notes', exists: true },
      { name: 'credit_notes', exists: true },
      { name: 'remittance_advice', exists: true },
      { name: 'lpos', exists: true },
      { name: 'roles', exists: true },
      { name: 'permissions', exists: true }
    ]
  });
});

// Check roles status endpoint
app.post('/api/admin/roles/check-status', (req: Request, res: Response) => {
  res.json({
    success: true,
    rolesExist: ['admin', 'accountant', 'stock_manager', 'user'],
    rolesMissing: [],
    totalRoles: 4,
    error: null
  });
});

// Setup complete endpoint
app.post('/api/admin/roles/setup-complete', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Roles and permissions configured successfully',
    rolesCreated: ['admin', 'accountant', 'stock_manager', 'user'],
    errors: []
  });
});

const PORT = process.env.AUTH_SERVER_PORT || 3001;

app.listen(PORT, () => {
  console.log(`🔐 Local Auth Server running on http://localhost:${PORT}`);
  console.log(`📝 Database file: ${dbFile}`);
  console.log('⚠️  This is for development only!');
});
