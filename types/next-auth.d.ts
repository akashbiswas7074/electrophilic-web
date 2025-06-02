import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier. */
      id: string;
      /** The user's username. */
      username?: string | null;
      /** The user's first name. */
      firstName?: string | null; // Added firstName
      /** The user's last name. */
      lastName?: string | null; // Added lastName
      /** The user's role (e.g., 'user', 'admin') */
      role?: string;
      /** The user's phone number */
      phone?: string | null; // Added phone
      /** The user's provider. */
      provider?: string;
      // image is already part of DefaultSession["user"]
    } & DefaultSession["user"]; // Extends the default session user type (includes name, email, image)
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    // DefaultUser already includes id, name, email, image
    /** The user's username. */
    username?: string | null;
    /** The user's first name. */
    firstName?: string | null; // Added firstName
    /** The user's last name. */
    lastName?: string | null; // Added lastName
    /** The user's role (e.g., 'user', 'admin') */
    role?: string;
    /** The user's phone number */
    phone?: string | null; // Added phone
    // Add any other custom fields your User model might have that you want on the User object
    // For example:
    // emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** OpenID ID Token */
    // idToken?: string; // DefaultJWT already has this
    /** User's unique identifier from your database */
    id?: string;
    /** User's username */
    username?: string | null;
    /** User's first name. */
    firstName?: string | null; // Added firstName
    /** User's last name. */
    lastName?: string | null; // Added lastName
    /** User's role (e.g., 'user', 'admin') */
    role?: string;
    /** User's phone number */
    phone?: string | null; // Added phone
    // picture is already part of DefaultJWT (used for image)
    // You can add it explicitly if you prefer `token.image` over `token.picture`
    // image?: string | null;
  }
}
