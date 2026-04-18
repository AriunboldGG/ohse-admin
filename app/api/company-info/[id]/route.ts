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
  const fileExtension = file.name.split(".").pop()
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const doc = await db.collection(COLLECTION).doc(id).get()
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Company info not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error fetching company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch company info" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const contentType = request.headers.get("content-type") || ""
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }

    const existingDoc = await db.collection(COLLECTION).doc(id).get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      if (formData.has("address")) updateData.address = String(formData.get("address") || "").trim()
      if (formData.has("company_phone")) updateData.company_phone = String(formData.get("company_phone") || "").trim()
      if (formData.has("company_description")) updateData.company_description = String(formData.get("company_description") || "").trim()
      if (formData.has("delivery_info")) updateData.delivery_info = String(formData.get("delivery_info") || "").trim()
      if (formData.has("email")) updateData.email = String(formData.get("email") || "").trim()
      if (formData.has("fb")) updateData.fb = String(formData.get("fb") || "").trim()
      if (formData.has("mobile_phone")) updateData.mobile_phone = String(formData.get("mobile_phone") || "").trim()
      if (formData.has("wechat")) updateData.wechat = String(formData.get("wechat") || "").trim()
      if (formData.has("whatsup")) updateData.whatsup = String(formData.get("whatsup") || "").trim()

      let companyImageUrl = (formData.get("company_image_url") as string) || (existingData?.company_image_url || "")
      const companyImage = formData.get("company_image") as File | null
      if (companyImage && companyImage instanceof File && companyImage.type.startsWith("image/")) {
        companyImageUrl = await uploadImageToStorage(companyImage)
      }
      updateData.company_image_url = companyImageUrl


      const partnersExisting = (formData.get("partners_existing") as string) || "[]"
      const riimExisting = (formData.get("riim_existing") as string) || "[]"
      let partnersUrls: string[] = []
      try {
        partnersUrls = JSON.parse(partnersExisting)
      } catch {
        partnersUrls = Array.isArray(existingData?.partners_images) ? existingData.partners_images : []
      }
      const partnersImages = formData.getAll("partners_images") as File[]
      const partnerUploads = partnersImages.filter((file) => file.type.startsWith("image/"))
      if (partnerUploads.length) {
        const uploadedUrls = await uploadImagesToStorage(partnerUploads)
        partnersUrls = [...partnersUrls, ...uploadedUrls]
      }
      updateData.partners_images = partnersUrls

      let riimUrls: string[] = []
      try {
        riimUrls = JSON.parse(riimExisting)
      } catch {
        riimUrls = Array.isArray(existingData?.riim_images) ? existingData.riim_images : []
      }
      const riimImages = formData.getAll("riim_images") as File[]
      const riimUploads = riimImages.filter((file) => file.type.startsWith("image/"))
      if (riimUploads.length) {
        const uploadedUrls = await uploadImagesToStorage(riimUploads)
        riimUrls = [...riimUrls, ...uploadedUrls].slice(0, 3)
      }
      updateData.riim_images = riimUrls
    } else {
      const body = await request.json()
      if (body?.address !== undefined) updateData.address = String(body.address).trim()
      if (body?.company_phone !== undefined) updateData.company_phone = String(body.company_phone).trim()
      if (body?.company_description !== undefined) updateData.company_description = String(body.company_description).trim()
      if (body?.delivery_info !== undefined) updateData.delivery_info = String(body.delivery_info).trim()
      if (body?.email !== undefined) updateData.email = String(body.email).trim()
      if (body?.fb !== undefined) updateData.fb = String(body.fb).trim()
      if (body?.mobile_phone !== undefined) updateData.mobile_phone = String(body.mobile_phone).trim()
      if (body?.wechat !== undefined) updateData.wechat = String(body.wechat).trim()
      if (body?.whatsup !== undefined) updateData.whatsup = String(body.whatsup).trim()
      if (body?.company_image_url !== undefined) updateData.company_image_url = String(body.company_image_url).trim()
      if (body?.partners_images !== undefined) updateData.partners_images = Array.isArray(body.partners_images) ? body.partners_images : []
      if (body?.riim_images !== undefined) {
        updateData.riim_images = Array.isArray(body.riim_images) ? body.riim_images.slice(0, 3) : []
      }
    }

    await db.collection(COLLECTION).doc(id).update(updateData)
    const updatedDoc = await db.collection(COLLECTION).doc(id).get()
    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error updating company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update company info" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    await db.collection(COLLECTION).doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error deleting company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete company info" },
      { status: 500 }
    )
  }
}
