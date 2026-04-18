import { NextRequest, NextResponse } from "next/server"
import { db, getStorageBucket } from "@/lib/firebase-admin"

async function uploadSectorImageToStorage(file: File): Promise<string> {
  let bucket
  try {
    bucket = getStorageBucket()
    const [exists] = await bucket.exists()
    if (!exists) {
      await bucket.create()
    }
  } catch (error: any) {
    console.error("Error accessing storage bucket:", error)
    const bucketName = bucket?.name || "unknown"
    throw new Error(`Storage bucket error (${bucketName}): ${error.message || "Bucket not accessible."}`)
  }

  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split(".").pop()
  const fileName = `product_sectors/${timestamp}-${randomString}.${fileExtension}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const fileRef = bucket.file(fileName)
  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  })
  await fileRef.makePublic()

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const contentType = request.headers.get("content-type") || ""

    const existingDoc = await db.collection("product_sectors").doc(id).get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    let name = ""
    let order = existingData?.order || 0
    let imageUrl = existingData?.imageUrl || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      name = (formData.get("name") as string) || ""
      const orderValue = parseInt((formData.get("order") as string) || "", 10)
      if (!Number.isNaN(orderValue)) {
        order = orderValue
      }
      const imageFile = formData.get("image") as File | null
      const imageUrlField = (formData.get("image_url") as string) || ""
      if (imageFile && imageFile instanceof File && imageFile.type.startsWith("image/")) {
        imageUrl = await uploadSectorImageToStorage(imageFile)
      } else if (imageUrlField) {
        imageUrl = imageUrlField
      }
    } else {
      const data = await request.json()
      name = data?.name || ""
      order = data?.order || order
      imageUrl = data?.imageUrl || data?.image_url || imageUrl
    }

    if (!name.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      )
    }

    await db.collection("product_sectors").doc(id).update({
      name: name.trim(),
      order,
      imageUrl,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Product Sectors API] Error updating sector:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update product sector" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    await db.collection("product_sectors").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Product Sectors API] Error deleting sector:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete product sector" },
      { status: 500 }
    )
  }
}
