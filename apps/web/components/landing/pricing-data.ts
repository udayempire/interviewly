// Practice packs share the same interview features and differ in credit count.
export const practicePlans = [
  { name: "One round", credits: 1, price: "99", description: "A focused round before the real thing.", label: "Try a round" },
  { name: "The practice pack", credits: 10, price: "749", description: "Make practice part of your preparation.", label: "Choose 10 credits", popular: true },
  { name: "The full preparation", credits: 20, price: "1,349", description: "More room to practice, learn and come back stronger.", label: "Choose 20 credits", discount: true },
];

export const practiceBenefits = [
  "A live AI voice interview",
  "Questions tailored to your role and background",
  "Resume and GitHub context when provided",
  "Transcript and feedback when eligible",
];

export type PracticePlan = (typeof practicePlans)[number];
