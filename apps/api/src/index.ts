import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// --- WRAP ENTIRE STARTUP IN A TRY/CATCH BLOCK ---
// This will catch any synchronous error during initialization and log it.
try {
    console.log("Starting application...");

    // Import routes inside the try block in case they have initialization errors
    const uploadRoutes = require('./routes/upload').default;
    const extractRoutes = require('./routes/extract').default;
    const invoiceRoutes = require('./routes/invoices').default;

    dotenv.config();
    console.log("Environment variables loaded.");

    const app = express();
    // Render provides the PORT environment variable.
    const PORT = process.env.PORT || 3001;

    console.log("Configuring middleware...");
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
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    console.log("Middleware configured successfully.");

    console.log("Configuring routes...");
    // A simple root route for health checks
    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to the API!' });
    });

    // Routes
    app.use('/upload', uploadRoutes);
    app.use('/extract', extractRoutes);
    app.use('/invoices', invoiceRoutes);

    app.get('/health', (req, res) => {
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    console.log("Routes configured successfully.");

    // Error handling middleware should be last
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
    
    console.log(`Attempting to start server on port ${PORT}...`);
    app.listen(PORT, () => {
        console.log(`✅ API Server running and listening on port ${PORT}`);
    });

    // Note: The `export default app` is primarily for serverless environments like Vercel.
    // It's not strictly needed for Render but doesn't hurt to keep.
    module.exports = app;

} catch (error) {
    console.error("💥💥💥 FATAL STARTUP ERROR 💥💥💥");
    console.error(error);
    // Exit with a failure code to ensure Render logs the error
    process.exit(1);
}

