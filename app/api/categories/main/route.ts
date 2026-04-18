import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// GET - Fetch all main categories
export async function GET(request: NextRequest) {
  try {
    console.log("[Categories API] Fetching main categories from Firestore...");
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const snapshot = await db.collection("main_categories").orderBy("name", "asc").get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error: any) {
    console.error("[Categories API] Error fetching main categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch main categories",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new main category
export async function POST(request: NextRequest) {
  try {
    console.log("[Categories API] Creating main category...");
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const categoryData = {
      name: data.name,
      nameEn: data.nameEn || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("main_categories").add(categoryData);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...categoryData },
    });
  } catch (error: any) {
    console.error("[Categories API] Error creating main category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create main category",
      },
      { status: 500 }
    );
  }
}
