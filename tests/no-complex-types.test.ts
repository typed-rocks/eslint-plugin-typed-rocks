import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../lib/rules/max-depth";
const ruleTester = new RuleTester();

ruleTester.run("max-depth", rule, {
  valid: [
    {
      code: `type A = X | Y | Z;`,
      options: [2],
    },
    {
      code: `type A = X | Y | {b: C | D | E};`,
      options: [3],
    },
    {
      code: `type B = X & { y: Y };`,
      options: [3],
    },
    {
      code: `type C = { a: { b: { c: string } } };`,
      options: [4],
    },
    {
      code: `type TooManyIntersectionsButRoot = A & B & C & D;`,
      options: [4],
    },
    {
      code: `type TooManyUnionButRoot = A | B | C | D;`,
      options: [4],
    },
  ],

  invalid: [
    {
      code: `type TooDeep1 = A | {
          z:  B | C | { u: T | E | S | U }
        };`,
      options: [1],
      errors: [
        {
          messageId: "tooDeep",
          data: { count: 2, max: 1 },
        },
      ],
      output: `type TooDeep1 = A | {
          z:  B | C | Z
        };

type Z = { u: T | E | S | U };`,
    },

    {
      code: `type TooDeep2 = A & {z: B & C & {u: C} & E};`,
      options: [1],
      errors: [
        {
          messageId: "tooDeep",
          data: { count: 2, max: 1 },
        },
      ],
    },
    {
      code: `
        type TooDeepInUnion = A & {
          b: {
            c: {
              d: D | {z: A} | {u: A} | G;
            };
          };
        };
      `,
      options: [3],
      errors: [
        {
          messageId: "tooDeep",
          data: { count: 4, max: 3 },
        },
        {
          messageId: "tooDeep",
          data: { count: 4, max: 3 },
        },
      ],
      output: `
        type TooDeepInUnion = A & {
          b: {
            c: {
              d: D | D | {u: A} | G;
            };
          };
        };

type D = {z: A};
      `
    },
    {
      code: `
        type TooDeep3 = A & {
          b: {
            c: {
              d: {
                e: {
                  f: string
                }
              };
            };
          };
        };
      `,
      options: [4],
      errors: [
        {
          messageId: "tooDeep",
          data: { count: 5, max: 4 },
        },
      ],
    },
  ],
});
