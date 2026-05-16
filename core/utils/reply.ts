import type {
  BrunoRequest,
  RouteGeneric,
  Handler,
  BrunoContext,
} from "../types";
import { BrunoContextImpl } from "../Context";

export async function createReply(
  request: BrunoRequest<RouteGeneric>,
  handler: Handler<RouteGeneric>,
): Promise<Response> {
  const ctx = new BrunoContextImpl(request);

  const result = await handler(ctx);

  if (ctx.sent) {
    return new Response(ctx.body, {
      status: ctx.statusCode,
      headers: ctx.responseHeaders,
    });
  } else if (result instanceof Response) {
    return result;
  } else if (typeof result === "object" && result !== null) {
    ctx.responseHeaders["Content-Type"] = "application/json";
    return new Response(JSON.stringify(result), {
      status: ctx.statusCode,
      headers: ctx.responseHeaders,
    });
  } else if (typeof result === "string") {
    return new Response(result, {
      status: ctx.statusCode,
      headers: ctx.responseHeaders,
    });
  }

  return new Response("Not Found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
