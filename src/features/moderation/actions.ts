"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/printify/config";
import type {
  ContentReport,
  ModerationFlag,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/types/database";
import { REPORT_REASON_LABELS } from "@/features/moderation/constants";

export type ActionResult = { error?: string; success?: boolean; id?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if (!isAdminEmail(user.email)) throw new Error("Admin access required.");
  const admin = createAdminClient();
  return { supabase, user, admin };
}

export async function createReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string | null;
  reason: ReportReason;
  details?: string;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!Object.keys(REPORT_REASON_LABELS).includes(input.reason)) {
      return { error: "Invalid reason." };
    }
    const { data, error } = await supabase
      .from("content_reports")
      .insert({
        reporter_id: user.id,
        target_type: input.targetType,
        target_id: input.targetId,
        target_user_id: input.targetUserId ?? null,
        reason: input.reason,
        details: input.details?.trim() || null,
        status: "open",
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { success: true, id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function loadModerationQueues(): Promise<{
  reports: ContentReport[];
  flags: ModerationFlag[];
  error?: string;
}> {
  try {
    const { admin } = await requireAdmin();
    const client = admin ?? (await createClient());
    const [{ data: reports, error: rErr }, { data: flags, error: fErr }] =
      await Promise.all([
        client
          .from("content_reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        client
          .from("moderation_flags")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
    if (rErr || fErr) {
      return {
        reports: [],
        flags: [],
        error: rErr?.message ?? fErr?.message,
      };
    }
    return {
      reports: (reports ?? []) as ContentReport[],
      flags: (flags ?? []) as ModerationFlag[],
    };
  } catch (e) {
    return {
      reports: [],
      flags: [],
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
): Promise<ActionResult> {
  try {
    const { user, admin } = await requireAdmin();
    const client = admin ?? (await createClient());
    const { error } = await client
      .from("content_reports")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function updateFlagStatus(
  id: string,
  status: ReportStatus,
): Promise<ActionResult> {
  try {
    const { user, admin } = await requireAdmin();
    const client = admin ?? (await createClient());
    const { error } = await client
      .from("moderation_flags")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
