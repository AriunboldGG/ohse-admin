import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// GET - Fetch all subcategories (with optional category filter)
export async function GET(request: NextRequest) {
  try {
    console.log("[Categories API] Fetching subcategories from Firestore...");
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const mainCategoryId = searchParams.get("mainCategoryId");

    let query: any = db.collection("subcategories");
    
    if (categoryId) {
      query = query.where("categoryId", "==", categoryId);
    }
    
    if (mainCategoryId) {
      query = query.where("mainCategoryId", "==", mainCategoryId);
    }

    const snapshot = await query.get();
    const subcategories = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Sort in-memory to avoid Firestore composite index requirement
    subcategories.sort((a: any, b: any) => {
      const nameA = (a?.name || "").toString().toLowerCase()
      const nameB = (b?.name || "").toString().toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({
      success: true,
      data: subcategories,
      count: subcategories.length,
    });
  } catch (error: any) {
    console.error("[Categories API] Error fetching subcategories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch subcategories",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new subcategory
export async function POST(request: NextRequest) {
  try {
    console.log("[Categories API] Creating subcategory...");
    
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

    const subcategoryData = {
      name: data.name,
      nameEn: data.nameEn || "",
      categoryId: data.categoryId || "",
      mainCategoryId: data.mainCategoryId || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("subcategories").add(subcategoryData);

    if (subcategoryData.categoryId) {
      await db
        .collection("categories")
        .doc(subcategoryData.categoryId)
        .update({
          children: admin.firestore.FieldValue.arrayUnion(subcategoryData.name),
          updatedAt: new Date().toISOString(),
        });

      const categoryDoc = await db.collection("categories").doc(subcategoryData.categoryId).get();
      const categoryData = categoryDoc.exists ? categoryDoc.data() : null;
      const mainCategoryId = categoryData?.mainCategoryId || "";
      if (mainCategoryId) {
        await db
          .collection("main_categories")
          .doc(mainCategoryId)
          .update({
            [`subchildren.${subcategoryData.categoryId}`]: admin.firestore.FieldValue.arrayUnion(subcategoryData.name),
            updatedAt: new Date().toISOString(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...subcategoryData },
    });
  } catch (error: any) {
    console.error("[Categories API] Error creating subcategory:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create subcategory",
      },
      { status: 500 }
    );
  }
}
