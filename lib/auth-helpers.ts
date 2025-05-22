import { connectToDatabase } from "./database/connect";
import User from "./database/models/user.model";
import jwt from "jsonwebtoken";

export async function findOrCreateUser(oauthUser: any) {
  await connectToDatabase();
  
  // Check if user exists by email
  let user = await User.findOne({ email: oauthUser.email });
  
  if (user) {
    // Update user information if needed
    if (!user.image && oauthUser.image) {
      user.image = oauthUser.image;
      await user.save();
    }
    return user;
  }
  
  // Create new user if not found
  user = await User.create({
    email: oauthUser.email,
    name: oauthUser.name || `User ${Date.now()}`,
    username: oauthUser.email.split('@')[0] + Date.now().toString().slice(-4),
    image: oauthUser.image || "",
  });
  
  return user;
}

/**
 * Sign a JWT token for authentication
 * @param userId User ID to include in the token
 * @returns Promise resolving to the signed JWT token string
 */
export async function signJwtToken(userId: string): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
  
  return token;
}
