import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// GET - Fetch all categories (with optional mainCategory filter)
export async function GET(request: NextRequest) {
  try {
    console.log("[Categories API] Fetching categories from Firestore...");
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const { searchParams } = new URL(request.url);
    const mainCategoryId = searchParams.get("mainCategoryId");

    let query: any = db.collection("categories");
    
    if (mainCategoryId) {
      query = query.where("mainCategoryId", "==", mainCategoryId);
    }

    const snapshot = await query.get();
    const categories = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Sort in-memory to avoid Firestore composite index requirement
    categories.sort((a: any, b: any) => {
      const nameA = (a?.name || "").toString().toLowerCase()
      const nameB = (b?.name || "").toString().toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error: any) {
    console.error("[Categories API] Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    console.log("[Categories API] Creating category...");
    
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
      mainCategoryId: data.mainCategoryId || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("categories").add(categoryData);

    if (categoryData.mainCategoryId) {
      await db
        .collection("main_categories")
        .doc(categoryData.mainCategoryId)
        .update({
          children: admin.firestore.FieldValue.arrayUnion(categoryData.name),
          updatedAt: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...categoryData },
    });
  } catch (error: any) {
    console.error("[Categories API] Error creating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create category",
      },
      { status: 500 }
    );
  }
}
