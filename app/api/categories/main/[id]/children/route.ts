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
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    await db.collection("main_categories").doc(id).update({
      children: admin.firestore.FieldValue.arrayUnion(name),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Categories API] Error adding child:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to add child" },
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
    const oldName = String(body?.oldName || "").trim();
    const newName = String(body?.newName || "").trim();

    if (!oldName || !newName) {
      return NextResponse.json(
        { success: false, error: "oldName and newName are required" },
        { status: 400 }
      );
    }

    const docRef = db.collection("main_categories").doc(id);
    const doc = await docRef.get();
    const data = doc.exists ? doc.data() : null;
    const subchildren = data?.subchildren || {};
    const oldSubchildren = Array.isArray(subchildren?.[oldName]) ? subchildren[oldName] : [];

    const updateData: Record<string, any> = {
      children: admin.firestore.FieldValue.arrayRemove(oldName),
      updatedAt: new Date().toISOString(),
    };
    updateData.children = admin.firestore.FieldValue.arrayUnion(newName);

    if (oldSubchildren.length > 0) {
      updateData[`subchildren.${oldName}`] = admin.firestore.FieldValue.delete();
      updateData[`subchildren.${newName}`] = oldSubchildren;
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Categories API] Error renaming child:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to rename child" },
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
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    await db.collection("main_categories").doc(id).update({
      children: admin.firestore.FieldValue.arrayRemove(name),
      [`subchildren.${name}`]: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Categories API] Error deleting child:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete child" },
      { status: 500 }
    );
  }
}
