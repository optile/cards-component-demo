import type { CardCategory } from "../types/demoCards";

export const DEMO_CARD_CATEGORIES: CardCategory[] = [
  {
    title: "Successful payments",
    cards: [
      { name: "Visa", number: "4242 4242 4242 4242", note: "Success" },
      { name: "Visa Debit", number: "4000 0566 5566 5556", note: "Success" },
      { name: "Mastercard", number: "5555 5555 5555 4444", note: "Success" },
      {
        name: "Mastercard (2-series)",
        number: "2223 0031 2200 3222",
        note: "Success",
      },
      {
        name: "American Express",
        number: "3782 822463 10005",
        note: "Success",
      },
      { name: "Discover", number: "6011 0009 9013 9424", note: "Success" },
      { name: "Diners Club", number: "3056 9309 0259 04", note: "Success" },
    ],
  },
  {
    title: "3D Secure / SCA flows",
    cards: [
      {
        name: "3DS Required",
        number: "4000 0027 6000 3184",
        note: "Requires 3DS challenge",
      },
      {
        name: "3DS Authentication Fail",
        number: "4000 0000 0000 3063",
        note: "3DS fails",
      },
    ],
  },
  {
    title: "Declines and errors",
    cards: [
      {
        name: "Generic Decline",
        number: "4000 0000 0000 9995",
        note: "Generic decline",
      },
      {
        name: "Insufficient Funds",
        number: "4000 0000 0000 9994",
        note: "Insufficient funds",
      },
      {
        name: "Lost Card",
        number: "4000 0000 0000 9978",
        note: "Card reported lost",
      },
      {
        name: "Stolen Card",
        number: "4000 0000 0000 9986",
        note: "Card reported stolen",
      },
      {
        name: "Expired Card",
        number: "4000 0000 0000 0069",
        note: "Expired card",
      },
      {
        name: "Processing Error",
        number: "4000 0000 0000 0119",
        note: "Processing error",
      },
      {
        name: "Incorrect CVC",
        number: "4000 0000 0000 0101",
        note: "Use wrong CVC to test",
      },
      {
        name: "ZIP Check Fail",
        number: "4000 0000 0000 0038",
        note: "Use wrong postal code",
      },
    ],
  },
];
