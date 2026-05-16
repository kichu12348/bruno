import type {
  BrunoRequest,
  RouteGeneric,
  Handler,
  BrunoContext,
} from "../types";

export async function createReply(
  request: BrunoRequest<RouteGeneric>,
  handler: Handler<RouteGeneric>,
): Promise<Response> {
  let body = "";
  let status = 200;
  const headers = {} as Record<string, string>;
  let sent = false;

  // json: () => req.json(),
  //     text: () => req.text(),
  //     get query() {
  //       const url = new URL(req.url);
  //       return Object.fromEntries(url.searchParams.entries());
  //     },

  request.json = () => request.json();
  request.text = () => request.text();
  request.query = () => {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams.entries());
  };

  const ctx: BrunoContext<RouteGeneric> = {
    req: request,
    send: (content, options) => {
      if (!sent) {
        body = content;
        status = options?.status ?? status;
        sent = true;
      }
    },
    json: (data, options) => {
      if (!sent) {
        body = JSON.stringify(data);
        headers["Content-Type"] = "application/json";
        status = options?.status ?? status;
        sent = true;
      }
    },
    status: (code: number) => {
      if (!sent) {
        headers["Status"] = code.toString();
      }
    },
    headers: (newHeaders: Record<string, string>) => {
      if (!sent) {
        for (const [key, value] of Object.entries(newHeaders)) {
          headers[key] = value;
        }
      }
    },
  };

  const result = await handler(ctx);

  if (sent) {
    return new Response(body, {
      status,
      headers: headers,
    });
  } else if (result instanceof Response) {
    return result;
  } else if (typeof result === "object" && result !== null) {
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify(result), {
      status,
      headers: headers,
    });
  } else if (typeof result === "string") {
    return new Response(result, {
      status,
      headers: headers,
    });
  }

  return new Response("Not Found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
