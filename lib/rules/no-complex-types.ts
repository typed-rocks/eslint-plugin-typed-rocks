import {AST_NODE_TYPES, TSESLint, TSESTree} from "@typescript-eslint/utils";
import {JSONSchema4ObjectSchema} from "@typescript-eslint/utils/json-schema";

type TopLevelInner = {
  topLevel: number;
  inner: number;
}

type Context = Readonly<TSESLint.RuleContext<MessageIds, Options>>;

type Option = {
  union: TopLevelInner,
  intersection: TopLevelInner,
  unionAndIntersections: TopLevelInner,
  depth: number;
};
type Options = [Option];

type DeepOptional<T> = {
  [Key in keyof T]?: T extends object ? DeepOptional<T[Key]> : T
}

type MessageIds = "tooManyUnion" | "tooManyIntersection" | "tooDeep" | "tooManyCombined";
const defaultTopLevelInner = (existing: DeepOptional<TopLevelInner> | undefined): TopLevelInner => ({
  topLevel: existing?.topLevel ?? Infinity,
  inner: existing?.inner ?? Infinity,
});

export const defaultOptions = (options: DeepOptional<Option>): Options => [{
  union: defaultTopLevelInner(options.union),
  intersection: defaultTopLevelInner(options.intersection),
  unionAndIntersections: defaultTopLevelInner(options.unionAndIntersections),
  depth: options.depth ?? Infinity
}];
const complexityLimit: JSONSchema4ObjectSchema = {
  type: "object",
  properties: {
    topLevel: {type: "number"},
    inner: {type: "number"}
  },
};
type LocalMaxDepth = {
  tooDeepNode: TSESTree.TypeNode,
  currentDepth: number
};
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
            unionAndIntersections: complexityLimit
          }
        },
      ],
      messages: {
        tooManyUnion: "Union type has too many members ({{count}}). Max allowed is {{max}}.",
        tooManyIntersection:
          "Intersection type has too many members ({{count}}). Max allowed is {{max}}.",
        tooDeep:
          "Type is too deeply nested ({{count}}). Max allowed is {{max}}.",
        tooManyCombined:
          "Combined union and intersection expression has too many members ({{count}}). Max allowed is {{max}}.",
      }
      ,
    },

    create(context: Context) {
      const option = defaultOptions(context.options[0])[0];

      // Recursively check depth and enforce max per-type rules
      function checkNode(node: TSESTree.TypeNode, currentDepth: number, isTopLevel = false): LocalMaxDepth {
        let localMaxDepth: LocalMaxDepth = {tooDeepNode: node, currentDepth};

        function calcDepth(typeNode: TSESTree.TypeNode, plusDepth: number = 0) {
          const depth = checkNode(typeNode, currentDepth + plusDepth, false);
          localMaxDepth = {
            tooDeepNode: depth.currentDepth >= localMaxDepth.currentDepth ? depth.tooDeepNode : localMaxDepth.tooDeepNode,
            currentDepth: Math.max(depth.currentDepth, localMaxDepth.currentDepth)
          }
        }

        switch (node.type) {
          case AST_NODE_TYPES.TSUnionType:
          case AST_NODE_TYPES.TSIntersectionType: {
            const {count, messageId} = getCountErrors(node, option, isTopLevel) ?? {};
            if ((messageId && count)) {
              context.report({
                node,
                messageId,
                data: {
                  count: count.nodeCount,
                  max: count.max,
                },
              });
            }

            node.types.forEach(t => calcDepth(t));
            break;
          }
          case AST_NODE_TYPES.TSTypeLiteral:
            for (const member of node.members) {
              if (
                member.type === AST_NODE_TYPES.TSPropertySignature &&
                member.typeAnnotation?.typeAnnotation
              ) {
                calcDepth(member.typeAnnotation.typeAnnotation, 1);
              }
            }
            break;
          case AST_NODE_TYPES.TSArrayType:
            calcDepth(node.elementType, 1);
            break;
          case AST_NODE_TYPES.TSTypeOperator:
            calcDepth(node.typeAnnotation!, 1);
            break;
          case AST_NODE_TYPES.TSTypeReference:
            localMaxDepth = {
              tooDeepNode: node,
              currentDepth
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
          const parentDeclaration = parentUntilPropertySignature(actualDepth.tooDeepNode);
          context.report({
            node: parentDeclaration,
            messageId: "tooDeep",
            data: {
              count: actualDepth.currentDepth,
              max: option.depth,
            },
          });
        },
      };
    }
    ,
  }
;

function innerOrOuter(option: Required<TopLevelInner>, isTopLevel: boolean): number {
  return isTopLevel ? option.topLevel : option.inner;
}

function countNodes(config: TopLevelInner, nodes: TSESTree.TypeNode[], isTopLevel: boolean, type?: AST_NODE_TYPES) {
  const nodeCount = type ? nodes.filter(el => el.parent.type === type).length : nodes.length;
  const max = innerOrOuter(config, isTopLevel);
  return {tooHigh: max < nodeCount, max, nodeCount};
}

function getCountErrors(node: TSESTree.TypeNode, {
  union,
  unionAndIntersections,
  intersection
}: Option, isTopLevel: boolean) {
  const total = flattenUnionIntersection(node);
  const tooManyCombined = countNodes(unionAndIntersections, total, isTopLevel);
  const tooManyUnion = countNodes(union, total, isTopLevel, AST_NODE_TYPES.TSUnionType);
  const tooManyIntersection = countNodes(intersection, total, isTopLevel, AST_NODE_TYPES.TSIntersectionType);
  const mappings: Record<Extract<MessageIds, 'tooManyUnion' | 'tooManyCombined' | 'tooManyIntersection'>, {
    max: number,
    nodeCount: number
  }> = {
    tooManyUnion,
    tooManyCombined,
    tooManyIntersection,
  }

  const messageId: MessageIds | undefined = tooManyUnion.tooHigh ? "tooManyUnion" : tooManyIntersection.tooHigh ? "tooManyIntersection" : tooManyCombined.tooHigh ? "tooManyCombined" : undefined;
  const count = messageId ? mappings[messageId] : undefined;
  return {count, messageId};
}

// Recursively traverse expression and collect all leaf types under union or intersection trees
function flattenUnionIntersection(
  node: TSESTree.TypeNode,
): TSESTree.TypeNode[] {
  const kinds = [AST_NODE_TYPES.TSIntersectionType, AST_NODE_TYPES.TSUnionType];
  if (kinds.includes(node.type)) {
    const children = (node as TSESTree.TSUnionType | TSESTree.TSIntersectionType).types;
    return children.flatMap(child => flattenUnionIntersection(child));
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
