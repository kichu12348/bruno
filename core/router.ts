import type { RequestType, Handler, RouteGeneric } from "./types";

class RouterNode {
  children: Map<string, RouterNode>;
  params: Record<string, string>;
  handlers: {
    [method in RequestType]?: Handler<RouteGeneric>;
  };

  paramChild: RouterNode | null;
  paramName: string | null;

  constructor() {
    this.children = new Map();
    this.params = {};
    this.handlers = {};
    this.paramChild = null;
    this.paramName = null;
  }
}

export class RouterTree {
  root: RouterNode;

  constructor() {
    this.root = new RouterNode();
  }

  addRoute(path: string, method: RequestType, handler: Handler) {
    const segments = path.split("/").filter(Boolean);
    let currentNode = this.root;
    for (const segment of segments) {
      if (segment.startsWith(":")) {
        if (!currentNode.paramChild) {
          const newNode = new RouterNode();
          currentNode.paramChild = newNode;
          currentNode.paramName = segment.slice(1);
        }
        currentNode = currentNode.paramChild;
      } else {
        if (!currentNode.children.has(segment)) {
          currentNode.children.set(segment, new RouterNode());
        }
        currentNode = currentNode.children.get(segment)!;
      }
    }
    currentNode.handlers[method] = handler;
  }

  findRoute(
    path: string,
    method: RequestType,
  ): {
    handler: Handler;
    params: Record<string, string>;
  } | null {
    let start = 0;
    let currentNode = this.root;
    let params: Record<string, string> | null = null;

    for (let i = 0; i <= path.length; i++) {
      if (path.charCodeAt(i) === 47 || i === path.length) {
        const segment = path.slice(start, i);
        start = i + 1;

        const child = currentNode.children.get(segment);
        if (child) {
          currentNode = child;
        } else if (currentNode.paramChild) {
          params ??= params || {};
          params[currentNode.paramName!] = segment;
          currentNode = currentNode.paramChild;
        } else {
          return null;
        }
      }
    }

    const handler = currentNode.handlers[method];
    if (!handler) {
      throw new Error(`No handler found for method ${method} at path ${path}`);
    }

    return { handler: handler, params: params ?? {} };
  }

  buildCode(): string {
    let code = `export const f = (p: string, method: RequestType) => {\n`;

    const rootMethods = Object.keys(this.root.handlers) as RequestType[];
    if (rootMethods.length > 0) {
      code += `  if (p === "/" || p === "") {\n`;
      for (const method of rootMethods) {
        code += `    if (method === "${method}") return { handler: ${this.root.handlers[method]}, params: {} };\n`;
      }
      code += `  }\n`;
    }

    code += `  const segments = p.split("/").filter(Boolean);\n`;
    code += `  const params: Record<string, string> = {};\n`;
    code += `  const len = segments.length;\n\n`;

    const buildNodeCode = (node: RouterNode, depth: number): string => {
      let nodeCode = "";
      const indent = "  ".repeat(depth + 1);

      const nodeMethods = Object.keys(node.handlers) as RequestType[];
      if (nodeMethods.length > 0) {
        nodeCode += `${indent}if (len === ${depth}) {\n`;
        for (const method of nodeMethods) {
          nodeCode += `${indent}  if (method === "${method}") return { handler: ${node.handlers[method]}, params };\n`;
        }
        nodeCode += `${indent}}\n`;
      }

      for (const [segment, childNode] of node.children) {
        if (segment.startsWith(":")) {
          const paramName = segment.slice(1);
          nodeCode += `${indent}if (len > ${depth}) {\n`;
          nodeCode += `${indent}  params["${paramName}"] = segments[${depth}];\n`;
          nodeCode += buildNodeCode(childNode, depth + 1);
          nodeCode += `${indent}}\n`;
        } else {
          nodeCode += `${indent}if (segments[${depth}] === "${segment}") {\n`;
          nodeCode += buildNodeCode(childNode, depth + 1);
          nodeCode += `${indent}}\n`;
        }
      }
      return nodeCode;
    };

    code += buildNodeCode(this.root, 0);
    code += `  return null;\n};\n`;
    return code;
  }
}
