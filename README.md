# eslint-plugin-typed-rocks

An ESLint plugin to enforce and simplify TypeScript type complexity in your codebase.

## Features

- **Rule: no-complex-types**
  - Prevents usage of overly complex or deeply nested TypeScript types.
  - Encourages maintainable, readable, and simple type definitions.
  - Detects and warns about types with excessive nesting, unions, intersections, or computed properties.
  - Helps teams enforce a maximum type complexity policy.

## Example Plugin Results

<table>

  <tr>
    <td>
      
```ts
// ❌ Too complex:
// ❌ No reusable types:
type Team = {
  region: "north" | "south" | "west" | "east";
// ^^ Union type has too many members (4). Max allowed is 3
  members: {
    name: string;
    firstname: string;
    address: {
      street: {
        name: string;
//      ^^^ Type is too deeply nested (4). Max allowed is 3
        nr: string;
//      ^^ Type is too deeply nested (4). Max allowed is 3
      };
      postalCode: string;
      city: string;
    };
  }[];
};
```
</td>
<td>
      
```ts
// ✅ Simpler, more maintainable
// ✅ Reusable
// ✅ No duplication
type Regions = "north" | "south" | "west" | "east";
type Team = {
  region: Regions;
  members: Member[];
};
type Member = {
  name: string;
  firstname: string;
  address: {
    street: {
      name: string;
      nr: string;
    };
    postalCode: string;
    city: string;
  };
};

```
</td>
</tr>
</table>




## Installation

```sh
npm install eslint-plugin-typed-rocks --save-dev
```

## Usage

Add `typed-rocks` to your ESLint plugins and enable the rule:

```json
{
  "plugins": ["typed-rocks"],
  "rules": {
    "typed-rocks/no-complex-types": ["warn", {
      "union": { "topLevel": 5, "inner": 2 },
      "intersection": { "topLevel": 3, "inner": 2 },
      "depth": 3,
      "combined": { "topLevel": 4, "inner": 2 }
    }]
  }
}
```

### Configuration Options

- `union`, `intersection`, `combined`:
  - `topLevel`: Maximum allowed top-level members
  - `inner`: Maximum allowed inner members
- `depth`: Maximum allowed nesting depth for types

## Why?

- Prevents hard-to-read and hard-to-maintain type definitions.
- Encourages best practices in TypeScript codebases.
- Makes code reviews and onboarding easier.

---

MIT License
