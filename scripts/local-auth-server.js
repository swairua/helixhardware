#!/usr/bin/env node

/**
 * Local Authentication Server
 * Simple Node.js HTTP server for local development
 * No external dependencies required
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.AUTH_SERVER_PORT || 3001;
const DB_FILE = path.join(process.cwd(), '.auth-dev.json');

// Initialize database
function initDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
      return { users: [], profiles: [], nextId: 1 };
    }
  }
  return { users: [], profiles: [], nextId: 1 };
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Password hashing (dev only - NOT for production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'dev-salt-2024').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Generate JWT token
function generateToken(userId, email, role) {
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    })
  ).toString('base64');

  const signature = crypto
    .createHmac('sha256', 'dev-secret-2024')
    .update(`${header}.${payload}`)
    .digest('base64');

  return `${header}.${payload}.${signature}`;
}

// Request handler
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      let data = {};
      if (body) {
        try {
          data = JSON.parse(body);
        } catch {
          // Try to parse as form-encoded
          const params = new URLSearchParams(body);
          params.forEach((value, key) => {
            data[key] = value;
          });
        }
      }

      // Handle query string action parameter
      const action = query.action || data.action;

      // Health check
      if (pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', message: 'Local auth server running' }));
        return;
      }

      // Setup endpoint - create admin user
      if (action === 'setup' || pathname.includes('setup')) {
        const { email, password } = data;

        if (!email || !password) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Missing email or password' }));
          return;
        }

        const db = initDb();
        const existingUser = db.users.find(u => u.email === email);

        if (existingUser) {
          existingUser.password = hashPassword(password);
          existingUser.role = 'admin';

          // Ensure profile exists or update it
          if (!db.profiles) db.profiles = [];
          let profile = db.profiles.find(p => String(p.id) === String(existingUser.id));

          if (profile) {
            // Update existing profile
            profile.role = 'admin';
            profile.status = 'active';
            profile.is_active = true;
            profile.updated_at = new Date().toISOString();
          } else {
            // Create new profile
            profile = {
              id: existingUser.id,
              email,
              full_name: email.split('@')[0],
              role: 'admin',
              status: 'active',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            db.profiles.push(profile);
          }

          saveDb(db);

          res.writeHead(200);
          res.end(
            JSON.stringify({
              status: 'success',
              message: 'Admin user updated',
              email,
            })
          );
          return;
        }

        const userId = db.nextId++;
        const user = {
          id: userId,
          email,
          password: hashPassword(password),
          role: 'admin',
          created_at: new Date().toISOString(),
        };

        // Auto-create profile for new user
        const profile = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'admin',
          status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.users.push(user);
        if (!db.profiles) db.profiles = [];
        db.profiles.push(profile);
        saveDb(db);

        res.writeHead(200);
        res.end(
          JSON.stringify({
            status: 'success',
            message: 'Admin user created',
            id: user.id,
            email,
          })
        );
        return;
      }

      // Login endpoint
      if (action === 'login' || pathname.includes('login')) {
        const { email, password } = data;

        if (!email || !password) {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'error', message: 'Missing email or password' }));
          return;
        }

        const db = initDb();
        const user = db.users.find(u => u.email === email);

        if (!user || !verifyPassword(password, user.password)) {
          res.writeHead(401);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid email or password' }));
          return;
        }

        const token = generateToken(user.id, user.email, user.role);

        res.writeHead(200);
        res.end(
          JSON.stringify({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
          })
        );
        return;
      }

      // Check auth endpoint
      if (action === 'check_auth' || pathname.includes('check_auth')) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.writeHead(401);
          res.end(JSON.stringify({ status: 'error', message: 'No token provided' }));
          return;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
          res.writeHead(401);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid token format' }));
          return;
        }

        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          res.writeHead(200);
          res.end(
            JSON.stringify({
              status: 'success',
              user: {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
              },
            })
          );
        } catch {
          res.writeHead(401);
          res.end(JSON.stringify({ status: 'error', message: 'Invalid token' }));
        }
        return;
      }

      // List users (dev endpoint)
      if (pathname === '/users' || action === 'read' && query.table === 'users') {
        const db = initDb();
        res.writeHead(200);
        res.end(
          JSON.stringify({
            status: 'success',
            data: db.users.map(u => ({
              id: u.id,
              email: u.email,
              role: u.role,
              created_at: u.created_at,
            })),
          })
        );
        return;
      }

      // List profiles
      if (action === 'read' && query.table === 'profiles') {
        const db = initDb();
        const userId = query.id || data.id;

        // If specific user ID requested, return that profile
        if (userId) {
          const profile = db.profiles && db.profiles.find(p => String(p.id) === String(userId));
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: profile || null,
          }));
          return;
        }

        // Otherwise return all profiles
        res.writeHead(200);
        res.end(
          JSON.stringify({
            status: 'success',
            data: db.profiles || [],
          })
        );
        return;
      }

      // Reset database (dev endpoint)
      if (pathname === '/reset') {
        saveDb({ users: [], profiles: [], nextId: 1 });
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'success', message: 'Database reset' }));
        return;
      }

      // 404
      res.writeHead(404);
      res.end(JSON.stringify({ status: 'error', message: 'Endpoint not found' }));
    } catch (error) {
      res.writeHead(500);
      res.end(
        JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        🔐 LOCAL AUTHENTICATION SERVER                          ║
╠════════════════════════════════════════════════════════════════╣
║ Server:  http://localhost:${PORT}                             ║
║ Database: ${DB_FILE}                                            ║
║                                                                ║
║ ⚠️  FOR DEVELOPMENT ONLY!                                      ║
║ Do NOT use this in production!                                 ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});
