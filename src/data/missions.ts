export interface Mission {
  id: number;
  title: string;
  clue: string;
  locationHint: string;
  challenge: string;
  isSpicy: boolean;
}

export const missions: Mission[] = [
  {
    id: 1,
    title: "Beach Explorer",
    clue: "Every island adventure begins where land meets the sea.",
    locationHint: "A beautiful beach with ocean views",
    challenge: "Take a selfie at a beautiful beach with the ocean behind you.",
    isSpicy: false,
  },
  {
    id: 2,
    title: "Coconut Hunter",
    clue: "On this island, treasure grows high above your head.",
    locationHint: "A coconut palm or local stand",
    challenge: "Find a fresh coconut or coconut stand and take a photo with it.",
    isSpicy: false,
  },
  {
    id: 3,
    title: "Jungle Pathfinder",
    clue: "Leave the beach and enter the wild.",
    locationHint: "A jungle trail or tropical path",
    challenge: "Find a jungle path, tropical plants, or a small trail and take a photo there.",
    isSpicy: false,
  },
  {
    id: 4,
    title: "Viewpoint Seeker",
    clue: "To understand an island, you must see it from above.",
    locationHint: "A viewpoint overlooking the island",
    challenge: "Reach a viewpoint and take a photo of the island landscape.",
    isSpicy: false,
  },
  {
    id: 5,
    title: "Local Discovery",
    clue: "The culture of a place is tasted before it is understood.",
    locationHint: "A local food market or street vendor",
    challenge: "Take a photo of a local Thai dish or street food you discover.",
    isSpicy: false,
  },
  {
    id: 6,
    title: "Hidden Spot",
    clue: "The best places are rarely the most crowded.",
    locationHint: "A quiet, secret corner of the island",
    challenge: "Find a quiet or hidden place on the island and take a photo there.",
    isSpicy: false,
  },
  {
    id: 7,
    title: "Spicy Dare",
    clue: "Adventure is about trying new things… sometimes outside your comfort zone.",
    locationHint: "Anywhere your courage takes you",
    challenge: "Take a playful or daring photo — jumping into water, a silly pose, a small dare that's safe but playful.",
    isSpicy: true,
  },
  {
    id: 8,
    title: "Spicy Finale",
    clue: "The ultimate treasure appears when the sun disappears… and hearts race.",
    locationHint: "A sunset spot on the island",
    challenge: "Take a sunset photo that's fun, flirty, or slightly daring — a playful silhouette, a cheeky pose, something memorable.",
    isSpicy: true,
  },
];
