import { NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

export async function POST() {
  try {
    await db.collection("counters").doc("product_code").set({ current: 0 }, { merge: true })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Products API] Failed to reset product code counter:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to reset product code counter" },
      { status: 500 }
    )
  }
}
