'use strict';
/* IMANI SUPERDEALER - Express server: static front-end + JSON API. */
var path = require('path');
var express = require('express');
var helmet = require('helmet');
var compression = require('compression');
var rateLimit = require('express-rate-limit');
var config = require('./config');
var db = require('./db');
var seedMod = require('./seed');
var logger = require('./logger');
var metrics = require('./metrics');
var pkg = require('../package.json');

var app = express();
app.set('trust proxy', 1); /* honour X-Forwarded-* from the hosting reverse proxy */

/* Request logging + metrics: time each response, emit a structured log line. */
app.use(function (req, res, next) {
  var start = Date.now();
  res.on('finish', function () {
    var ms = Date.now() - start;
    metrics.record(res.statusCode, ms);
    var quiet = (req.path === '/api/health' || req.path === '/api/metrics');
    var level = res.statusCode >= 500 ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');
    if (quiet) level = 'debug';
    logger[level]('http', { method: req.method, path: req.path, status: res.statusCode, ms: ms, uid: (req.user && req.user.uid) || null });
  });
  next();
});

/* Security headers (CSP allows the Chart.js CDN + inline style attributes we use). */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '25mb' }));

/* Throttle authentication to blunt brute-force/credential-stuffing. */
var authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts, please wait a few minutes.' } });
app.use('/api/auth/login', authLimiter);

/* API routes */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/base', require('./routes/base'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/quality', require('./routes/quality'));
app.use('/api/commission', require('./routes/commission'));
app.use('/api/clawback', require('./routes/clawback'));
app.use('/api/executive', require('./routes/executive'));
app.use('/api/serve', require('./routes/serve'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/admin', require('./routes/admin'));

/* Health: liveness + DB reachability, for load balancers / uptime monitors. */
app.get('/api/health', async function (req, res) {
  var repo = db.get();
  var dbUp = true;
  try { if (repo.ping) await repo.ping(); } catch (e) { dbUp = false; }
  res.status(dbUp ? 200 : 503).json({
    ok: dbUp, driver: repo.driver, db: dbUp ? 'up' : 'down',
    uptime: Math.floor((Date.now() - metrics.startedAt) / 1000), version: pkg.version
  });
});

/* Prometheus metrics. Protect with METRICS_TOKEN in production (scrape header/query). */
app.get('/api/metrics', function (req, res) {
  var token = process.env.METRICS_TOKEN;
  if (token) {
    var got = req.query.token || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (got !== token) return res.status(401).type('text/plain').send('unauthorized');
  }
  res.type('text/plain; version=0.0.4').send(metrics.prometheus());
});

/* Static front-end. HTML/JS/CSS revalidate via ETag (no-cache) so deploys are
 * picked up immediately; other assets may be cached briefly. */
app.use(express.static(path.join(__dirname, '..', 'public'), {
  etag: true,
  maxAge: '1h',
  setHeaders: function (res, p) {
    if (/\.(html|js|css)$/.test(p)) res.setHeader('Cache-Control', 'no-cache');
  }
}));
app.get('/', function (req, res) { res.sendFile(path.join(__dirname, '..', 'public', 'index.html')); });

/* Generic error handler - never leak internals to clients. */
app.use(function (err, req, res, next) {
  logger.error('unhandled', { err: err && err.message, stack: err && err.stack });
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

async function start() {
  var repo = db.get();
  await repo.init();
  if (config.dbDriver === 'mysql') {
    var applied = await require('./db/migrate').migrate(config.mysql);
    if (applied.length) logger.info('migrations_applied', { files: applied });
  }
  await seedMod.seed(repo);
  app.listen(config.port, function () {
    logger.info('server_started', { port: config.port, driver: repo.driver, version: pkg.version });
    console.log('IMANI SUPERDEALER running on http://localhost:' + config.port + ' (db: ' + repo.driver + ')');
  });
}

if (require.main === module) {
  start().catch(function (e) { console.error('Startup failed:', e); process.exit(1); });
}

module.exports = { app: app, start: start };
