import {AST_NODE_TYPES, TSESLint, TSESTree} from "@typescript-eslint/utils";
import {JSONSchema4ObjectSchema} from "@typescript-eslint/utils/json-schema";

type TopLevelInner = {
  topLevel: number;
  inner: number;
};

type Context = Readonly<TSESLint.RuleContext<MessageIds, Options>>;

export type NoComplexTypesOptions = {
  union: TopLevelInner;
  intersection: TopLevelInner;
  combined: TopLevelInner;
  depth: number;
};
export type Options = [NoComplexTypesOptions];

type DeepOptional<T> = {
  [Key in keyof T]?: T extends object ? DeepOptional<T[Key]> : T;
};
type MessageIds = "tooManyUnion" | "tooManyIntersection" | "tooDeep" | "tooManyCombined";
type TooManyIds = Exclude<MessageIds, "tooDeep">;
const defaultTopLevelInner = (existing: DeepOptional<TopLevelInner> | undefined): TopLevelInner => ({
  topLevel: existing?.topLevel ?? Infinity,
  inner: existing?.inner ?? Infinity,
});

export const defaultOptions = (options: DeepOptional<NoComplexTypesOptions>): Options => [
  {
    union: defaultTopLevelInner(options.union),
    intersection: defaultTopLevelInner(options.intersection),
    combined: defaultTopLevelInner(options.combined),
    depth: options.depth ?? Infinity,
  },
];
const complexityLimit: JSONSchema4ObjectSchema = {
  type: "object",
  properties: {
    topLevel: {type: "number"},
    inner: {type: "number"},
  },
};
type LocalMaxDepth = {
  tooDeepNodes: TSESTree.TypeNode[];
  currentDepth: number;
};

function determineTooDeepNodes(depth: LocalMaxDepth, localMaxDepth: LocalMaxDepth): TSESTree.TypeNode[] {
  if (depth.currentDepth === localMaxDepth.currentDepth) {
    return [...depth.tooDeepNodes, ...localMaxDepth.tooDeepNodes];
  } else if (depth.currentDepth > localMaxDepth.currentDepth) {
    return depth.tooDeepNodes;
  } else {
    return localMaxDepth.tooDeepNodes;
  }
}

const rule: TSESLint.RuleModule<MessageIds, Options> = {
  defaultOptions: defaultOptions({}),
  meta: {
    type: "problem",
    docs: {
      description: "Disallow overly complex TypeScript types",
    },
    schema: [
      {
        type: "object",
        properties: {
          depth: {type: "number"},
          union: complexityLimit,
          intersection: complexityLimit,
          combined: complexityLimit,
        },
      },
    ],
    messages: {
      tooManyUnion: "Union type has too many members ({{count}}). Max allowed is {{max}}.",
      tooManyIntersection: "Intersection type has too many members ({{count}}). Max allowed is {{max}}.",
      tooDeep: "Type is too deeply nested ({{count}}). Max allowed is {{max}}.",
      tooManyCombined:
        "Combined union and intersection expression has too many members ({{count}}). Max allowed is {{max}}.",
    },
  },

  create(context: Context) {
    const option = defaultOptions(context.options[0])[0];

    const existingReports: (TSESLint.ReportDescriptor<MessageIds> & {
      node: TSESTree.Node | TSESTree.Token
    })[] = [];

    function addReport(descriptor: TSESLint.ReportDescriptor<MessageIds> & {
      node: TSESTree.Node | TSESTree.Token
    }) {
      const hasExisting = existingReports.find(
        (report) => report.messageId === descriptor.messageId && descriptor.node === report.node
      );
      if (!hasExisting) {
        existingReports.push(descriptor);
        context.report(descriptor);
      }
    }

    // Recursively check depth and enforce max per-type rules
    function checkNode(node: TSESTree.TypeNode, currentDepth: number, isTopLevel = false): LocalMaxDepth {
      let localMaxDepth: LocalMaxDepth = {tooDeepNodes: [node], currentDepth};

      function calcDepth(typeNode: TSESTree.TypeNode, plusDepth: number = 0) {
        const depth = checkNode(typeNode, currentDepth + plusDepth, false);
        localMaxDepth = {
          tooDeepNodes: determineTooDeepNodes(depth, localMaxDepth),
          currentDepth: Math.max(depth.currentDepth, localMaxDepth.currentDepth),
        };
      }

      switch (node.type) {
        case AST_NODE_TYPES.TSUnionType:
        case AST_NODE_TYPES.TSIntersectionType: {
          const {count, messageId} = getCountErrors(node, option, isTopLevel) ?? {};
          if (messageId && count) {
            addReport({
              node,
              messageId,
              data: {
                count: count.nodeCount,
                max: count.max,
              },
            });
          }

          node.types.forEach((t) => calcDepth(t));
          break;
        }
        case AST_NODE_TYPES.TSTypeLiteral:
          for (const member of node.members) {
            if (member.type === AST_NODE_TYPES.TSPropertySignature && member.typeAnnotation?.typeAnnotation) {
              calcDepth(member.typeAnnotation.typeAnnotation, 1);
            }
          }
          break;
        case AST_NODE_TYPES.TSArrayType:
          calcDepth(node.elementType);
          break;
        case AST_NODE_TYPES.TSTypeOperator:
          calcDepth(node.typeAnnotation!, 1);
          break;
        case AST_NODE_TYPES.TSTypeReference:
          // If the type reference has typeParameters (TSTypeParameterInstantiation), check their depth as well
          if (node.typeArguments && Array.isArray(node.typeArguments.params)) {
            node.typeArguments.params.forEach((param) => calcDepth(param));
          } else {
            localMaxDepth = {
              tooDeepNodes: [node],
              currentDepth,
            };
          }
          break;
      }
      return localMaxDepth;
    }

    return {
      TSTypeAliasDeclaration(node) {
        const actualDepth = checkNode(node.typeAnnotation, 0, true);
        if (actualDepth.currentDepth <= option.depth) {
          return;
        }
        actualDepth.tooDeepNodes.forEach((n) =>
          addReport({
            node: parentUntilPropertySignature(n),
            messageId: "tooDeep",
            data: {
              count: actualDepth.currentDepth,
              max: option.depth,
            },
          }));
      },
    };
  },
};

function countNodes(config: TopLevelInner, nodes: TSESTree.TypeNode[], isTopLevel: boolean, type?: AST_NODE_TYPES): {
  tooHigh: boolean, max: number, nodeCount: number
} {
  const nodeCount = type ? nodes.filter((el) => el.parent.type === type).length : nodes.length;
  const max = isTopLevel ? config.topLevel : config.inner;
  return {tooHigh: max < nodeCount, max, nodeCount};
}

type MessageErrors = {
  tooHigh: boolean;
  max: number;
  nodeCount: number
};

function determineMessageID(tooManyUnion: MessageErrors, tooManyIntersection: MessageErrors, tooManyCombined: MessageErrors): TooManyIds | undefined {
  if (tooManyUnion.tooHigh) {
    return "tooManyUnion";
  } else if (tooManyIntersection.tooHigh) {
    return "tooManyIntersection";
  } else if (tooManyCombined.tooHigh) {
    return "tooManyCombined";
  } else {
    return undefined;
  }
}

function getCountErrors(
  node: TSESTree.TypeNode,
  {union, combined, intersection}: NoComplexTypesOptions,
  isTopLevel: boolean
): { count?: { max: number, nodeCount: number }, messageId: MessageIds | undefined } {
  const total = flattenUnionIntersection(node);
  const tooManyCombined = countNodes(combined, total, isTopLevel);
  const tooManyUnion = countNodes(union, total, isTopLevel, AST_NODE_TYPES.TSUnionType);
  const tooManyIntersection = countNodes(intersection, total, isTopLevel, AST_NODE_TYPES.TSIntersectionType);
  const mappings: Record<
    Extract<MessageIds, "tooManyUnion" | "tooManyCombined" | "tooManyIntersection">,
    {
      max: number;
      nodeCount: number;
    }
  > = {
    tooManyUnion,
    tooManyCombined,
    tooManyIntersection,
  };

  const messageId = determineMessageID(tooManyUnion, tooManyIntersection, tooManyCombined);
  const count = messageId ? mappings[messageId] : undefined;
  return {count, messageId};
}

// Recursively traverse expression and collect all leaf types under union or intersection trees
function flattenUnionIntersection(node: TSESTree.TypeNode): TSESTree.TypeNode[] {
  const kinds = [AST_NODE_TYPES.TSIntersectionType, AST_NODE_TYPES.TSUnionType];
  if (kinds.includes(node.type)) {
    const children = (node as TSESTree.TSUnionType | TSESTree.TSIntersectionType).types;
    return children.flatMap((child) => flattenUnionIntersection(child));
  }
  return [node];
}

function parentUntilPropertySignature(node: TSESTree.Node) {
  let curParent: TSESTree.Node | undefined = node.parent;
  while (curParent && curParent?.type !== AST_NODE_TYPES.TSPropertySignature) {
    curParent = curParent.parent;
  }
  return curParent?.key ?? node;
}

export default rule;
