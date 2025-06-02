import { MongoClient } from "mongodb";

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI || "";

// Set MongoDB client options
const options = {};

// MongoDB client setup
let client;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

if (process.env.NODE_ENV === "production") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect().then(async (client) => {
      // Force use of vibecart database
      await client.db("vibecart");
      return client;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri);
  clientPromise = client.connect().then(async (client) => {
    // Force use of vibecart database
    await client.db("vibecart");
    return client;
  });
}

// Helper function to get the correct database
export const getDb = async () => {
  const client = await clientPromise;
  return client.db("vibecart");
};

export default clientPromise;
