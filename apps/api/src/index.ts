import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import reminderRoutes from './routes/reminders';
import storyRoutes from './routes/stories';
import deviceRoutes from './routes/devices';
import reportRoutes from './routes/reports';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/patients', reminderRoutes); // nested: /patients/:patientId/reminders
app.use('/api/v1/stories', storyRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/patients', reportRoutes); // nested: /patients/:patientId/reports

// Error handling
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`API server running on port ${env.port}`);
});

export default app;
