export interface DemoCard {
  name: string;
  number: string;
  note: string;
}

export interface CardCategory {
  title: string;
  cards: DemoCard[];
}
