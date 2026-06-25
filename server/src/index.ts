import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { initDb } from "./db.js";
import { authRouter } from "./routes/authRoutes.js";
import { candidateRouter } from "./routes/candidateRoutes.js";
import { interviewRouter } from "./routes/interviewRoutes.js";
import { jobRouter } from "./routes/jobRoutes.js";
import { storeRouter } from "./routes/storeRoutes.js";
import { uploadDir } from "./storage.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use("/files", express.static(path.resolve(uploadDir)));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/candidates", candidateRouter);
app.use("/api/interviews", interviewRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/store", storeRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: "Unexpected server error." });
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`ROVE Hire API listening on ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
