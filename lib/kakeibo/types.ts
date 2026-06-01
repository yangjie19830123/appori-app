export type EntryType = "income" | "expense";

export interface Entry {
  id: number;
  type: EntryType;
  cat: string;
  amount: number;
  note: string;
  date: string;
  member: string;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface MonthData {
  label: string;
  income: number;
  expense: number;
}

export interface CatTotal extends Category {
  amount: number;
}

export interface MemberTotal extends Member {
  income: number;
  expense: number;
}
