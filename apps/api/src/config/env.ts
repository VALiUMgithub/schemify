import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define a strongly typed interface for our environment variables
interface Config {
  port: number;
  env: string;
  databaseUrl: string;
}

// Export a singleton configuration object
export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
};

if (!config.databaseUrl) {
  console.warn('⚠️ DATABASE_URL is not set in the environment variables!');
}
