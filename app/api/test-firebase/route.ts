import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Test endpoint to verify Firebase Admin connection
export async function GET() {
  try {
    console.log("Testing Firebase Admin connection...");
    
    // Try to access Firestore
    const testCollection = db.collection("products");
    const testSnapshot = await testCollection.limit(1).get();
    
    return NextResponse.json({
      success: true,
      message: "Firebase Admin is connected successfully",
      productsCount: testSnapshot.size,
      firestoreConnected: true,
    });
  } catch (error: any) {
    console.error("Firebase Admin test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Firebase Admin connection failed",
        code: error?.code,
        details: error?.stack,
      },
      { status: 500 }
    );
  }
}

