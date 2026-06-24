import { Router } from "express";
import { readStore } from "../controllers/storeController.js";

export const storeRouter = Router();

storeRouter.get("/", readStore);
