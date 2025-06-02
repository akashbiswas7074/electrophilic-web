// This file redirects to the main connect.ts implementation
// to maintain backwards compatibility with any code using connectDB

import { connectToDatabase } from "./connect";

export default connectToDatabase;