"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/actions/expenses";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, Select } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, CURRENCIES, formatMoney, roundMoney } from "@/lib/utils";

const initial: ActionResult = {};

type Member = { userId: string; name: string };

export type ExpenseFormInitial = {
  expenseId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  notes: string | null;
  date: Date | string;
  splitMode: string;
  participantIds: string[];
  payers: { userId: string; amount: number }[];
  splits: {
    userId: string;
    amount: number;
    shares: number | null;
    percent: number | null;
  }[];
};

function numOrZero(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function ExpenseForm({
  groupId,
  friendshipId,
  members,
  defaultCurrency,
  defaultSplitMode = "EQUAL",
  defaultSplitValues = {},
  currentUserId,
  initialExpense,
}: {
  groupId: string | null;
  friendshipId: string | null;
  members: Member[];
  defaultCurrency: string;
  defaultSplitMode?: string;
  defaultSplitValues?: Record<string, number>;
  currentUserId: string;
  initialExpense?: ExpenseFormInitial;
}) {
  const editing = Boolean(initialExpense);
  const createBound = createExpenseAction.bind(null, groupId, friendshipId);
  const updateBound = initialExpense
    ? updateExpenseAction.bind(null, initialExpense.expenseId)
    : null;
  const [state, action, pending] = useActionState(
    updateBound ?? createBound,
    initial
  );
  const [splitMode, setSplitMode] = useState(
    initialExpense?.splitMode ?? defaultSplitMode
  );
  const [multiPayer, setMultiPayer] = useState(
    (initialExpense?.payers.length ?? 0) > 1
  );
  const [selected, setSelected] = useState<string[]>(
    initialExpense?.participantIds ?? members.map((m) => m.userId)
  );
  const [amount, setAmount] = useState(
    initialExpense ? String(initialExpense.amount) : ""
  );
  const [currency, setCurrency] = useState(
    initialExpense?.currency ?? defaultCurrency
  );

  const splitById = Object.fromEntries(
    (initialExpense?.splits ?? []).map((s) => [s.userId, s])
  );
  const payerAmountById = Object.fromEntries(
    (initialExpense?.payers ?? []).map((p) => [p.userId, p.amount])
  );

  const [exactById, setExactById] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const uid of initialExpense?.participantIds ??
      members.map((m) => m.userId)) {
      const existing = splitById[uid]?.amount;
      const fallback = defaultSplitValues[uid];
      if (existing != null) next[uid] = String(existing);
      else if (fallback != null) next[uid] = String(fallback);
      else next[uid] = "";
    }
    return next;
  });
  const [percentById, setPercentById] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const uid of initialExpense?.participantIds ??
      members.map((m) => m.userId)) {
      const existing = splitById[uid]?.percent;
      const fallback = defaultSplitValues[uid];
      if (existing != null) next[uid] = String(existing);
      else if (fallback != null) next[uid] = String(fallback);
      else next[uid] = "";
    }
    return next;
  });
  const [sharesById, setSharesById] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const uid of initialExpense?.participantIds ??
      members.map((m) => m.userId)) {
      const existing = splitById[uid]?.shares;
      const fallback = defaultSplitValues[uid];
      if (existing != null) next[uid] = String(existing);
      else if (fallback != null) next[uid] = String(fallback);
      else next[uid] = "";
    }
    return next;
  });
  const [payerById, setPayerById] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const uid of members.map((m) => m.userId)) {
      next[uid] = String(payerAmountById[uid] ?? 0);
    }
    return next;
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dateValue = initialExpense
    ? new Date(initialExpense.date).toISOString().slice(0, 10)
    : today;
  const recordedPayerId =
    editing && initialExpense?.payers.length === 1
      ? initialExpense.payers[0].userId
      : currentUserId;
  const recordedPayerName =
    members.find((m) => m.userId === recordedPayerId)?.name ?? "you";

  const totalAmount = roundMoney(numOrZero(amount));

  const splitSum = useMemo(() => {
    if (splitMode === "EXACT") {
      return roundMoney(
        selected.reduce((sum, uid) => sum + numOrZero(exactById[uid] ?? ""), 0)
      );
    }
    if (splitMode === "PERCENTAGE") {
      return roundMoney(
        selected.reduce(
          (sum, uid) => sum + numOrZero(percentById[uid] ?? ""),
          0
        )
      );
    }
    return null;
  }, [splitMode, selected, exactById, percentById]);

  const payerSum = useMemo(() => {
    if (!multiPayer) return null;
    return roundMoney(
      selected.reduce((sum, uid) => sum + numOrZero(payerById[uid] ?? ""), 0)
    );
  }, [multiPayer, selected, payerById]);

  const clientError = useMemo(() => {
    if (!(totalAmount > 0)) return null;

    if (splitMode === "EXACT" && splitSum != null) {
      const diff = roundMoney(totalAmount - splitSum);
      if (Math.abs(diff) > 0.01) {
        return `Shares add up to ${formatMoney(splitSum, currency)}, but the expense is ${formatMoney(totalAmount, currency)}. ${
          diff > 0
            ? `Still short ${formatMoney(diff, currency)}.`
            : `Over by ${formatMoney(Math.abs(diff), currency)}.`
        }`;
      }
    }

    if (splitMode === "PERCENTAGE" && splitSum != null) {
      const diff = roundMoney(100 - splitSum);
      if (Math.abs(diff) > 0.01) {
        return `Percentages add up to ${splitSum}%. They need to total 100% (${
          diff > 0 ? `short ${diff}%` : `over by ${Math.abs(diff)}%`
        }).`;
      }
    }

    if (multiPayer && payerSum != null) {
      const diff = roundMoney(totalAmount - payerSum);
      if (Math.abs(diff) > 0.01) {
        return `Amounts paid add up to ${formatMoney(payerSum, currency)}, but the expense is ${formatMoney(totalAmount, currency)}. ${
          diff > 0
            ? `Still short ${formatMoney(diff, currency)}.`
            : `Over by ${formatMoney(Math.abs(diff), currency)}.`
        }`;
      }
    }

    return null;
  }, [
    totalAmount,
    splitMode,
    splitSum,
    multiPayer,
    payerSum,
    currency,
  ]);

  function ensureMemberValue(
    map: Record<string, string>,
    uid: string,
    setter: (value: Record<string, string>) => void
  ) {
    if (map[uid] != null) return;
    setter({ ...map, [uid]: "" });
  }

  return (
    <Card className="mx-auto max-w-xl">
      <h1 className="page-title">
        {editing ? "Edit expense" : "Add expense"}
      </h1>
      <form action={action} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            defaultValue={initialExpense?.description}
            required
          />
        </div>
        <div className="stack-form">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="stack-form">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={dateValue} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              name="category"
              defaultValue={initialExpense?.category ?? "General"}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            name="notes"
            defaultValue={initialExpense?.notes ?? ""}
          />
        </div>

        <div>
          <Label>Split among</Label>
          <div className="mt-2 space-y-2">
            {members.map((m) => (
              <label
                key={m.userId}
                className="flex min-h-11 items-center gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="participantIds"
                  value={m.userId}
                  className="h-4 w-4 shrink-0"
                  checked={selected.includes(m.userId)}
                  onChange={(e) => {
                    setSelected((prev) => {
                      if (e.target.checked) {
                        ensureMemberValue(exactById, m.userId, setExactById);
                        ensureMemberValue(percentById, m.userId, setPercentById);
                        ensureMemberValue(sharesById, m.userId, setSharesById);
                        ensureMemberValue(payerById, m.userId, setPayerById);
                        return [...prev, m.userId];
                      }
                      return prev.filter((id) => id !== m.userId);
                    });
                  }}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="splitMode">Split mode</Label>
          <Select
            id="splitMode"
            name="splitMode"
            value={splitMode}
            onChange={(e) => setSplitMode(e.target.value)}
          >
            <option value="EQUAL">Equal</option>
            <option value="EXACT">Exact amounts</option>
            <option value="PERCENTAGE">Percentages</option>
            <option value="SHARES">Shares</option>
          </Select>
        </div>

        {splitMode !== "EQUAL" && (
          <div className="space-y-2 rounded-sm bg-bg p-3">
            {selected.map((uid) => {
              const name = members.find((m) => m.userId === uid)?.name ?? uid;
              const field =
                splitMode === "EXACT"
                  ? `exact_${uid}`
                  : splitMode === "PERCENTAGE"
                    ? `percent_${uid}`
                    : `shares_${uid}`;
              const value =
                splitMode === "EXACT"
                  ? (exactById[uid] ?? "")
                  : splitMode === "PERCENTAGE"
                    ? (percentById[uid] ?? "")
                    : (sharesById[uid] ?? "");
              return (
                <div
                  key={uid}
                  className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2"
                >
                  <span className="shrink-0 text-sm sm:w-28 sm:truncate">
                    {name}
                  </span>
                  <Input
                    name={field}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={value}
                    aria-invalid={Boolean(clientError)}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (splitMode === "EXACT") {
                        setExactById((prev) => ({ ...prev, [uid]: next }));
                      } else if (splitMode === "PERCENTAGE") {
                        setPercentById((prev) => ({ ...prev, [uid]: next }));
                      } else {
                        setSharesById((prev) => ({ ...prev, [uid]: next }));
                      }
                    }}
                    required
                  />
                </div>
              );
            })}
            {splitMode === "EXACT" && splitSum != null && totalAmount > 0 ? (
              <p className="text-xs text-muted">
                Split total {formatMoney(splitSum, currency)} of{" "}
                {formatMoney(totalAmount, currency)}
              </p>
            ) : null}
            {splitMode === "PERCENTAGE" && splitSum != null ? (
              <p className="text-xs text-muted">
                Percentages total {splitSum}% of 100%
              </p>
            ) : null}
          </div>
        )}

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="multiPayer"
            className="h-4 w-4 shrink-0"
            checked={multiPayer}
            onChange={(e) => setMultiPayer(e.target.checked)}
          />
          Multiple people paid
        </label>

        {!multiPayer ? (
          <>
            <input type="hidden" name="payerId" value={recordedPayerId} />
            <p className="text-sm text-muted">
              {editing
                ? `Recorded as paid by ${recordedPayerName}.`
                : "Recorded as paid by you. Others can add what they paid as separate expenses."}
            </p>
          </>
        ) : (
          <div className="space-y-2 rounded-sm bg-bg p-3">
            {selected.map((uid) => {
              const name = members.find((m) => m.userId === uid)?.name ?? uid;
              return (
                <div
                  key={uid}
                  className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2"
                >
                  <span className="shrink-0 text-sm sm:w-28 sm:truncate">
                    {name} paid
                  </span>
                  <Input
                    name={`payer_${uid}`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={payerById[uid] ?? "0"}
                    aria-invalid={Boolean(clientError)}
                    onChange={(e) =>
                      setPayerById((prev) => ({
                        ...prev,
                        [uid]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })}
            {payerSum != null && totalAmount > 0 ? (
              <p className="text-xs text-muted">
                Paid total {formatMoney(payerSum, currency)} of{" "}
                {formatMoney(totalAmount, currency)}
              </p>
            ) : null}
          </div>
        )}

        <FormMessage error={clientError ?? state.error} />
        <Button type="submit" disabled={pending || Boolean(clientError)}>
          {pending
            ? editing
              ? "Saving…"
              : "Adding…"
            : editing
              ? "Save changes"
              : "Save expense"}
        </Button>
      </form>
    </Card>
  );
}
