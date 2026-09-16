import express from "express";
import { userRouter } from "./api/users.js";

const app = express();
app.use(express.json());
app.use("/api/users", userRouter);

const port = Number(process.env.PORT) || 3000;

export { app };

app.listen(port, () => {
  console.log(`API on :${port}`);
});
