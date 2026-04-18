import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// GET - Fetch a single subcategory
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

    const doc = await db.collection("subcategories").doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    console.error("[Categories API] Error fetching subcategory:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch subcategory",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a subcategory
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
    const existingDoc = await db.collection("subcategories").doc(id).get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.mainCategoryId !== undefined) updateData.mainCategoryId = data.mainCategoryId;

    await db.collection("subcategories").doc(id).update(updateData);

    const oldCategoryId = existingData?.categoryId || "";
    const oldName = existingData?.name || "";
    const newCategoryId = data.categoryId !== undefined ? data.categoryId : oldCategoryId;
    const newName = data.name !== undefined ? data.name : oldName;

    if (oldCategoryId && (oldCategoryId !== newCategoryId || oldName !== newName)) {
      await db
        .collection("categories")
        .doc(oldCategoryId)
        .update({
          children: admin.firestore.FieldValue.arrayRemove(oldName),
          updatedAt: new Date().toISOString(),
        });
    }

    if (newCategoryId) {
      await db
        .collection("categories")
        .doc(newCategoryId)
        .update({
          children: admin.firestore.FieldValue.arrayUnion(newName),
          updatedAt: new Date().toISOString(),
        });
    }

    const oldCategoryDoc = oldCategoryId
      ? await db.collection("categories").doc(oldCategoryId).get()
      : null;
    const newCategoryDoc = newCategoryId
      ? await db.collection("categories").doc(newCategoryId).get()
      : null;
    const oldMainCategoryId = oldCategoryDoc?.exists ? oldCategoryDoc.data()?.mainCategoryId || "" : "";
    const newMainCategoryId = newCategoryDoc?.exists ? newCategoryDoc.data()?.mainCategoryId || "" : "";

    if (oldMainCategoryId && (oldMainCategoryId !== newMainCategoryId || oldName !== newName)) {
      await db
        .collection("main_categories")
        .doc(oldMainCategoryId)
        .update({
          [`subchildren.${oldCategoryId}`]: admin.firestore.FieldValue.arrayRemove(oldName),
          updatedAt: new Date().toISOString(),
        });
    }

    if (newMainCategoryId) {
      await db
        .collection("main_categories")
        .doc(newMainCategoryId)
        .update({
          [`subchildren.${newCategoryId}`]: admin.firestore.FieldValue.arrayUnion(newName),
          updatedAt: new Date().toISOString(),
        });
    }

    const updatedDoc = await db.collection("subcategories").doc(id).get();

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error: any) {
    console.error("[Categories API] Error updating subcategory:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update subcategory",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subcategory
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

    const existingDoc = await db.collection("subcategories").doc(id).get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;

    await db.collection("subcategories").doc(id).delete();

    if (existingData?.categoryId && existingData?.name) {
      await db
        .collection("categories")
        .doc(existingData.categoryId)
        .update({
          children: admin.firestore.FieldValue.arrayRemove(existingData.name),
          updatedAt: new Date().toISOString(),
        });

      const categoryDoc = await db.collection("categories").doc(existingData.categoryId).get();
      const mainCategoryId = categoryDoc.exists ? categoryDoc.data()?.mainCategoryId || "" : "";
      if (mainCategoryId) {
        await db
          .collection("main_categories")
          .doc(mainCategoryId)
          .update({
            [`subchildren.${existingData.categoryId}`]: admin.firestore.FieldValue.arrayRemove(existingData.name),
            updatedAt: new Date().toISOString(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error: any) {
    console.error("[Categories API] Error deleting subcategory:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete subcategory",
      },
      { status: 500 }
    );
  }
}
