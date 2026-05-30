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
  // private compiledRouter?: (
  //   path: string,
  //   method: RequestType,
  // ) => { handler: Handler; params: Record<string, string> } | null;

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

  public route(prefix: string, instance: Bruno) {
    const node = this.routerTree.getNodeByPath(prefix);
    node.paramChild = instance.routerTree.root.paramChild;
    node.paramName = instance.routerTree.root.paramName;
    Object.assign(this.routerTree.handlerMap, instance.routerTree.handlerMap);
    Object.assign(node.handlers, instance.routerTree.root.handlers);
    Object.assign(node.handlerIds, instance.routerTree.root.handlerIds);

    for (const [key, value] of instance.routerTree.root.children.entries()) {
      node.children.set(key, value);
    }
    // what this does is essentially mount the entire router tree of the provided instance
    // onto the current instance at the specified prefix path. This allows for modular route
    // definitions and better organization of routes in larger applications.
  }

  fetch = async (req: BrunoRequest<RouteGeneric>): Promise<Response> => {
    const pathname = pathParser(req.url);

    const route = this.routerTree.findRoute(
      pathname,
      req.method as RequestType,
    );

    if (route) {
      const { handler, params } = route;
      req.params = params;

      const reply = await createReply(req, handler);

      return reply;
    }

    return new Response("Not Found", { status: 404 });
  };
}

const pathParser = (url: string) => {
  const pathStart = url.indexOf("/", 8);
  const queryStart = url.indexOf("?", pathStart);

  return queryStart === -1
    ? url.slice(pathStart)
    : url.slice(pathStart, queryStart);
};
