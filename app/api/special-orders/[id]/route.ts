import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// DELETE - Delete a special order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    console.log(`[Special Orders API] Deleting special order ${id}...`);
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    await db.collection("special_quotes").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Special order deleted successfully",
    });
  } catch (error: any) {
    console.error("[Special Orders API] Error deleting special order:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to delete special order",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
