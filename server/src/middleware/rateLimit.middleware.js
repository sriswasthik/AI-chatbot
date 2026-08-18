import rateLimit, {
  ipKeyGenerator,
} from "express-rate-limit";

/*
| Limits are env-tunable so they can be matched to a deployment's traffic
| (and raised in test runs, which legitimately make many auth requests from
| a single address). Defaults are the production values.
*/

const limitFrom = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : fallback;
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limitFrom(process.env.AUTH_RATE_LIMIT_MAX, 20),

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
  max: limitFrom(process.env.CHAT_RATE_LIMIT_MAX, 20),

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

/*
| Blanket ceiling for everything under /api.
*/

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limitFrom(process.env.API_RATE_LIMIT_MAX, 100),

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});
