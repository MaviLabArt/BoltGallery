import cors from "cors";

export function makeCors(origins = []) {
  return cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (origins.length === 0) return cb(null, origin);
      if (origins.includes(origin)) return cb(null, origin);
      return cb(null, origin); // permissive fallback
    },
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204
  });
}
