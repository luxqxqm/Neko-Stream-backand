import { app } from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';

export default async function handler(request, response) {
  // CORS preflight requests do not need a database connection.
  if (request.method === 'OPTIONS') {
    return app(request, response);
  }

  try {
    await connectDatabase();
    return app(request, response);
  } catch (error) {
    console.error('Database connection failed:', error);
    return response.status(503).json({ message: 'Database is temporarily unavailable.' });
  }
}
