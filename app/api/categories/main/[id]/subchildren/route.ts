import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();
    const categoryName = String(body?.categoryName || "").trim();
    const subcategoryName = String(body?.subcategoryName || "").trim();

    if (!categoryName || !subcategoryName) {
      return NextResponse.json(
        { success: false, error: "categoryName and subcategoryName are required" },
        { status: 400 }
      );
    }

    await db.collection("main_categories").doc(id).update({
      [`subchildren.${categoryName}`]: admin.firestore.FieldValue.arrayUnion(subcategoryName),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Categories API] Error adding subchild:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to add subchild" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();
    const oldCategoryName = String(body?.oldCategoryName || "").trim();
    const newCategoryName = String(body?.newCategoryName || "").trim();
    const oldName = String(body?.oldName || "").trim();
    const newName = String(body?.newName || "").trim();

    if (!oldCategoryName || !newCategoryName || !oldName || !newName) {
      return NextResponse.json(
        { success: false, error: "old/new category and names are required" },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    updates[`subchildren.${oldCategoryName}`] = admin.firestore.FieldValue.arrayRemove(oldName);
    updates[`subchildren.${newCategoryName}`] = admin.firestore.FieldValue.arrayUnion(newName);

    await db.collection("main_categories").doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Categories API] Error updating subchild:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update subchild" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();
    const categoryName = String(body?.categoryName || "").trim();
    const subcategoryName = String(body?.subcategoryName || "").trim();

    if (!categoryName || !subcategoryName) {
      return NextResponse.json(
        { success: false, error: "categoryName and subcategoryName are required" },
        { status: 400 }
      );
    }

    await db.collection("main_categories").doc(id).update({
      [`subchildren.${categoryName}`]: admin.firestore.FieldValue.arrayRemove(subcategoryName),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Categories API] Error deleting subchild:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete subchild" },
      { status: 500 }
    );
  }
}
