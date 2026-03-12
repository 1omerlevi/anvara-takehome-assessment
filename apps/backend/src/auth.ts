import { type Request, type Response, type NextFunction } from 'express';
import { betterAuth } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Pool } from 'pg';
import { prisma } from './db.js';


// TODO: Add sponsorId and publisherId to the user interface
// These are needed to scope queries to the user's own data
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SPONSOR' | 'PUBLISHER';
    // FIXME: Missing sponsorId and publisherId fields
    sponsorId?: string;
    publisherId?: string;

  };
}

// TODO: This middleware doesn't actually validate anything!
// It should:
// 1. Check for Authorization header or session cookie
// 2. Validate the token/session
// 3. Look up the user in the database
// 4. Attach user info to req.user
// 5. Return 401 if invalid

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL environment variable is required');

const auth = betterAuth({
  database: new Pool({ connectionString }),
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-dev',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3847',
  emailAndPassword: { enabled: true, minPasswordLength: 6 },
  plugins: [],
  advanced: { disableCSRFCheck: true },
});


export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  // Better Auth will handle validation via headers
  // This is a placeholder for protected routes
  // Requirement 1: extract + validate session from request headers/cookies
  try {
  
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    // unauthenticated requests must return 401
    if (!session) return void res.status(401).json({ error: 'Not authenticated' });

    // Attach user identity + related sponsor/publisher ownership scope
    const sponsor = await prisma.sponsor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (sponsor) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: 'SPONSOR',
        sponsorId: sponsor.id,
      };
      return next();
    }

    //attach ownership context for publisher users
    const publisher = await prisma.publisher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (publisher) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: 'PUBLISHER',
        publisherId: publisher.id,
      };
      next();
      return;
    }

    // Authenticated but not allowed/usable context -> 403
    res.status(403).json({ error: 'No sponsor or publisher profile found for this user' });
  } catch {
    // Invalid/failed auth -> 401
    res.status(401).json({ error: 'Not authenticated' });
  }
}


export function roleMiddleware(allowedRoles: Array<'SPONSOR' | 'PUBLISHER'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
