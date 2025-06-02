import { MongoClient } from "mongodb";

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI || "";

// Parse the database name from the URI or default to "vibecart"
function getDatabaseName(uri: string): string {
  try {
    // Try to extract database name from URI
    const matches = uri.match(/\/([^/?]+)(\?|$)/);
    if (matches && matches[1] && matches[1] !== 'admin') {
      return matches[1];
    }
  } catch (error) {
    console.error("Error parsing database name from URI:", error);
  }
  return "vibecart";
}

// Set MongoDB client options
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

// Modify the URI to explicitly include the database name
const modifiedUri = uri.includes('vibecart') ? uri : uri.replace(/\/([^/?]+)(\?|$)/, '/vibecart$2');

// Log the database being used for debugging
console.log(`[MongoDB] Using connection: ${modifiedUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

// MongoDB client setup
let client;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(modifiedUri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(modifiedUri);
  clientPromise = client.connect();
}

export default clientPromise;
