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

const books = new Bruno();
books.get("/", async (context) => {
  context.send("List of books");
});

books.get<{ params: { id: string } }>("/:id", async (context) => {
  const bookId = context.req.params.id;
  context.send(`Book ID: ${bookId}`);
});

app.route("/books", books);

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Server is running on http://localhost:3000");

// export default app;
