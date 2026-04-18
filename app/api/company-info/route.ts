import { NextRequest, NextResponse } from "next/server"
import { db, getStorageBucket } from "@/lib/firebase-admin"

const COLLECTION = "companyInfo"

async function uploadImageToStorage(file: File): Promise<string> {
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
  const fromName = file.name.split(".").pop()?.toLowerCase()
  const mimeMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/svg+xml": "svg", "image/webp": "webp", "image/gif": "gif", "image/bmp": "bmp" }
  const fileExtension = (fromName && fromName.length > 0 && fromName !== file.name.toLowerCase()) ? fromName : (mimeMap[file.type] || "jpg")
  const fileName = `company_info/${timestamp}-${randomString}.${fileExtension}`

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

async function uploadImagesToStorage(files: File[]): Promise<string[]> {
  const uploads = files.map((file) => uploadImageToStorage(file))
  return Promise.all(uploads)
}

export async function GET() {
  try {
    const snapshot = await db.collection(COLLECTION).get()
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error fetching company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch company info" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const now = new Date().toISOString()
    const contentType = request.headers.get("content-type") || ""
    let payload: Record<string, any> = {}

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const companyImage = formData.get("company_image") as File | null
      const partnersImages = formData.getAll("partners_images") as File[]
      const partnersExisting = (formData.get("partners_existing") as string) || "[]"
      const riimImages = formData.getAll("riim_images") as File[]
      const riimExisting = (formData.get("riim_existing") as string) || "[]"

      let companyImageUrl = (formData.get("company_image_url") as string) || ""
      if (companyImage && companyImage instanceof File && companyImage.type.startsWith("image/")) {
        companyImageUrl = await uploadImageToStorage(companyImage)
      }


      let partnersUrls: string[] = []
      try {
        partnersUrls = JSON.parse(partnersExisting)
      } catch {
        partnersUrls = []
      }
      const partnerUploads = partnersImages.filter((file) => file.type.startsWith("image/"))
      if (partnerUploads.length) {
        const uploadedUrls = await uploadImagesToStorage(partnerUploads)
        partnersUrls = [...partnersUrls, ...uploadedUrls]
      }

      let riimUrls: string[] = []
      try {
        riimUrls = JSON.parse(riimExisting)
      } catch {
        riimUrls = []
      }
      const riimUploads = riimImages.filter((file) => file.type.startsWith("image/"))
      if (riimUploads.length) {
        const uploadedUrls = await uploadImagesToStorage(riimUploads)
        riimUrls = [...riimUrls, ...uploadedUrls].slice(0, 3)
      }

      payload = {
        address: String(formData.get("address") || "").trim(),
        company_phone: String(formData.get("company_phone") || "").trim(),
        company_description: String(formData.get("company_description") || "").trim(),
        delivery_info: String(formData.get("delivery_info") || "").trim(),
        company_image_url: companyImageUrl,
        partners_images: partnersUrls,
        riim_images: riimUrls,
        email: String(formData.get("email") || "").trim(),
        fb: String(formData.get("fb") || "").trim(),
        mobile_phone: String(formData.get("mobile_phone") || "").trim(),
        wechat: String(formData.get("wechat") || "").trim(),
        whatsup: String(formData.get("whatsup") || "").trim(),
        createdAt: now,
        updatedAt: now,
      }
    } else {
      const body = await request.json()
      payload = {
        address: String(body?.address || "").trim(),
        company_phone: String(body?.company_phone || "").trim(),
        company_description: String(body?.company_description || "").trim(),
        delivery_info: String(body?.delivery_info || "").trim(),
        company_image_url: String(body?.company_image_url || "").trim(),
        partners_images: Array.isArray(body?.partners_images) ? body.partners_images : [],
        riim_images: Array.isArray(body?.riim_images) ? body.riim_images.slice(0, 3) : [],
        email: String(body?.email || "").trim(),
        fb: String(body?.fb || "").trim(),
        mobile_phone: String(body?.mobile_phone || "").trim(),
        wechat: String(body?.wechat || "").trim(),
        whatsup: String(body?.whatsup || "").trim(),
        createdAt: now,
        updatedAt: now,
      }
    }

    const docRef = await db.collection(COLLECTION).add(payload)
    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...payload },
    })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error creating company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create company info" },
      { status: 500 }
    )
  }
}
