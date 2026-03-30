// middlewares/rateLimiter.js
import rateLimit from "express-rate-limit";

// for auth routes
export const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
// for normal API routes
export const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
//for heavy routes like AI and logs
export const heavyLimiter = rateLimit({ windowMs: 60*1000, max: 10 });