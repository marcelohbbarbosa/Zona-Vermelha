import express, { NextFunction, Request, Response } from "express";
import comentarioRoutes from "./routes/comentarioRoutes";

const app = express();

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

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

app.use(comentarioRoutes);

const port = 3000;

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
