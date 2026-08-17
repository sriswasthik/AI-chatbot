import rateLimit, {
  ipKeyGenerator,
} from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

/*
| Chat calls cost money and provider quota, so they get a tighter budget
| than the global /api limiter. Keyed per authenticated user rather than
| per IP, so users behind one NAT do not consume each other's allowance.
*/

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  /*
  | ipKeyGenerator normalises IPv6 so a user cannot sidestep the limit by
  | rotating through addresses in their own /64.
  */

  keyGenerator: (req, res) =>
    req.user?.id || ipKeyGenerator(req, res),

  message: {
    success: false,
    message:
      "Too many messages. Please slow down and try again shortly.",
  },
});
