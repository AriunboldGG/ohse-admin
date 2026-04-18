import { NextRequest, NextResponse } from "next/server";
import { db, getStorageBucket } from "@/lib/firebase-admin";
import admin from "firebase-admin";

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

export async function GET() {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[News API] Error fetching news:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch news" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const title = (formData.get("title") as string) || "";
    const body = (formData.get("body") as string) || "";
    const category = (formData.get("category") as string) || "";
    const coverImage = formData.get("coverImage") as File | null;

    if (!title.trim() || !body.trim() || !category.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let coverImageUrl = "";
    if (coverImage && coverImage instanceof File && coverImage.size > 0) {
      coverImageUrl = await uploadCoverImage(coverImage);
    }

    const now = new Date().toISOString();
    const payload = {
      title: title.trim(),
      body: body.trim(),
      category: category.trim(),
      coverImageUrl,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(payload);
    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...payload },
    });
  } catch (error: any) {
    console.error("[News API] Error creating news:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create news" },
      { status: 500 }
    );
  }
}
