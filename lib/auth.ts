import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import type { Adapter } from "next-auth/adapters"; 
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/database/connect";
import User, { IUser } from "@/lib/database/models/user.model"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define extended User type that includes our custom properties
interface ExtendedUser extends NextAuthUser {
  firstName?: string;
  lastName?: string;
  username?: string;
  provider?: string;
  role?: string;
  phone?: string;
  [key: string]: any; // Allow for other properties
}

// Define Google OAuth profile type with specific Google fields
interface GoogleProfile {
  iss?: string;
  azp?: string;
  aud?: string;
  sub: string;
  email: string;
  email_verified?: boolean;
  at_hash?: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  iat?: number;
  exp?: number;
  [key: string]: any; // Allow for other properties
}

// Define type for user data
interface AdapterUser {
  email: string;
  emailVerified?: Date | null;
  [key: string]: any; // Allow for other properties
}

// Custom Mongoose adapter that uses our existing models
const customMongooseAdapter = (): Adapter => {
  return {
    async createUser(data: any) {
      console.log("[Auth] Creating user in vibecart database:", data.email);
      
      await connectToDatabase();
      
      // Ensure provider field is set when creating users through adapter
      if (!data.provider) {
        // Default to 'google' if there's no provider but we have a picture (likely from Google OAuth)
        if (data.image) {
          data.provider = 'google';
        } else {
          data.provider = 'credentials';
        }
      }
      
      // Ensure emailVerified is set for Google users
      if (data.provider === 'google' && !data.emailVerified) {
        data.emailVerified = new Date();
        console.log(`[Auth] Auto-set emailVerified for Google user: ${data.email}`);
      }
      
      const user = await User.create({
        firstName: data.firstName || data.name?.split(' ')[0] || '',
        lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
        email: data.email,
        image: data.image,
        username: data.username || data.email?.split('@')[0],
        provider: data.provider,
        emailVerified: data.emailVerified,
        role: data.role || 'user'
      });
      
      return {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
        name: `${user.firstName} ${user.lastName}`.trim(),
        image: user.image
      };
    },
    
    async getUser(id: string) {
      await connectToDatabase();
      const user = await User.findById(id);
      if (!user) return null;
      
      return {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
        name: `${user.firstName} ${user.lastName}`.trim(),
        image: user.image
      };
    },
    
    async getUserByEmail(email: string) {
      await connectToDatabase();
      const user = await User.findOne({ email });
      if (!user) return null;
      
      return {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
        name: `${user.firstName} ${user.lastName}`.trim(),
        image: user.image
      };
    },
    
    async getUserByAccount({ providerAccountId, provider }) {
      await connectToDatabase();
      // For simplicity, we'll find by email since we don't have separate account linking
      // In a full implementation, you'd have a separate accounts collection
      const user = await User.findOne({ provider });
      if (!user) return null;
      
      return {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
        name: `${user.firstName} ${user.lastName}`.trim(),
        image: user.image
      };
    },
    
    async updateUser(user: any) {
      await connectToDatabase();
      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        {
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          firstName: user.name?.split(' ')[0],
          lastName: user.name?.split(' ').slice(1).join(' ')
        },
        { new: true }
      );
      
      if (!updatedUser) throw new Error('User not found');
      
      return {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        image: updatedUser.image
      };
    },
    
    async linkAccount(account: any) {
      // For simplicity, we're not implementing account linking
      // In a full implementation, you'd store this in a separate accounts collection
      return account;
    },
    
    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      // For simplicity, we're not implementing account unlinking
    },
    
    async createSession(session: any) {
      // We're using JWT sessions, so this won't be called
      return session;
    },
    
    async updateSession(session: any) {
      // We're using JWT sessions, so this won't be called
      return session;
    },
    
    async deleteSession(sessionToken: string) {
      // We're using JWT sessions, so this won't be called
    },
    
    async createVerificationToken(verificationToken: any) {
      // For email verification - could be implemented if needed
      return verificationToken;
    },
    
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      // For email verification - could be implemented if needed
      return null;
    }
  };
};

export const authOptions: NextAuthOptions = {
  // Use our custom Mongoose adapter
  adapter: customMongooseAdapter(),

  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile: GoogleProfile) {
        // Ensure provider is set in user object with additional fields
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name,
          lastName: profile.family_name,
          provider: 'google', // Always explicitly set provider to 'google'
          emailVerified: new Date(), // Mark email as verified for Google users
          role: 'user', // Set default role for Google users
          updatedAt: new Date() // Set update date
        }
      },
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "text" }, // Added phone
        phoneToken: { label: "Phone Token", type: "text" } // Added phoneToken
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        console.log("--- Email/Password Authorize Attempt ---");
        
        // Phone authentication with token
        if (credentials?.phoneToken && credentials?.phone) {
          console.log(`[Auth] Phone authentication attempt with token for phone: ${credentials.phone}`);
          
          try {
            // Verify the JWT token
            if (!process.env.JWT_SECRET) {
              console.error("[Auth Error] JWT_SECRET is not configured");
              return null;
            }
            
            const decoded = jwt.verify(credentials.phoneToken, process.env.JWT_SECRET) as { id: string };
            
            if (!decoded || !decoded.id) {
              console.error("[Auth Error] Invalid phone token");
              return null;
            }
            
            // Get user by ID from token
            await connectToDatabase();
            const user = await User.findById(decoded.id);
            
            if (!user) {
              console.error(`[Auth Error] User not found for phone token ID: ${decoded.id}`);
              return null;
            }
            
            // Verify phone number matches token user
            if (user.phone !== credentials.phone) {
              console.error(`[Auth Error] Phone number mismatch: ${credentials.phone} vs ${user.phone}`);
              return null;
            }
            
            console.log(`[Auth] Phone authentication successful for user: ${user._id}`);
            
            return {
              id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              username: user.username,
              image: user.image,
              role: user.role,
            };
          } catch (error) {
            console.error("[Auth Error] Phone token verification failed:", error);
            return null;
          }
        }
        
        // Regular email/password authentication
        if (!credentials?.email || !credentials.password) {
          console.error("[Auth Error] Credentials missing");
          return null;
        }

        console.log(`[Auth] Attempting authorization for: ${credentials.email}`);

        try {
          await connectToDatabase();
          console.log("[Auth] Database connected.");

          // Find user by email, explicitly select password
          const user = await User.findOne({ email: credentials.email })
            .select("+password emailVerified provider name image username firstName lastName _id role") // Added role here
            .lean<IUser | null>(); // Use lean with explicit type

          if (!user) {
            console.warn(`[Auth Warn] No user found with email: ${credentials.email}`);
            return null; // User not found
          }

          console.log(`[Auth] User found: ${user.email}, Provider: ${user.provider}`);

          // Check if user uses credentials provider and has a password
          if (user.provider !== 'credentials') {
            console.warn(`[Auth Warn] User ${user.email} uses provider '${user.provider}', not 'credentials'.`);
            // Return specific error for each provider to guide users to the correct sign-in method
            if (user.provider === 'google') {
              throw new Error("UseGoogleLogin"); // Custom error to direct users to Google login
            } else if (user.provider === 'phone') {
              throw new Error("UsePhoneLogin"); // Custom error to direct users to phone login
            }
            return null; // Not a credentials user with unknown provider
          }

          if (!user.password) {
            console.error(`[Auth Error] User ${user.email} is 'credentials' provider but has no password hash stored.`);
            return null; // Password missing in DB
          }

          console.log(`[Auth] User ${user.email} has a password hash. Comparing passwords...`);

          // Compare passwords
          let passwordMatch = false;
          try {
            passwordMatch = await bcrypt.compare(
              credentials.password, // Plain text password from form
              user.password       // Hashed password from DB
            );
          } catch (compareError) {
            console.error(`[Auth Error] bcrypt.compare failed for ${user.email}:`, compareError);
            return null; // Error during comparison
          }

          if (!passwordMatch) {
            console.warn(`[Auth Warn] Password mismatch for: ${credentials.email}`);
            return null; // Passwords don't match
          }

          console.log(`[Auth Success] Passwords match for: ${credentials.email}`);

          // Optional: Check for email verification *here* if you want to block login before the signIn callback
          // if (!user.emailVerified) {
          //   console.warn(`[Auth Warn] Email not verified for: ${credentials.email}. Blocking login.`);
          //   // throw new Error("EMAIL_NOT_VERIFIED"); // Throwing here leads to generic error page
          //   return null; // Returning null gives the "Invalid credentials" error
          // }

          console.log(`[Auth] Credentials authorized for: ${credentials.email}`);

          // Return the user object in the format NextAuth expects
          return {
            id: (user._id as { toString: () => string }).toString(), // Assert type of user._id
            firstName: user.firstName, // Changed from name
            lastName: user.lastName, // Added
            email: user.email,
            image: user.image,
            username: user.username,
            role: user.role, // Add role to the returned user object
            // emailVerified: user.emailVerified, // Include if needed in token/session
          };

        } catch (error) {
          console.error("[Auth Fatal] Error during authorization process:", error);
          return null; // Catch any other errors
        }
      }
    }),
    // Phone authentication provider
    CredentialsProvider({
      id: "phone",
      name: "Phone",
      credentials: {
        phone: { label: "Phone Number", type: "text" },
        code: { label: "Verification Code", type: "text" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        console.log("--- Phone OTP Authorize Attempt ---");
        
        if (!credentials?.phone || !credentials?.code) {
          console.error("[Auth Error] Phone or verification code missing");
          return null;
        }
        
        console.log(`[Auth] Phone OTP authentication attempt for: ${credentials.phone}`);
        
        try {
          // Connect to the database
          await connectToDatabase();
          
          // Find user by phone
          const user = await User.findOne({ phone: credentials.phone })
            .select("+phoneOTP +phoneOTPExpires");
          
          if (!user) {
            console.warn(`[Auth Warn] No user found with phone: ${credentials.phone}`);
            return null;
          }
          
          // Check if OTP fields exist
          if (!user.phoneOTP || !user.phoneOTPExpires) {
            console.error(`[Auth Error] No OTP set for phone: ${credentials.phone}`);
            return null;
          }
          
          // Check if OTP has expired
          if (user.phoneOTPExpires < new Date()) {
            console.error(`[Auth Error] OTP expired for phone: ${credentials.phone}`);
            return null;
          }
          
          // Verify OTP
          const isValidOTP = await bcrypt.compare(credentials.code, user.phoneOTP);
          
          if (!isValidOTP) {
            console.warn(`[Auth Warn] Invalid OTP for phone: ${credentials.phone}`);
            return null;
          }
          
          // Clear OTP fields after successful verification
          user.phoneOTP = undefined;
          user.phoneOTPExpires = undefined;
          
          // Mark phone as verified
          user.phoneVerified = new Date();
          
          await user.save();
          
          console.log(`[Auth] Phone OTP authentication successful for user: ${user._id}`);
          
          // Return user data for token
          return {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            image: user.image,
            role: user.role,
            phone: user.phone,
          };
          
        } catch (error) {
          console.error("[Auth Error] Error during phone OTP verification:", error);
          return null;
        }
      }
    }),
  ],

  // Use JWT strategy for sessions
  session: {
    strategy: "jwt",
    // maxAge: 30 * 24 * 60 * 60, // 30 days (optional)
    // updateAge: 24 * 60 * 60, // 24 hours (optional)
  },

  // Callbacks for JWT and session handling
  callbacks: {
        // Modify the JWT token
        async jwt ({ token, user, account, profile, isNewUser }) {
            // On successful sign in, persist the user id, username, and image to the token
            if (user) {
                // Cast user to our ExtendedUser type to access custom properties
                const extendedUser = user as ExtendedUser;
                
                token.id = extendedUser.id;
                token.username = extendedUser.username;
                token.firstName = extendedUser.firstName; // Added
                token.lastName = extendedUser.lastName; // Added
                token.provider = extendedUser.provider || account?.provider || 'default';
                if (extendedUser.email) {
                    token.email = extendedUser.email;
                }
                if (extendedUser.image) {
                    token.picture = extendedUser.image; // Ensure image from user object is put into token.picture
                }
                // Add role from user object if available
                if (extendedUser.role) {
                    token.role = extendedUser.role;
                }
                // Add phone to token if available
                if (extendedUser.phone) {
                    token.phone = extendedUser.phone;
                }
            }
            
            // If signing in with Google, ensure user exists in DB or create/update with proper error handling
            if (account?.provider === 'google' && profile) {
                try {
                    await connectToDatabase();
                    
                    // Cast profile to GoogleProfile type
                    const googleProfile = profile as GoogleProfile;
                    
                    // Use email from profile if available or from token as fallback
                    const email = googleProfile.email || token.email;
                    if (!email) {
                        console.error("No email found in Google profile or token");
                        return token;
                    }
                    
                    let dbUser = await User.findOne({ email });
                    
                    if (!dbUser) {
                        // Create new user with Google profile data
                        try {
                            dbUser = await User.create({
                                firstName: googleProfile.given_name || googleProfile.name?.split(' ')[0] || 'Google',
                                lastName: googleProfile.family_name || googleProfile.name?.split(' ').slice(1).join(' ') || 'User',
                                email: email,
                                image: googleProfile.picture || null,
                                username: email.split('@')[0] || `user_${Date.now().toString().substring(0, 6)}`,
                                provider: 'google',
                                emailVerified: new Date(), // Google emails are verified
                                role: 'user', // Default role
                                updatedAt: new Date(), // Set update date
                                createdAt: new Date() // Set creation date
                            });
                            console.log("New Google user created:", email);
                        } catch (createError) {
                            console.error("Error creating Google user:", createError);
                            // Return token without modifications if user creation fails
                            return token;
                        }
                    } else {
                        // Update existing user with any new Google profile data
                        let isModified = false;
                        
                        if (googleProfile.picture && dbUser.image !== googleProfile.picture) {
                            dbUser.image = googleProfile.picture;
                            isModified = true;
                        }
                        
                        // Ensure firstName and lastName are updated if they were missing or different
                        if (googleProfile.given_name && dbUser.firstName !== googleProfile.given_name) {
                            dbUser.firstName = googleProfile.given_name;
                            isModified = true;
                        }
                        
                        if (googleProfile.family_name && dbUser.lastName !== googleProfile.family_name) {
                            dbUser.lastName = googleProfile.family_name;
                            isModified = true;
                        }
                        
                        // Only update provider if it's not set (null/undefined)
                        if (!dbUser.provider) {
                            dbUser.provider = 'google';
                            isModified = true;
                            console.log(`Set provider for user ${dbUser.email} to google (was unset)`);
                        }
                        
                        // Ensure email is verified for Google users
                        if (!dbUser.emailVerified) {
                            dbUser.emailVerified = new Date();
                            isModified = true;
                        }
                        
                        // Ensure role is set for Google users
                        if (!dbUser.role) {
                          dbUser.role = 'user';
                          isModified = true;
                        }
                        
                        // Always update the updatedAt timestamp for Google users on sign-in
                        dbUser.updatedAt = new Date();
                        isModified = true;
                        
                        // Save if anything changed
                        if (isModified) {
                            try {
                                await dbUser.save();
                                console.log(`Updated Google user data for: ${dbUser.email}`);
                            } catch (saveError) {
                                console.error(`Error saving Google user updates:`, saveError);
                            }
                        }
                    }
                    
                    // Ensure token has all the latest user information
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.username = dbUser.username || email.split('@')[0];
                        token.firstName = dbUser.firstName || googleProfile.given_name || 'Google';
                        token.lastName = dbUser.lastName || googleProfile.family_name || 'User';
                        token.picture = dbUser.image || googleProfile.picture;
                        // Always ensure the role is preserved from the database
                        token.role = dbUser.role || 'user';
                        // Preserve the original provider in the token, don't force it to 'google'
                        token.provider = dbUser.provider || 'google';
                        token.email = dbUser.email || email;
                    }
                } catch (error) {
                    console.error("Error handling Google user in DB:", error);
                    // Return token without modifications if DB operations fail
                }
            }
            
            return token;
        },

    // Modify the session object
    async session({ session, token }) {
      // Send properties to the client, like user id, username, and image from the token
      if (token && session.user) {
        // Ensure we never assign undefined values to the session
        session.user.id = token.id || '';
        session.user.username = token.username || '';
        session.user.firstName = token.firstName || '';
        session.user.lastName = token.lastName || '';
        session.user.provider = token.provider as string || 'default';
        
        // Ensure email and image are passed through
        if (token.email) {
          session.user.email = token.email;
        }
        if (token.picture) {
          session.user.image = token.picture;
        }
        // Add role from token to session
        if (token.role) {
          session.user.role = token.role;
        }
        // Add phone to session
        if (token.phone) {
          session.user.phone = token.phone;
        }
      }
      return session;
    },

     // Handle user creation/linking during OAuth sign-in via adapter
     async signIn({ user, account, profile, email, credentials }) {
        // Handle credentials provider (email/password) sign in
        if (account?.provider === 'credentials') {
            try {
                await connectToDatabase();
                
                // Check if user exists but uses a different provider (e.g., Google)
                const dbUser = await User.findOne({ email: user.email });
                
                // If user exists but with Google provider, return special URL to trigger redirect
                if (dbUser && dbUser.provider === 'google') {
                    console.log(`User ${user.email} exists with Google provider. Triggering redirect.`);
                    // This will be caught by the client to redirect to Google sign-in
                    return '/auth/signin?trigger=google';
                }
                
                // Original email verification logic
                if (dbUser && !dbUser.emailVerified) {
                    console.log(`Sign-in blocked for ${user.email}: Email not verified.`);
                    return '/auth/verify-email-notice';
                }
            } catch (error) {
                console.error("Error in credentials sign-in flow:", error);
                // Continue with sign-in despite errors to avoid blocking users
                return true;
            }
        }
        
        // Handle Google provider sign-in
        if (account?.provider === "google") {
          try {
            await connectToDatabase();
            
            // Cast profile to GoogleProfile type
            const googleProfile = profile as GoogleProfile;
            
            // Use email from profile to find user
            const email = googleProfile?.email || user.email;
            if (!email) {
              console.error("No email available from Google authentication");
              return true; // Continue but log the error
            }
            
            // Check if user with this email already exists
            let existingUser = await User.findOne({ email });
            
            if (existingUser) {
              console.log(`Google login: User ${email} already exists in DB with provider: ${existingUser.provider}`);
              
              // Instead of changing provider, allow login with Google for any user with this email
              // Just update Google-specific profile data without changing the provider
              let isModified = false;
              
              // Update profile picture if it's from Google and different
              if (googleProfile.picture && existingUser.image !== googleProfile.picture) {
                existingUser.image = googleProfile.picture;
                isModified = true;
              }
              
              // Update name details if available from Google
              if (googleProfile.given_name && (!existingUser.firstName || existingUser.firstName !== googleProfile.given_name)) {
                existingUser.firstName = googleProfile.given_name;
                isModified = true;
              }
              
              if (googleProfile.family_name && (!existingUser.lastName || existingUser.lastName !== googleProfile.family_name)) {
                existingUser.lastName = googleProfile.family_name;
                isModified = true;
              }
              
              // Ensure email is verified regardless of provider
              if (!existingUser.emailVerified) {
                existingUser.emailVerified = new Date();
                isModified = true;
              }
              
              // Ensure role is set but don't overwrite existing role
              if (!existingUser.role) {
                existingUser.role = 'user';
                isModified = true;
              }
              
              // Save if anything changed
              if (isModified) {
                try {
                  await existingUser.save();
                  console.log(`Successfully updated user data for ${email} via Google login`);
                } catch (updateError) {
                  console.error(`Failed to update user ${email} data:`, updateError);
                  // Continue with sign-in despite the error
                }
              }
            } else {
              // New user will be created with Google provider
              console.log(`Google login: New user ${email} will be created with provider 'google'`);
              // Provider is set in the profile method but we log it here for clarity
            }
            
            return true;
          } catch (error) {
            console.error("Error in Google sign-in flow:", error);
            return true; // Continue with sign-in despite errors to avoid blocking users
          }
        }
        
        // Phone authentication or any other provider
        return true;
     },

     async redirect({ url, baseUrl }) {
        if (url.startsWith(baseUrl + "/api/auth/callback")) {
          return `${baseUrl}/profile`;
        }
        if (url === baseUrl || url === `${baseUrl}/`) {
          return `${baseUrl}/profile`;
        }
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;

        return baseUrl;
     },
  },

  // Custom pages for authentication flow
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    signOut: '/auth/signout', // Optional custom sign-out page
    error: '/auth/error', // Error page (e.g., OAuth errors)
    // verifyRequest: '/auth/verify-request', // Page shown after email verification link is sent (optional)
    newUser: '/auth/signup', // Redirect new OAuth users here if needed (can be null)
  },

  // Secret for signing JWTs, session cookies, etc.
  // Ensure this is set in your .env file
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
};
