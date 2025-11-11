import express from 'express';
import cors from 'cors';
import path from 'path';

// Import routes
import usersRouter from './routes/users';
import userRouter from './routes/user';
import profilesRouter from './routes/profiles';
import articlesRouter from './routes/articles';
import commentsRouter from './routes/comments';
import favoritesRouter from './routes/favorites';
import tagsRouter from './routes/tags';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RealWorld API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/user', userRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/articles/:slug/comments', commentsRouter);
app.use('/api/articles/:slug/favorite', favoritesRouter);
app.use('/api/tags', tagsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to RealWorld API',
    docs: 'See API_DOCUMENTATION.md for endpoint details',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 RealWorld API server listening on port ${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API base: http://localhost:${PORT}/api`);
});