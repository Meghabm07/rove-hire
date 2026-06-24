import { Router } from "express";
import { readSession, signIn, signOut } from "../controllers/authController.js";

export const authRouter = Router();

authRouter.post("/sign-in", signIn);
authRouter.get("/session", readSession);
authRouter.post("/sign-out", signOut);
