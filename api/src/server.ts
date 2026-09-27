import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import comentarioRoutes from "./routes/comentarioRoutes";
import authRoutes from "./routes/authRoutes";
import zonaRoutes from "./routes/zonaRoutes";

const app = express();

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});
app.use(express.static("public"));

app.get("/api", (req, res) => {
  res.send("API de zonas de risco funcionando");
});

app.use(authRoutes);
app.use(comentarioRoutes);
app.use(zonaRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});