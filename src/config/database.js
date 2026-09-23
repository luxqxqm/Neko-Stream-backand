import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  mongoose.set('strictQuery', true);
  connectionPromise = mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    const connection = await connectionPromise;
    console.info('Connected to MongoDB');
    return connection;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  connectionPromise = undefined;
}
