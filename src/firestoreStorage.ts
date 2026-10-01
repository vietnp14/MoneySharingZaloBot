import admin from "firebase-admin";
import type { Storage } from "./storage.js";
import type { Expense, GroupState, Ledger, Settlement, UserRef } from "./types.js";

export class FirestoreStorage implements Storage {
  private db: admin.firestore.Firestore;

  constructor() {
    if (admin.apps.length === 0) {
      const serviceAccount = parseServiceAccount();
      admin.initializeApp(
        serviceAccount
          ? {
              credential: admin.credential.cert(serviceAccount),
              projectId: serviceAccount.projectId
            }
          : { projectId: process.env.GOOGLE_CLOUD_PROJECT }
      );
    }
    this.db = admin.firestore();
  }

  async getGroup(groupId: string): Promise<GroupState> {
    const ref = this.groupRef(groupId);
    const snapshot = await ref.get();
    if (snapshot.exists) return snapshot.data() as GroupState;

    const group: GroupState = { groupId, nextSequence: 1, members: {} };
    await ref.set(group);
    return group;
  }

  async upsertMembers(groupId: string, members: UserRef[]): Promise<void> {
    const updates = Object.fromEntries(members.map((member) => [`members.${member.id.replaceAll(".", "_")}`, member]));
    await this.groupRef(groupId).set(updates, { merge: true });
  }

  async addExpense(input: Omit<Expense, "id" | "sequence">): Promise<Expense> {
    return this.db.runTransaction(async (transaction) => {
      const groupRef = this.groupRef(input.groupId);
      const groupSnapshot = await transaction.get(groupRef);
      const group = groupSnapshot.exists ? (groupSnapshot.data() as GroupState) : { groupId: input.groupId, nextSequence: 1, members: {} };
      const expenseRef = groupRef.collection("expenses").doc();
      const expense: Expense = { ...input, id: expenseRef.id, sequence: group.nextSequence };

      transaction.set(groupRef, { ...group, nextSequence: group.nextSequence + 1 }, { merge: true });
      transaction.set(expenseRef, expense);
      return expense;
    });
  }

  async updateExpense(
    groupId: string,
    sequence: number,
    senderId: string,
    patch: Pick<Expense, "amountVnd" | "description" | "participants">
  ): Promise<Expense | null> {
    const expense = await this.findExpense(groupId, sequence);
    if (!expense || expense.payer.id !== senderId || expense.deletedAt) return null;

    const updated: Expense = { ...expense, ...patch, updatedAt: new Date().toISOString() };
    await this.groupRef(groupId).collection("expenses").doc(expense.id).set(updated);
    return updated;
  }

  async deleteExpense(groupId: string, sequence: number, senderId: string): Promise<boolean> {
    const expense = await this.findExpense(groupId, sequence);
    if (!expense || expense.payer.id !== senderId || expense.deletedAt) return false;

    const deletedAt = new Date().toISOString();
    await this.groupRef(groupId).collection("expenses").doc(expense.id).update({ deletedAt, updatedAt: deletedAt });
    return true;
  }

  async addSettlement(input: Omit<Settlement, "id" | "sequence">): Promise<Settlement> {
    return this.db.runTransaction(async (transaction) => {
      const groupRef = this.groupRef(input.groupId);
      const groupSnapshot = await transaction.get(groupRef);
      const group = groupSnapshot.exists ? (groupSnapshot.data() as GroupState) : { groupId: input.groupId, nextSequence: 1, members: {} };
      const settlementRef = groupRef.collection("settlements").doc();
      const settlement: Settlement = { ...input, id: settlementRef.id, sequence: group.nextSequence };

      transaction.set(groupRef, { ...group, nextSequence: group.nextSequence + 1 }, { merge: true });
      transaction.set(settlementRef, settlement);
      return settlement;
    });
  }

  async getLedger(groupId: string): Promise<Ledger> {
    const [expensesSnapshot, settlementsSnapshot] = await Promise.all([
      this.groupRef(groupId).collection("expenses").orderBy("sequence", "asc").get(),
      this.groupRef(groupId).collection("settlements").orderBy("sequence", "asc").get()
    ]);

    return {
      expenses: expensesSnapshot.docs.map((doc) => doc.data() as Expense),
      settlements: settlementsSnapshot.docs.map((doc) => doc.data() as Settlement)
    };
  }

  async getExpensesSince(groupId: string, since: Date): Promise<Expense[]> {
    const snapshot = await this.groupRef(groupId).collection("expenses").where("createdAt", ">=", since.toISOString()).orderBy("createdAt", "asc").get();
    return snapshot.docs.map((doc) => doc.data() as Expense).filter((item) => !item.deletedAt);
  }

  private async findExpense(groupId: string, sequence: number): Promise<Expense | null> {
    const snapshot = await this.groupRef(groupId).collection("expenses").where("sequence", "==", sequence).limit(1).get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as Expense);
  }

  private groupRef(groupId: string): admin.firestore.DocumentReference {
    return this.db.collection("groups").doc(groupId);
  }
}

function parseServiceAccount(): admin.ServiceAccount | undefined {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) return JSON.parse(rawJson) as admin.ServiceAccount;

  const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Json) {
    return JSON.parse(Buffer.from(base64Json, "base64").toString("utf8")) as admin.ServiceAccount;
  }

  return undefined;
}
