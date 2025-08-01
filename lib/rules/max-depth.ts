import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";
const {
  Identifier,
  TSTypeReference,
  TSTypeOperator,
  TSArrayType,
  TSPropertySignature,
  TSConditionalType,
  TSUnionType,
  TSIntersectionType,
  TSTypeLiteral,
  TSTypeAliasDeclaration,
} = AST_NODE_TYPES;
type TypeNode = TSESTree.TypeNode;
type SourceCode = TSESLint.SourceCode;
type TSTypeAliasDeclaration = TSESTree.TSTypeAliasDeclaration;
export type MaxDepthOptions = [number];

type MessageIds = "tooDeep";

type TooDeepNode = {
  node: TSESTree.TypeNode;
  depth: number;
};

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
    fixable: "code",
    messages: {
      tooDeep: "Type is too deeply nested ({{count}}). Max allowed is {{max}}.",
    },
  },
  defaultOptions: [Infinity],
  create(context) {
    return listener(context);
  },
};

function listener(context: TSESLint.RuleContext<MessageIds, MaxDepthOptions>): TSESLint.RuleListener {
  const maxAllowedDepth = context.options[0] || Infinity;

  return {
    TSTypeAliasDeclaration(node) {
      const tooDeepNodes: TooDeepNode[] = [];
      checkNode(node.typeAnnotation, 0, undefined);
      const sourceCode = context.sourceCode;

      tooDeepNodes.forEach((n, i) =>
        context.report({
          node: n.node,
          messageId: "tooDeep",
          data: { count: n.depth, max: maxAllowedDepth },
          fix: replacerFn(n.node, sourceCode, i, node),
        })
      );

      function checkNode(node: TypeNode, currentDepth: number, firstTooDeepParent?: TypeNode) {
        function mostOuterTooDeepParent(newDepth: number) {
          return maxAllowedDepth < newDepth ? firstTooDeepParent ?? node : undefined;
        }

        switch (node.type) {
          case TSConditionalType:
            const { trueType, falseType } = node;
            const newDepth = currentDepth + 1;
            checkNode(trueType, newDepth, mostOuterTooDeepParent(newDepth));
            checkNode(falseType, newDepth, mostOuterTooDeepParent(newDepth));
            break;
          case TSUnionType:
          case TSIntersectionType:
            node.types.forEach((t) => checkNode(t, currentDepth, mostOuterTooDeepParent(currentDepth)));
            break;
          case TSTypeLiteral:
            for (const member of node.members) {
              if (member.type === TSPropertySignature && member.typeAnnotation?.typeAnnotation) {
                checkNode(
                  member.typeAnnotation.typeAnnotation,
                  currentDepth + 1,
                  mostOuterTooDeepParent(currentDepth + 1)
                );
              }
            }
            break;
          case TSArrayType:
            checkNode(node.elementType, currentDepth, mostOuterTooDeepParent(currentDepth));
            break;
          case TSTypeOperator:
            if (node.typeAnnotation) {
              checkNode(node.typeAnnotation, currentDepth + 1, mostOuterTooDeepParent(currentDepth + 1));
            }
            break;
          case TSTypeReference:
            const params = node.typeArguments?.params;
            const objectKeys = Array.isArray(params) ? params : undefined;
            objectKeys?.forEach((param) => checkNode(param, currentDepth, mostOuterTooDeepParent(currentDepth)));
            break;
        }
        addOrUpdateTooDeepNode(tooDeepNodes, currentDepth, firstTooDeepParent);
      }
    },
  };
}

function addOrUpdateTooDeepNode(tooDeepNodes: TooDeepNode[], currentDepth: number, currentTooDeepNode?: TypeNode) {
  if (!currentTooDeepNode) {
    return;
  }
  const existingNode = tooDeepNodes.find((n) => n.node === currentTooDeepNode);
  if (existingNode) {
    existingNode.depth = Math.max(currentDepth, existingNode.depth);
  } else {
    tooDeepNodes.push({ node: currentTooDeepNode, depth: currentDepth });
  }
}

export default rule;
function replacerFn(
  replaceNode: TypeNode,
  sourceCode: SourceCode,
  i: number,
  aliasNode: TSTypeAliasDeclaration
): TSESLint.ReportFixFunction {
  return (fixer) => {
    const extractedBaseName = generateExtractedName(replaceNode);
    const startExtractedIndex = existingTypeNames(sourceCode, extractedBaseName);
    const suffix = startExtractedIndex === 0 ? "" : startExtractedIndex + i;
    const extractedName = extractedBaseName + suffix;
    const typeText = sourceCode.getText(replaceNode);
    const textWithSemicolon = ensureEndsWith(typeText, ";");
    const newText = `\n\ntype ${extractedName} = ${textWithSemicolon}`;
    return [fixer.replaceText(replaceNode, extractedName), fixer.insertTextAfter(aliasNode, newText)];
  };
}

function ensureEndsWith(str: string, ending: string) {
  return str.endsWith(ending) ? str : str + ending;
}

function generateExtractedName(node: TypeNode) {
  const name = firstPropertySignature(node) ?? `Extracted`;
  return name[0].toUpperCase() + name.substring(1);
}

function firstPropertySignature(node: TypeNode): string | undefined {
  let parent: TSESTree.Node | undefined = node.parent;
  while (parent && parent.type !== TSPropertySignature) {
    parent = parent.parent;
  }
  const key = parent?.key;
  return key?.type === Identifier ? key.name : undefined;
}

function existingTypeNames(sourceCode: SourceCode, name: string): number {
  const ast = sourceCode.ast;
  return ast.body.filter((entry) => entry.type === TSTypeAliasDeclaration).filter((alias) => alias.id.name === name)
    .length;
}
