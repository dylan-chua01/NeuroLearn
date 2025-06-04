import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();
    const { userId } = await auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params since they're now a Promise
    const { id: companionId } = await context.params;

    // Validate companion ID
    if (!companionId) {
      return NextResponse.json({ error: "Companion ID is required" }, { status: 400 });
    }

    // Check ownership
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
      console.error("Failed to delete session history:", sessionError);
      return NextResponse.json({ error: "Failed to delete session history" }, { status: 500 });
    }

    // 2️⃣ Now delete the companion
    const { error: deleteError } = await supabase
      .from("companions")
      .delete()
      .eq("id", companionId);

    if (deleteError) {
      console.error("Failed to delete companion:", deleteError);
      return NextResponse.json({ error: "Failed to delete companion" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Companion deleted successfully" 
    });

  } catch (error) {
    console.error("Unexpected error in DELETE /api/companions/[id]:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}