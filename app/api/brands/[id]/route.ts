import { NextRequest, NextResponse } from "next/server"
import { db, getStorageBucket } from "@/lib/firebase-admin"

const COLLECTION = "brands"

function getExtensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase()
  if (fromName && fromName.length > 0 && fromName !== file.name.toLowerCase()) {
    return fromName
  }
  // Fallback to MIME type
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
  }
  return mimeMap[file.type] || "jpg"
}

async function uploadImageToStorage(file: File): Promise<string> {
  const bucket = getStorageBucket()
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = getExtensionFromFile(file)
  const fileName = `brands/${timestamp}-${randomString}.${fileExtension}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const fileRef = bucket.file(fileName)
  await fileRef.save(buffer, {
    metadata: { contentType: file.type },
  })
  await fileRef.makePublic()

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const now = new Date().toISOString()
    const formData = await request.formData()

    const name = String(formData.get("name") || "").trim()
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Brand name is required" },
        { status: 400 }
      )
    }

    let imageUrl = String(formData.get("image_url") || "").trim()
    const imageFile = formData.get("image") as File | null
    if (imageFile && imageFile instanceof File && imageFile.type.startsWith("image/")) {
      imageUrl = await uploadImageToStorage(imageFile)
    }

    const payload: Record<string, any> = {
      name,
      image: imageUrl,
      updatedAt: now,
    }

    await db.collection(COLLECTION).doc(id).update(payload)
    return NextResponse.json({ success: true, data: { id, ...payload } })
  } catch (error: any) {
    console.error("[Brands API] Error updating brand:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update brand" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    await db.collection(COLLECTION).doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Brands API] Error deleting brand:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete brand" },
      { status: 500 }
    )
  }
}
