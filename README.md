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
type Teams = {
  frontend: {
    members: {
      name: string;
      age: number;
      address: {
//      ^^^ Type is too deeply nested (4). Max allowed is 3
        street: string;
        postalCode: string;
        city: string;
        country: string;
      };
      skills: {
//      ^^^ Type is too deeply nested (4). Max allowed is 3
        area: string;
        level: number;
      }[];
    }[];
  };
};
```


## After `--fix`

```ts
// ✅ Simpler, more maintainable
// ✅ Reusable
// ✅ No duplication
type Teams = {
  frontend: {
    members: {
      name: string;
      age: number;
      address: Address;
      skills: Skills[];
    }[];
  };
};

type Skills = {
  area: string;
  level: number;
};

type Address = {
  street: string;
  postalCode: string;
  city: string;
  country: string;
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
