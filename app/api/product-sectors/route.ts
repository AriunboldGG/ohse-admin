import { NextRequest, NextResponse } from "next/server"
import { db, getStorageBucket } from "@/lib/firebase-admin"

const DEFAULT_PRODUCT_SECTORS = [
  "Барилга",
  "Гагнуур",
  "Зам",
  "Уул уурхай",
  "Үйлдвэр",
  "Цахилгаан",
]

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

export async function GET() {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const snapshot = await db.collection("product_sectors").orderBy("order", "asc").get()

    if (snapshot.empty) {
      const batch = db.batch()
      DEFAULT_PRODUCT_SECTORS.forEach((name, index) => {
        const docRef = db.collection("product_sectors").doc()
        batch.set(docRef, {
          name,
          order: index + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })
      await batch.commit()
    }

    const refreshedSnapshot = await db.collection("product_sectors").orderBy("order", "asc").get()
    const sectors = refreshedSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      success: true,
      data: sectors,
      count: sectors.length,
    })
  } catch (error: any) {
    console.error("[Product Sectors API] Error fetching sectors:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch product sectors" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const contentType = request.headers.get("content-type") || ""
    let name = ""
    let order = 0
    let imageUrl = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      name = (formData.get("name") as string) || ""
      order = parseInt((formData.get("order") as string) || "0", 10) || 0
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
      order = data?.order || 0
      imageUrl = data?.imageUrl || data?.image_url || ""
    }

    if (!name.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      )
    }

    const docRef = await db.collection("product_sectors").add({
      name: name.trim(),
      order,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, name: name.trim(), order, imageUrl },
    })
  } catch (error: any) {
    console.error("[Product Sectors API] Error creating sector:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product sector" },
      { status: 500 }
    )
  }
}
