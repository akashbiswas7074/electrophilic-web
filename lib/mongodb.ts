import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "";
// Fix: Use the correct property structure for MongoDB connection options
const options: MongoClientOptions = {
  // The dbName needs to be specified in the URI for older MongoDB driver versions
};

// Create a client with the database name specified in the URI
const getMongoClient = () => {
  // Append database name to URI if not already present
  const dbUri = uri.includes('?') 
    ? `${uri}&dbName=vibecart` 
    : `${uri}?dbName=vibecart`;
  
  return new MongoClient(dbUri, options);
};

let client;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = getMongoClient();
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = getMongoClient();
  clientPromise = client.connect();
}

export default clientPromise;
