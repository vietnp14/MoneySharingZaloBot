export type UserRef = {
  id: string;
  name: string;
};

export type Expense = {
  id: string;
  groupId: string;
  sequence: number;
  payer: UserRef;
  amountVnd: number;
  description: string;
  participants: UserRef[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Settlement = {
  id: string;
  groupId: string;
  sequence: number;
  from: UserRef;
  to: UserRef;
  amountVnd: number;
  createdAt: string;
  deletedAt?: string;
};

export type GroupMember = UserRef;

export type GroupState = {
  groupId: string;
  nextSequence: number;
  members: Record<string, GroupMember>;
};

export type Ledger = {
  expenses: Expense[];
  settlements: Settlement[];
};

export type ZaloIncomingMessage = {
  text: string;
  messageId?: string;
  chat: {
    id: string;
    type: "GROUP" | "PRIVATE" | string;
  };
  from: UserRef;
};
