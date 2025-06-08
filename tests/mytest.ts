type A = (symbol | boolean | string) | string;
const asdf = "";
type Person = {
  address: {
    street: {
      name: string;
      additional: {
        a: string;
        [asdf]: string;
      };
    };
    postalCode: string;
    postalCode2: string;
    city: string;
  };
};

type B = {
  a: { u: string };
  b: number;
};

type C = {
  a: { u: string; z: number };
  b: number;
};
const c: C = { a: { u: 'asdf', z: 1 }, b: 1 };

function exact<Wanted, In extends Wanted>(b: Exact<Wanted, In>) {
  
}

type Exact<Wanted, In extends Wanted> = Wanted extends In ? In extends Wanted ? In : never : never;

// wenn Key not in

type U = Exact<B, C>;
//   ^?

exact(c);
