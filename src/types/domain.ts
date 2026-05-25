export interface User {
  id: number;
  email: string;
  name: string;
  birth: Date | string;
  phone: string;
  password: string;
  address: string;
  job: string | null;
}

export interface Account {
  id: number;
  user: number;
  money: string;
  card: number;
  type: string;
  date: Date | string;
}

export interface Card {
  id: number;
  date: Date | string;
  max: number;
  lastuse: Date | string;
  type: string;
  cardname: string | null;
  user: number;
  account: number;
}

export interface History {
  account: number;
  date: Date | string;
  id: number;
  type: string;
  content: string;
  money: string;
  left: string;
}

export interface NewUser {
  email: string;
  name: string;
  birth: string;
  phone: string;
  password: string;
  address: string;
  job?: string | null;
}

export interface NewAccount {
  user: number;
  type: string;
  money?: number;
  card?: number;
  date: string;
}

export interface NewCard {
  date: string;
  max: number;
  lastuse: string;
  type: string;
  cardname: string;
  user: number;
  account: number;
}

export interface NewHistory {
  account: number;
  date: string;
  id: number;
  type: string;
  content: string;
  money: number;
  left: string | number;
}

declare global {
  namespace Express {
    interface User extends Omit<import('./domain').User, never> {}
  }
}
