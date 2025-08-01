# Enforce and simplify TypeScript type complexity in your codebase

<div align="center">

<img src="https://github.com/typed-rocks/eslint-plugin-typed-rocks/blob/main/plugin-logo.png?raw=true" width="300" height="300">

# eslint-plugin-typed-rocks


</div>

## Features

- **Rule: typed-rocks/max-depth**
  - Prevents usage of overly complex or deeply nested TypeScript types.
  - Encourages maintainable, readable, and simple type definitions.
  - Helps teams enforce a maximum type complexity policy.
  - integrated `--fix` command to restructure and properly organize your types.

## Example Plugin Results

```ts
// ❌ Too complex:
// ❌ No reusable types:
type Team = {
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


## After `--fix`

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
    "typed-rocks/max-depth": ["warn", 3]
  }
}
```

## Why?

- Prevents hard-to-read and hard-to-maintain type definitions.
- Encourages best practices in TypeScript codebases.
- Makes code reviews and onboarding easier.

---

MIT License
