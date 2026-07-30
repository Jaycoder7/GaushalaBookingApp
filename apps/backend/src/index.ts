import './config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/connection';
import { HttpError } from './errors';
import adminRoutes from './routes/admin';
import bookingRoutes from './routes/bookings';
import slotRoutes from './routes/slots';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  res.status(statusCode).json({
    error: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: err instanceof HttpError ? err.code : 'INTERNAL_SERVER_ERROR',
    ...(err instanceof HttpError && err.details ? { details: err.details } : {}),
  });
});

// Start server
async function start() {
  try {
    await initializeDatabase();
    console.log('Database connected');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
