import {RuleTester} from "@typescript-eslint/rule-tester";
import rule, {defaultOptions} from "../lib/rules/no-complex-types";

// Use the correct parser
const ruleTester = new RuleTester();

ruleTester.run("no-complex-types", rule, {
  valid: [
    {
      code: `type A = X | Y | Z;`,
      options: defaultOptions({union: {topLevel: Infinity, inner: 3}}),
    },
    {
      code: `type A = X | Y | {b: C | D | E};`,
      options: defaultOptions({union: {topLevel: Infinity, inner: 3}}),
    },
    {
      code: `type B = X & { y: Y };`,
      options: defaultOptions({intersection: {topLevel: Infinity, inner: 3}}),
    },
    {
      code: `type C = { a: { b: { c: string } } };`,
      options: defaultOptions({union: {topLevel: Infinity, inner: 4}}),
    },
    {
      code: `type TooManyIntersectionsButRoot = A & B & C & D;`,
      options: defaultOptions({intersection: {topLevel: Infinity, inner: 4}}),
    },
    {
      code: `type TooManyUnionButRoot = A | B | C | D;`,
      options: defaultOptions({union: {topLevel: Infinity, inner: 3}}),
    },
  ],

  invalid: [
    {
      code: `type TooManyUnion = A | {z:  B | C | {u: T | E | S | U}};`,
      options: defaultOptions({union: {topLevel: 3, inner: 3}}),
      errors: [{
        messageId: "tooManyUnion",
        data: {count: 4, max: 3},
      }],
    },

    {
      code: `type TooManyIntersectionsInner = A & {z: B & C & D & E};`,
      options: defaultOptions({intersection: {topLevel: 3, inner: 3}}),
      errors: [{
        messageId: "tooManyIntersection",
        data: {count: 4, max: 3},
      }],
    },
    {
      code: `type TooManyIntersectionsDeep = A & B & {c: D & E & F & G};`,
      options: defaultOptions({intersection: {topLevel: 3, inner: 3}}),
      errors: [{
        messageId: "tooManyIntersection",
        data: {count: 4, max: 3},
      }],
    },
    {
      code: `
        type TooManyUnion = A & {
          b: {
            c: {
              d: D | E | F | G;
            };
          };
        };
      `,
      options: defaultOptions({depth: 4, union: {topLevel: 3, inner: 3}}),
      errors: [{
        messageId: "tooManyUnion",
        data: {count: 4, max: 3},
      }],
    },
    {
      code: `
        type TooDeep = A & {
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
      options: defaultOptions({depth: 4, union: {topLevel: 3, inner: 3}}),
      errors: [{
        messageId: "tooDeep",
        data: {count: 5, max: 4},
      }],
    },
    {
      code: `
        type TooManyCombined = A & {
          b: {
            c: {
              d: D | E & F | G;
            };
          };
        };
      `,
      options: defaultOptions({unionAndIntersections: {topLevel: 3, inner: 3}}),
      errors: [{
        messageId: "tooManyCombined",
        data: {count: 4, max: 3},
      }],
    },
  ],
});
