import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";

const createUser = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const userRouter = Router();

userRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

userRouter.post("/", async (req, res) => {
  const body = createUser.parse(req.body);
  const user = await prisma.user.create({ data: body });
  res.status(201).json(user);
});
