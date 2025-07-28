
type Team = Readonly<{
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
}>;

type Teams = {
  frontend: {
    members: {
      name: string,
      age: number,
      address: {
        street: {
          name: string,
          nr: string
        },
        postalCode: string,
        city: string,
        country: string
      },
      skills: {
        area: string
        level: number, 
      }[]
    }[]
  }
};

if(true) {
  if(false) {
    if(true) {
      if(false) {
        
      }
    }
  }
}

type N = 0 extends 0 
  ? 1 extends 1
    ? 2 extends 2 
      ? 3 extends 3 
        ? 4
        : 4
      : 3
    : 2
  : 1;

type Nested = 1 extends 2
  ? 4 extends 5
    ? 6
    : 7 extends 8
      ? A
      : 10 extends 11
        ? Readonly<A>
        : 4 extends 5
          ? { a: string }
          : 7 extends 8
            ? 9
            : 10 extends 11
            ? 12
            : 13
  : 1 extends 2 
    ? 3 extends 4
      ? 5 extends 6
        ? 2
        : 1
      : 2
    : 12;

type Nest = Readonly<{
  a: {
    b: { c: null };
    d: {
      a: string
    };
  };
}>;

type NestTernary = Readonly<{
  a: {
    b: 1 extends 2 ? 3 : 4;
  };
}>;

 type TooManyUnion = A & {
          b: {
            c: {
              d: D  | G;
            };
          };
        };