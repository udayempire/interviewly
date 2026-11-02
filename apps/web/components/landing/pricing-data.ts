// Practice packs share the same interview features and differ in credit count.
export const practicePlans = [
  { name: "One Shot", credits: 1, price: "1", description: "Try Interviewlyy", label: "Try a round" },
  { name: "Interview Ready", credits: 10, price: "8", description: "Make practice part of your preparation.", label: "Choose 10 credits", popular: true },
  { name: "Offer Ready", credits: 20, price: "15", description: "Best for overcoming interview anxiety and mastering voice-based interviews.", label: "Choose 20 credits", discount: true },
];

export const practiceBenefits = [
  "A live AI voice interview",
  "Questions tailored to your role and background",
  "Resume and GitHub context when provided",
  "Transcript and feedback when eligible",
];

export type PracticePlan = (typeof practicePlans)[number];
