export interface Task {
  id: string;
  text: string;
}

export enum GameState {
  ACTIVE,
  SHATTERING,
  CLEARED
}
