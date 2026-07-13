export interface DemoCard {
  name: string;
  note: string;
  number: string;
}

export interface CardCategory {
  title: string;
  cards: DemoCard[];
}
