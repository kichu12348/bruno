export type RouteGeneric = {
  params?: unknown;
  query?: unknown;
  body?: unknown;
  header?: unknown;
};

export type BrunoRequest<T extends RouteGeneric> = Request & {
  params: T["params"];
  query: T["query"];
  headers: T["header"];
  json: () => Promise<T["body"]>;
  text: () => Promise<string>;
};

export type BrunoResponse =
  | Response
  | Promise<Response | undefined | void | object | string>
  | undefined
  | void
  | object
  | string;

export interface BrunoContext<T extends RouteGeneric = RouteGeneric> {
  req: BrunoRequest<T>;
  send: (content: string, options?: { status: number }) => void;
  json: (data: any, options?: { status: number }) => void;
  status: (code: number) => void;
  headers: (newHeaders: Record<string, string>) => void;
}

export type RequestType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type Handler<T extends RouteGeneric = RouteGeneric> = (
  context: BrunoContext<T>,
  next?: () => BrunoResponse,
) => BrunoResponse;
