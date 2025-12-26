// import jwt from "jsonwebtoken";

// const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// export const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

//   if (!token) {
//     return res.status(401).json({ error: "Access token required" });
//   }

//   jwt.verify(token, SECRET_KEY, (err, user) => {
//     if (err) {
//       return res.status(403).json({ error: "Invalid or expired token" });
//     }
//     req.user = user;
//     next();
//   });
// };

import jwt from "jsonwebtoken";

/**
 * JWT secret must be provided via environment variables.
 * This prevents insecure fallbacks in production.
 */
const SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("❌ JWT_SECRET_KEY is not defined in environment variables");
}

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(500).json({ error: "Authentication failed" });
  }
};
