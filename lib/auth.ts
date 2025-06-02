import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { NextAuthOptions, User as NextAuthUser } from "next-auth"; 
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb"; 
import { connectToDatabase } from "@/lib/database/connect";
import User, { IUser } from "@/lib/database/models/user.model"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  // Use the MongoDB adapter with the client promise
  adapter: MongoDBAdapter(clientPromise),

  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
       // Optional: Customize profile data if needed
       profile(profile) {
        // console.log("Google Profile:", profile);
        // You might need to map fields if Google profile structure changes
        return {
          id: profile.sub, // Use 'sub' as the unique ID
          firstName: profile.given_name, // Changed from name
          lastName: profile.family_name, // Added
          email: profile.email,
          image: profile.picture,
          // Add username generation if desired, e.g., from email or a default
          username: profile.email?.split('@')[0] || `user_${profile.sub.substring(0, 6)}`,
          // Ensure email_verified is handled if needed
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
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
            // Consider throwing a specific error or returning a specific code if you want to handle this differently on the frontend
            return null; // Not a credentials user
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
    async jwt({ token, user, account, profile, isNewUser }) {
      // On successful sign in, persist the user id, username, and image to the token
      if (user) { // user object is available after authorize or initial OAuth profile mapping
        token.id = user.id;
        token.username = user.username;
        token.firstName = user.firstName; // Added
        token.lastName = user.lastName; // Added
        if (user.email) { // Ensure email from user object is put into token.email
          token.email = user.email;
        }
        if (user.image) {
          token.picture = user.image; // Ensure image from user object is put into token.picture
        }
        // Add role from user object if available
        if ((user as any).role) {
          token.role = (user as any).role;
        }
      }
       // If signing in with Google, ensure user exists in DB or create/update
       // This part also updates token.picture from dbUser.image
       if (account?.provider === 'google' && profile) {
         try {
            await connectToDatabase();
            let dbUser = await User.findOne({ email: profile.email });
            if (!dbUser) {
                dbUser = await User.create({
                    // id: profile.sub, // Adapter handles ID generation primarily
                    firstName: (profile as any).given_name,
                    lastName: (profile as any).family_name,
                    email: profile.email,
                    image: (profile as any).picture, // Cast to any
                    username: profile.email?.split('@')[0] || `user_${(profile as any).sub?.substring(0, 6)}`,
                    provider: 'google',
                    emailVerified: (profile as any).email_verified ? new Date() : null,
                });
                console.log("New Google user created:", dbUser.email);
            } else {
                 if ((profile as any).picture && dbUser.image !== (profile as any).picture) { // Cast to any
                     dbUser.image = (profile as any).picture; // Cast to any
                     await dbUser.save();
                 }
                 // Ensure firstName and lastName are updated if they were missing or different
                 if ((profile as any).given_name && dbUser.firstName !== (profile as any).given_name) {
                    dbUser.firstName = (profile as any).given_name;
                 }
                 if ((profile as any).family_name && dbUser.lastName !== (profile as any).family_name) {
                    dbUser.lastName = (profile as any).family_name;
                 }
                 if (dbUser.isModified('firstName') || dbUser.isModified('lastName')) {
                    await dbUser.save();
                 }
            }
            token.id = dbUser._id.toString();
            token.username = dbUser.username;
            token.firstName = dbUser.firstName; // Added
            token.lastName = dbUser.lastName; // Added
            token.picture = dbUser.image; // Ensure token.picture is set from dbUser.image
            token.role = dbUser.role; // Add role to token for Google users
         } catch (error) {
             console.error("Error handling Google user in DB:", error);
         }
       }
      return token;
    },

    // Modify the session object
    async session({ session, token }) {
      // Send properties to the client, like user id, username, and image from the token
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.firstName = token.firstName as string; // Added
        session.user.lastName = token.lastName as string; // Added
        if (token.email) { // Explicitly set email from token
          session.user.email = token.email as string;
        }
        if (token.picture) {
          session.user.image = token.picture as string; // Pass image URL to session.user.image
        }
        // Add role from token to session
        if (token.role) {
          (session.user as any).role = token.role as string;
        }
        // Add phone to session
        if (token.phone) {
          (session.user as any).phone = token.phone as string;
        }
      }
      return session;
    },

     // Handle user creation/linking during OAuth sign-in via adapter
     // The adapter's createUser/linkAccount methods handle this.
     // You can add custom logic in the 'signIn' callback if needed.
     async signIn({ user, account, profile, email, credentials }) {
        if (account?.provider === 'credentials') {
            // For credentials, check if email is verified before allowing sign in
            await connectToDatabase();
            const dbUser = await User.findOne({ email: user.email });
            if (dbUser && !dbUser.emailVerified) {
                console.log(`Sign-in blocked for ${user.email}: Email not verified.`);
                // You could redirect to a specific page or return false to block sign-in
                // throw new Error("Email not verified"); // This shows a generic error page
                return '/auth/verify-email-notice'; // Redirect to a notice page
            }
        }
        // Allow sign-in for other providers or verified credential users
        if (account?.provider === "google") {
          return true; // Allow sign-in for Google
        }
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
