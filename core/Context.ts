import type { BrunoRequest, BrunoContext, RouteGeneric } from "./types";

export class BrunoContextImpl implements BrunoContext<RouteGeneric> {
  req: BrunoRequest<RouteGeneric>;

  body: string = "";
  statusCode: number = 200;
  responseHeaders: Record<string, string> = {};
  sent: boolean = false;

  constructor(request: BrunoRequest<RouteGeneric>) {
    this.req = request;

    // Fast, lazy-loaded query parsing.
    // It only parses if the user actually accesses `context.req.query`
    let parsedQuery: Record<string, string> | undefined;

    // We attach the getter to the request safely
    if (!this.req.query) {
      Object.defineProperty(this.req, "query", {
        get() {
          if (parsedQuery) return parsedQuery; // Return cached if already parsed

          parsedQuery = {};
          const queryStart = request.url.indexOf("?");
          if (queryStart !== -1) {
            // URLSearchParams is much faster than `new URL()`
            const searchParams = new URLSearchParams(
              request.url.slice(queryStart),
            );
            for (const [key, value] of searchParams) {
              parsedQuery[key] = value;
            }
          }
          return parsedQuery;
        },
      });
    }
  }

  send(content: string, options?: { status: number }) {
    if (!this.sent) {
      this.body = content;
      if (options?.status) this.statusCode = options.status;
      this.sent = true;
    }
  }

  json(data: any, options?: { status: number }) {
    if (!this.sent) {
      this.body = JSON.stringify(data);
      this.responseHeaders["Content-Type"] = "application/json";
      if (options?.status) this.statusCode = options.status;
      this.sent = true;
    }
  }

  status(code: number) {
    if (!this.sent) {
      this.statusCode = code;
    }
  }

  headers(newHeaders: Record<string, string>) {
    if (!this.sent) {
      // Fast object merging
      Object.assign(this.responseHeaders, newHeaders);
    }
  }
}
