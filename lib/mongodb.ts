import { connectToDatabase } from './database/connect';

// Export the Mongoose connection function for compatibility
export const getDb = async () => {
  const connection = await connectToDatabase();
  return connection.connection.db;
};

// For compatibility with existing code that expects a client promise
export default connectToDatabase();
