type Regions = "north" | "south" | "west" | "east";
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

type Team = {
  region: Regions;
  members: Member[];
};
