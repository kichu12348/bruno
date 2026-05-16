import { Bruno } from "@core";

const app = new Bruno();

app.get("/hello", async (context) => {
  context.send("Hello, Bruno!");
});

app.get<{ params: { id: string } }>("/user/:id", async (context) => {
  const userId = context.req.params.id;
  context.send(`User ID: ${userId}`);
});

export default {
  port: 3000,
  fetch: app.fetch.bind(app),
};
