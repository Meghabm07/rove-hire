import "dotenv/config";
import cors from "cors";
import express from "express";
import { initDb } from "./db.js";
import { authRouter } from "./routes/authRoutes.js";
import { jobRouter } from "./routes/jobRoutes.js";
import { storeRouter } from "./routes/storeRoutes.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/auth", authRouter);
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
