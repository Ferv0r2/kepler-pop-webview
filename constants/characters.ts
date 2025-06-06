export interface Character {
  name: string;
  image: string;
  tile: number;
}

export const CHARACTERS: Character[] = [
  { name: 'Ruby Tulip', image: '/plants/tulip.png', tile: 1 },
  { name: 'Crystal Mint', image: '/plants/crystal-cactus.png', tile: 2 },
  { name: 'Orbit Sprout', image: '/plants/sprout.png', tile: 3 },
  { name: 'Sunny Flower', image: '/plants/sunflower.png', tile: 4 },
  { name: 'Cosmic Mushroom', image: '/plants/mushroom.png', tile: 5 },
];
