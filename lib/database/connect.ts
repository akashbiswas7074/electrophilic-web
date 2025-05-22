import mongoose, { Mongoose } from "mongoose";

// Import the centralized model index to ensure all models are registered
import "./models";

// Use MONGODB_URI instead of MONGODB_URL to match .env.local
const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectToDatabase = async () => {
  try {
    if (cached.conn) return cached.conn;
    
    if (!MONGODB_URI) {
      console.error("No MongoDB URI found in environment variables");
      throw new Error(
        "Please define MONGODB_URI in your .env file"
      );
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        dbName: "vibecart",
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise on error
    
    if (error instanceof Error) {
      if (error.message.includes("bad auth")) {
        throw new Error("MongoDB authentication failed. Check your username and password.");
      }
      if (error.message.includes("ENOTFOUND")) {
        throw new Error("MongoDB host not found. Check your connection string.");
      }
    }
    
    throw error; // Re-throw the original error for other cases
  }
};
