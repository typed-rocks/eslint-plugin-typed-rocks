
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

type Teams = {
  frontend: {
    members: {
      name: string;
      age: number;
      address: {
        street: string;
        postalCode: string;
        city: string;
        country: string;
      };
      skills: {
        area: string;
        level: number;
      }[];
    }[];
  };
};

type Nested = 1 extends 2
  ? 2 extends 3
    ? 3 extends 4
      ? 4 extends 5
        ? 6
        : 1
      : 1
    : 1
  : 1;
