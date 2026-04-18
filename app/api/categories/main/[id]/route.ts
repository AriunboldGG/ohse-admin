import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// GET - Fetch a single main category
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

    const doc = await db.collection("main_categories").doc(id).get();
    
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
    console.error("[Categories API] Error fetching main category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch main category",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a main category
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
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;

    await db.collection("main_categories").doc(id).update(updateData);

    const updatedDoc = await db.collection("main_categories").doc(id).get();

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error: any) {
    console.error("[Categories API] Error updating main category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update main category",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a main category
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

    await db.collection("main_categories").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Main category deleted successfully",
    });
  } catch (error: any) {
    console.error("[Categories API] Error deleting main category:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete main category",
      },
      { status: 500 }
    );
  }
}
