import { Bruno } from "./core/bruno";

const app = new Bruno();

app.get("/", async (context) => {
  context.send("Welcome to Bruno!");
});

app.get("/hello", async (context) => {
  context.send("Hello, Bruno!");
});

app.get<{ params: { id: string } }>("/user/:id", async (context) => {
  const userId = context.req.params.id;
  context.send(`User ID: ${userId}`);
});

export default app;
