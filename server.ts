import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/authRoutes';
import { userRouter } from './server/routes/userRoutes';
import { resumeRouter } from './server/routes/resumeRoutes';
import { jobDescRouter } from './server/routes/jobDescRoutes';
import { interviewRouter } from './server/routes/interviewRoutes';
import { aiRouter } from './server/routes/aiRoutes';
import { dashboardRouter } from './server/routes/dashboardRoutes';
import { mcqRouter } from './server/routes/mcqRoutes';
import { adminRouter } from './server/routes/adminRoutes';
import { candidateRouter } from './server/routes/candidateRoutes';
import { gamificationRouter } from './server/routes/gamificationRoutes';
import { paymentRouter } from './server/routes/paymentRoutes';
import { assessmentSecurityRouter } from './server/routes/assessmentSecurityRoutes';
import { swaggerDocument } from './server/swagger';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON and URL-encoded body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      platform: 'InterviewAI',
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Swagger Documentation JSON
  app.get('/api/docs/swagger.json', (_req, res) => {
    res.json(swaggerDocument);
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/resume', resumeRouter);
  app.use('/api/job-descriptions', jobDescRouter);
  app.use('/api/interviews', interviewRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/mcq', mcqRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/candidates', candidateRouter);
  app.use('/api/candidate', candidateRouter);
  app.use('/api/assessment', assessmentSecurityRouter);
  app.use('/api/assessments', assessmentSecurityRouter);
  app.use('/api', gamificationRouter);
  app.use('/api', paymentRouter);

  // Global API error handler
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({
      success: false,
      message: err?.message || 'An unexpected internal server error occurred.',
    });
  });

  // Frontend Serving (Vite dev mode vs Production build)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InterviewAI Server running on port ${PORT}`);
  });
}

startServer();