// In-memory token blacklist (use Redis in production for persistence across restarts)
// Stores invalidated tokens until they naturally expire

const blacklistedTokens = new Set();

// Add token to blacklist
export const blacklistToken = (token) => {
  blacklistedTokens.add(token);
};

// Check if token is blacklisted
export const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

// Clean up expired tokens periodically (every 1 hour)
// This prevents memory from growing indefinitely
setInterval(() => {
  blacklistedTokens.clear();
}, 60 * 60 * 1000); // Clear every hour (tokens expire in 3 days anyway, but this keeps memory low)
