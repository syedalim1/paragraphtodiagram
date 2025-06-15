import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes (these will not be protected)
const isPublicRoute = createRouteMatcher([
  '/', // Allow access to the root page (e.g., for landing or redirect)
  '/sign-in(.*)',
  '/sign-up(.*)', // If you have a separate sign-up flow
  // Add other public routes like '/about', '/contact' if needed
]);

export default clerkMiddleware((auth, req) => {
  // If the route is public, allow access without protection.
  if (isPublicRoute(req)) {
    return; // Do not protect public routes
  }

  // For all other routes (i.e., not public), protect them.
  // This will cover routes matched by isProtectedRoute or any other non-public route.
  auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|static|favicon.ico|.*\\..*).*)',
    // Match all routes including the root
    '/',
  ],
};
