// export { default } from "next-auth/middleware"
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Use withAuth to protect specific routes
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // console.log("Middleware token:", req.nextauth.token)
    // You could add role-based access control here if needed
    // e.g., if (!req.nextauth.token?.role === 'admin') return NextResponse.redirect(...)
    return NextResponse.next()
  },
  {
    callbacks: {
      // The authorized callback determines if a user is authorized to access a page.
      // If this returns true, the middleware function above is executed.
      // If false, the user is redirected to the sign-in page.
      authorized: ({ token }) => !!token, // User is authorized if they have a valid token
    },
    // Specify the login page, so users are redirected there if `authorized` returns false
    pages: {
      signIn: '/auth/signin', // Redirect unauthenticated users to this page
      error: '/auth/error', // Optional: Redirect errors here
    },
  }
)

// The matcher specifies which routes the middleware should run on.
export const config = {
  matcher: [
    // Apply middleware to these routes
    '/profile/:path*',
    '/checkout/:path*',
    '/order/:path*',
    '/orders/:path*',
    '/user-profile/:path*',
    '/payment/:path*', // Added payment route
    // Add any other routes that require authentication

    // Exclude specific routes if necessary, although the matcher above is usually sufficient
    // Example: Exclude public API routes if they were under a protected path
    // '/((?!api/public).*)', // This is generally not needed if API routes are separate
  ],
}

// Note: Arcjet middleware has been removed for simplicity in this example.
// If you need Arcjet, you would typically run it before or after the NextAuth middleware,
// potentially by exporting a main middleware function that calls both.