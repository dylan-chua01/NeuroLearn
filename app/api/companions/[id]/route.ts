import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const { userId } = await auth();

  const companionId = params.id;

  // Check ownership (optional)
  const { data: companion, error: fetchError } = await supabase
    .from("companions")
    .select("author")
    .eq("id", companionId)
    .single();

  if (fetchError || !companion) {
    return NextResponse.json({ error: "Companion not found" }, { status: 404 });
  }

  if (companion.author !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 1️⃣ Delete related session_history records
  const { error: sessionError } = await supabase
    .from("session_history")
    .delete()
    .eq("companion_id", companionId);

  if (sessionError) {
    return NextResponse.json({ error: "Failed to delete session history" }, { status: 500 });
  }

  // 2️⃣ Now delete the companion
  const { error: deleteError } = await supabase
    .from("companions")
    .delete()
    .eq("id", companionId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete companion" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
