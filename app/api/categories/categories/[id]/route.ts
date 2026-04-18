import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// GET - Fetch a single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const doc = await db.collection("categories").doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    console.error("[Categories API] Error fetching category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch category",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const data = await request.json();
    const existingDoc = await db.collection("categories").doc(id).get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
    if (data.mainCategoryId !== undefined) updateData.mainCategoryId = data.mainCategoryId;

    await db.collection("categories").doc(id).update(updateData);

    const oldMainCategoryId = existingData?.mainCategoryId || "";
    const oldName = existingData?.name || "";
    const newMainCategoryId = data.mainCategoryId !== undefined ? data.mainCategoryId : oldMainCategoryId;
    const newName = data.name !== undefined ? data.name : oldName;

    if (oldMainCategoryId && (oldMainCategoryId !== newMainCategoryId || oldName !== newName)) {
      await db
        .collection("main_categories")
        .doc(oldMainCategoryId)
        .update({
          children: admin.firestore.FieldValue.arrayRemove(oldName),
          updatedAt: new Date().toISOString(),
        });
    }

    if (newMainCategoryId) {
      await db
        .collection("main_categories")
        .doc(newMainCategoryId)
        .update({
          children: admin.firestore.FieldValue.arrayUnion(newName),
          updatedAt: new Date().toISOString(),
        });
    }

    const updatedDoc = await db.collection("categories").doc(id).get();

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error: any) {
    console.error("[Categories API] Error updating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update category",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const existingDoc = await db.collection("categories").doc(id).get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;

    await db.collection("categories").doc(id).delete();

    if (existingData?.mainCategoryId && existingData?.name) {
      await db
        .collection("main_categories")
        .doc(existingData.mainCategoryId)
        .update({
          children: admin.firestore.FieldValue.arrayRemove(existingData.name),
          updatedAt: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    console.error("[Categories API] Error deleting category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete category",
      },
      { status: 500 }
    );
  }
}
