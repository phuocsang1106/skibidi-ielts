"use client";

import { useState, type ChangeEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAdminActions } from "@/components/admin/user-admin-actions";

type Plan = { id: string; name: string; durationDays: number; isFree: boolean };
type UserRow = {
  id: string;
  username: string;
  planId: string;
  planName: string;
  planExpireDate: string | null;
  createdAt: string;
  submissionCount: number;
};

function UserPlanRow({ user, plans }: { user: UserRow; plans: Plan[] }) {
  const [planId, setPlanId] = useState(user.planId);
  const [savedPlanId, setSavedPlanId] = useState(user.planId);
  const [savedPlanName, setSavedPlanName] = useState(user.planName);
  const [loading, setLoading] = useState(false);

  function handlePlanChange(event: ChangeEvent<HTMLSelectElement>) {
    setPlanId(event.target.value);
  }

  async function save() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update user plan.");
      const selectedPlan = plans.find((plan) => plan.id === planId);
      setSavedPlanId(planId);
      if (selectedPlan) setSavedPlanName(selectedPlan.name);
      toast.success(`Updated @${user.username}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-b last:border-0 align-top">
      <td className="px-5 py-4">
        <p className="font-semibold">@{user.username}</p>
        <p className="mt-1 text-xs text-slate-400">Joined {new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
      </td>
      <td className="px-5 py-4"><Badge>{savedPlanName}</Badge></td>
      <td className="px-5 py-4">
        <select value={planId} onChange={handlePlanChange} className="h-10 rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200">
          {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
        </select>
      </td>
      <td className="px-5 py-4 text-sm text-slate-500">{user.planExpireDate ? new Date(user.planExpireDate).toLocaleDateString("vi-VN") : "No expiry"}</td>
      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{user.submissionCount}</td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={save} disabled={loading || planId === savedPlanId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          <UserAdminActions userId={user.id} username={user.username} />
        </div>
      </td>
    </tr>
  );
}

export function UserPlanTable({ users, plans }: { users: UserRow[]; plans: Plan[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Current</th>
              <th className="px-5 py-4">Change plan</th>
              <th className="px-5 py-4">Expiry</th>
              <th className="px-5 py-4">Submissions</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>{users.map((user) => <UserPlanRow key={user.id} user={user} plans={plans} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
