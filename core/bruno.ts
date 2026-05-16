import { RouterTree } from "./router";
import { createReply } from "./utils/reply";
import type {
  RequestType,
  Handler,
  BrunoRequest,
  RouteGeneric,
  BrunoContext,
  BrunoResponse,
} from "./types";

export class Bruno {
  routerTree: RouterTree;

  constructor() {
    this.routerTree = new RouterTree();
  }

  private registerRoute(method: RequestType, path: string, handler: Handler) {
    this.routerTree.addRoute(path, method, handler);
  }

  private buildHandlerWithMiddlewares<T extends RouteGeneric>(
    handlers: Handler<T>[],
  ) {
    let composedHandler: Handler<T> = async (context: BrunoContext<T>) =>
      undefined;
    for (let i = handlers.length - 1; i >= 0; i--) {
      const currentHandler = handlers[i];
      if (currentHandler) {
        const nextHandler = composedHandler;
        composedHandler = async (context: BrunoContext<T>) => {
          return await currentHandler(
            context,
            () => nextHandler(context, undefined) as BrunoResponse,
          );
        };
      }
    }
    return composedHandler as Handler<RouteGeneric>;
  }

  public get<T extends RouteGeneric = RouteGeneric>(
    path: string,
    ...handlers: Handler<T>[]
  ) {
    const finalHandler = this.buildHandlerWithMiddlewares(handlers);
    this.registerRoute("GET", path, finalHandler);
  }

  public post<T extends RouteGeneric = RouteGeneric>(
    path: string,
    ...handlers: Handler<T>[]
  ) {
    const finalHandler = this.buildHandlerWithMiddlewares(handlers);
    this.registerRoute("POST", path, finalHandler);
  }

  public put<T extends RouteGeneric = RouteGeneric>(
    path: string,
    ...handlers: Handler<T>[]
  ) {
    const finalHandler = this.buildHandlerWithMiddlewares(handlers);
    this.registerRoute("PUT", path, finalHandler);
  }

  public delete<T extends RouteGeneric = RouteGeneric>(
    path: string,
    ...handlers: Handler<T>[]
  ) {
    const finalHandler = this.buildHandlerWithMiddlewares(handlers);
    this.registerRoute("DELETE", path, finalHandler);
  }

  public patch<T extends RouteGeneric = RouteGeneric>(
    path: string,
    ...handlers: Handler<T>[]
  ) {
    const finalHandler = this.buildHandlerWithMiddlewares(handlers);
    this.registerRoute("PATCH", path, finalHandler);
  }

  async fetch(req: BrunoRequest<RouteGeneric>): Promise<Response> {
    const url = new URL(req.url);

    const route = this.routerTree.findRoute(
      url.pathname,
      req.method as RequestType,
    );
    if (route) {
      const { handler, params } = route;
      req.params = params;

      const reply = await createReply(req, handler);

      return reply;
    }

    return new Response("Not Found", { status: 404 });
  }
}
