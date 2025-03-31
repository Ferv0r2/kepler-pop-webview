export type ItemType = 1 | 2 | 3 | 4 | 5 | 6
export type GridItem = {
  id: string
  type: ItemType
  isMatched: boolean
  isNew: boolean
}

export type GameState = {
  score: number
  moves: number
  isSwapping: boolean
  isChecking: boolean
  isGameOver: boolean
  combo: number
}
