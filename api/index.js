// api/index.js  (Vercel serverless entry)
import app from "../server.js";

// Vercel's Node.js serverless runtime
export const config = { runtime: "nodejs" };

// Export the Express app directly. Vercel will adapt it.
export default app;
