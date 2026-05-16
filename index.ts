import { Bruno } from "@core";

const app = new Bruno();

app.get("/hello", async (context) => {
  return new Response("Hello, Bruno!", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
});

app.get<{ params: { id: string } }>("/user/:id", async (context) => {
  const userId = context.req.params.id;
  return new Response(`User ID: ${userId}`, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
});

export default app;
