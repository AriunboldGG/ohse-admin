import { NextRequest, NextResponse } from "next/server";
import { db, getStorageBucket } from "@/lib/firebase-admin";

const COLLECTION = "news";

async function uploadCoverImage(file: File): Promise<string> {
  const bucket = getStorageBucket();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop();
  const fileName = `news/${timestamp}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

  const fileRef = bucket.file(fileName);
  await fileRef.save(buffer, {
    metadata: { contentType: file.type },
  });
  await fileRef.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "News not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error: any) {
    console.error("[News API] Error fetching news:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch news" },
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
    const contentType = request.headers.get("content-type") || "";

    const updateData: any = { updatedAt: new Date().toISOString() };

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const title = formData.get("title") as string | null;
      const body = formData.get("body") as string | null;
      const category = formData.get("category") as string | null;
      const coverImage = formData.get("coverImage") as File | null;
      const coverImageUrl = formData.get("coverImageUrl") as string | null;

      if (title !== null) updateData.title = title.trim();
      if (body !== null) updateData.body = body.trim();
      if (category !== null) updateData.category = category.trim();

      if (coverImage && coverImage instanceof File && coverImage.size > 0) {
        updateData.coverImageUrl = await uploadCoverImage(coverImage);
      } else if (coverImageUrl) {
        updateData.coverImageUrl = coverImageUrl;
      }
    } else {
      const body = await request.json();
      if (body.title !== undefined) updateData.title = String(body.title).trim();
      if (body.body !== undefined) updateData.body = String(body.body).trim();
      if (body.category !== undefined) updateData.category = String(body.category).trim();
      if (body.coverImageUrl !== undefined) updateData.coverImageUrl = String(body.coverImageUrl).trim();
    }

    await db.collection(COLLECTION).doc(id).update(updateData);
    const updatedDoc = await db.collection(COLLECTION).doc(id).get();
    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error: any) {
    console.error("[News API] Error updating news:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update news" },
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
    await db.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[News API] Error deleting news:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete news" },
      { status: 500 }
    );
  }
}
