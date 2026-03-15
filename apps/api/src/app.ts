import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestLogger } from './middleware/request-logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import apiRoutes from './routes';

// Initialize the Express application
const app: Express = express();

// Apply Global Middleware
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(express.json()); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// Apply custom request logger
app.use(requestLogger);

// Mount main API routes
app.use('/api', apiRoutes);

// Apply Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

export default app;
