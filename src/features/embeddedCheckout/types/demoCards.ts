export interface DemoCard {
  name: string;
  note: string;
}

export interface CardCategory {
  title: string;
  cards: DemoCard[];
}
