import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";

export type MaxDepthOptions = [number];

type MessageIds = "tooDeep";

const rule: TSESLint.RuleModule<MessageIds, MaxDepthOptions> = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow overly deep TypeScript types",
    },
    schema: [
      {
        type: "number",
      },
    ],
    messages: {
      tooDeep: "Type is too deeply nested ({{count}}). Max allowed is {{max}}.",
    },
  },
  defaultOptions: [Infinity],
  create(context) {
    const maxAllowedDepth = context.options[0] || Infinity;

    return {
      TSTypeAliasDeclaration(node) {
        const tooDeepNodes: { node: TSESTree.TypeNode; depth: number }[] = [];
        checkNode(node.typeAnnotation, 0, undefined);
        tooDeepNodes.forEach((n) => {
          context.report({
            node: n.node,
            messageId: "tooDeep",
            data: { count: n.depth, max: maxAllowedDepth },
          });
        });

        function checkNode(node: TSESTree.TypeNode, currentDepth: number, firstTooDeepParent?: TSESTree.TypeNode) {
          function getParentToUse(newDepth: number) {
            return maxAllowedDepth < newDepth ? firstTooDeepParent ?? node : undefined;
          }
          switch (node.type) {
            case AST_NODE_TYPES.TSConditionalType:
              const trueType = node.trueType;
              const falseType = node.falseType;
              const newDepth = currentDepth + 1;
              checkNode(trueType, newDepth, getParentToUse(newDepth));
              checkNode(falseType, newDepth, getParentToUse(newDepth));
              break;
            case AST_NODE_TYPES.TSUnionType:
            case AST_NODE_TYPES.TSIntersectionType:
              node.types.forEach((t) => checkNode(t, currentDepth, getParentToUse(currentDepth)));
              break;
            case AST_NODE_TYPES.TSTypeLiteral:
              for (const member of node.members) {
                if (member.type === AST_NODE_TYPES.TSPropertySignature && member.typeAnnotation?.typeAnnotation) {
                  checkNode(member.typeAnnotation.typeAnnotation, currentDepth + 1, getParentToUse(currentDepth + 1));
                }
              }
              break;
            case AST_NODE_TYPES.TSArrayType:
              checkNode(node.elementType, currentDepth, getParentToUse(currentDepth));
              break;
            case AST_NODE_TYPES.TSTypeOperator:
              if (node.typeAnnotation) {
                checkNode(node.typeAnnotation, currentDepth + 1, getParentToUse(currentDepth + 1));
              }
              break;
            case AST_NODE_TYPES.TSTypeReference:
              if (node.typeArguments && Array.isArray(node.typeArguments.params)) {
                node.typeArguments.params.forEach((param) =>
                  checkNode(param, currentDepth, getParentToUse(currentDepth))
                );
              }
              break;
          }
          if (firstTooDeepParent) {
            const existingNode = tooDeepNodes.find((n) => n.node === firstTooDeepParent);
            if (existingNode) {
              existingNode.depth = Math.max(currentDepth, existingNode.depth);
            } else {
              tooDeepNodes.push({ node: firstTooDeepParent, depth: currentDepth });
            }
          }
        }
      },
    };
  },
};

export default rule;
