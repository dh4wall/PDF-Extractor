import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import uploadRoutes from './routes/upload';
import extractRoutes from './routes/extract';
import invoiceRoutes from './routes/invoices';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Good practice to have a fallback for local dev

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// --- TEMPORARY DEBUGGING STEP ---
// Allow all origins to see if CORS is the issue.
// Your original code was: app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cors());


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- FIX 1: ADD A ROOT ROUTE ---
// Vercel needs this to know what to do when someone visits the base URL.
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API! Use /health to check status.' });
});

// Routes
app.use('/upload', uploadRoutes);
app.use('/extract', extractRoutes);
app.use('/invoices', invoiceRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- FIX 2: ONLY LISTEN LOCALLY ---
// Vercel handles the listening part in production.
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 API Server running on port ${PORT}`);
    });
}

export default app;

