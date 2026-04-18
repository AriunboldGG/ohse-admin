import { NextRequest, NextResponse } from "next/server";
import { db, getStorageBucket } from "@/lib/firebase-admin";

const parseProductSector = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean)
        }
      } catch (error) {
        console.warn("[Products API] Failed to parse product_sector JSON:", error)
      }
    }
    if (trimmed.includes(",")) {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean)
    }
    return [trimmed]
  }
  return []
}

const formatProductCode = (value: unknown): string => {
  if (value === undefined || value === null) return ""
  const raw = String(value).trim()
  if (!raw) return ""
  if (/^BK-\d{7}$/.test(raw)) return raw
  const digits = raw.match(/\d+/g)?.join("") || ""
  if (!digits) return ""
  const normalized = digits.length > 7 ? digits.slice(-7) : digits.padStart(7, "0")
  return `BK-${normalized}`
}

// GET - Get a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const productData = doc.data();
    
    // Ensure color and size are arrays for consistency
    if (productData) {
      // Handle color field - ensure it's an array
      if (productData.color) {
        if (!Array.isArray(productData.color)) {
          productData.color = typeof productData.color === 'string' 
            ? productData.color.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
            : [];
        }
      } else {
        productData.color = [];
      }
      
      // Handle size field - ensure it's an array
      if (productData.size) {
        if (!Array.isArray(productData.size)) {
          productData.size = typeof productData.size === 'string' 
            ? productData.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : [];
        }
      } else {
        productData.size = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...productData },
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to fetch product",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to upload images to Firebase Storage
async function uploadImagesToStorage(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  
  let bucket;
  try {
    bucket = getStorageBucket();
    // Check if bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      console.warn(`Storage bucket "${bucket.name}" does not exist. Attempting to create it...`);
      try {
        // Try to create the bucket (this might fail if user doesn't have permissions)
        await bucket.create();
        console.log(`Successfully created storage bucket: ${bucket.name}`);
      } catch (createError: any) {
        console.error("Failed to create bucket:", createError);
        throw new Error(
          `Storage bucket "${bucket.name}" does not exist and could not be created automatically. ` +
          `Please enable Firebase Storage in Firebase Console: ` +
          `https://console.firebase.google.com/project/bayanundur-backend/storage ` +
          `The bucket will be created automatically when you enable Storage.`
        );
      }
    }
  } catch (error: any) {
    console.error("Error accessing storage bucket:", error);
    const bucketName = bucket?.name || 'unknown';
    
    // Provide helpful error message
    if (error.message.includes('does not exist')) {
      throw error; // Re-throw our custom error
    }
    
    throw new Error(`Storage bucket error (${bucketName}): ${error.message || 'Bucket not accessible. Please check Firebase Storage configuration.'}`);
  }
  
  const uploadPromises = files.map(async (file) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `products/${timestamp}-${randomString}.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Upload to Firebase Storage
      const fileRef = bucket.file(fileName);
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return publicUrl;
    } catch (uploadError: any) {
      console.error(`Error uploading file ${file.name}:`, uploadError);
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message || 'Unknown error'}`);
    }
  });

  return Promise.all(uploadPromises);
}

// PUT - Update a product (supports both JSON and FormData)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const contentType = request.headers.get("content-type") || "";
    
    let productData: any;
    let imageUrls: string[] = [];

    // Check if request is FormData (multipart/form-data)
    // Note: Browser automatically sets Content-Type with boundary when using FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // Get existing product to preserve existing images
      const existingProduct = await db.collection("products").doc(id).get();
      const existingData = existingProduct.exists ? existingProduct.data() : {};
      const existingImages = existingData?.images || [];
      
      // Extract product fields from FormData
      const colorValue = formData.get("color") as string;
      const sizeValue = formData.get("size") as string;
      const productTypesValue = formData.get("productTypes") as string;
      let productTypes: string[] = [];
      if (productTypesValue) {
        try {
          productTypes = JSON.parse(productTypesValue);
        } catch (e) {
          // If parsing fails, treat as comma-separated string
          productTypes = productTypesValue.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
        }
      }
      
      const productSectorValue = formData.get("product_sector")
      productData = {
        name: formData.get("name") as string,
        name_en: (formData.get("name_en") as string) || "",
        youtube_url: (formData.get("youtube_url") as string) || "",
        price: parseFloat(formData.get("price") as string),
        sale_price: formData.get("sale_price")
          ? parseFloat(formData.get("sale_price") as string)
          : undefined,
        stock: parseInt(formData.get("stock") as string),
        brand: formData.get("brand") as string,
        color: colorValue ? colorValue.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0) : [],
        size: sizeValue ? sizeValue.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
        material: formData.get("material") as string || "",
        manufacture_country: formData.get("manufacture_country") as string || "",
        description: formData.get("description") as string || "",
        feature: formData.get("feature") as string || "",
        mainCategory: formData.get("mainCategory") as string || "",
        category: formData.get("category") as string,
        subcategory: formData.get("subcategory") as string || "",
        product_sector: parseProductSector(productSectorValue),
        model_number: formData.get("model_number") as string || "",
        product_code: formatProductCode(formData.get("product_code")),
        productTypes: productTypes,
        updatedAt: new Date().toISOString(),
      };

      // Extract image files from FormData
      const imageFiles: File[] = [];
      const imageFilesData = formData.getAll("images") as File[];
      
      for (const file of imageFilesData) {
        if (file instanceof File && file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }

      // Upload new images to Firebase Storage
      if (imageFiles.length > 0) {
        imageUrls = await uploadImagesToStorage(imageFiles);
      }

      // Get existing image URLs from FormData (if any were preserved)
      const existingImageUrls = formData.get("existingImages") as string;
      const preservedImages = existingImageUrls ? JSON.parse(existingImageUrls) : existingImages;

      // Combine preserved and newly uploaded images
      productData.images = [...preservedImages, ...imageUrls];

      // Handle brand image upload
      const brandImageFile = formData.get("brand_image") as File;
      const brandImageUrl = formData.get("brand_image_url") as string;
      
      if (brandImageFile && brandImageFile instanceof File && brandImageFile.type.startsWith('image/')) {
        // Upload new brand image
        const brandImageUrls = await uploadImagesToStorage([brandImageFile]);
        if (brandImageUrls.length > 0) {
          productData.brand_image = brandImageUrls[0];
        }
      } else if (brandImageUrl) {
        // Preserve existing brand image URL
        productData.brand_image = brandImageUrl;
      } else {
        // Preserve existing brand image from database if no new file and no URL provided
        productData.brand_image = existingData?.brand_image || "";
      }
    } else {
      // Handle JSON request (backward compatibility)
      const body = await request.json();
      const { 
        name, 
        name_en,
        youtube_url,
        price, 
        sale_price,
        stock, 
        brand, 
        color, 
        size, 
        manufacture_country,
        category, 
        subcategory, 
        product_sector,
        model_number,
        product_code,
        brand_image,
        images,
        material,
        description,
        feature,
        mainCategory,
        productTypes,
      } = body;

      productData = {
        name,
        name_en: name_en || "",
        youtube_url: youtube_url || "",
        price: typeof price === 'number' ? price : parseFloat(price),
        sale_price: sale_price !== undefined && sale_price !== null && sale_price !== ""
          ? (typeof sale_price === 'number' ? sale_price : parseFloat(sale_price))
          : undefined,
        stock: typeof stock === 'number' ? stock : parseInt(stock),
        brand,
        color: Array.isArray(color) ? color : (color ? color.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0) : []),
        size: Array.isArray(size) ? size : (size ? size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []),
        material: material || "",
        manufacture_country: manufacture_country || "",
        description: description || "",
        feature: feature || "",
        mainCategory: mainCategory || "",
        category: category || "",
        subcategory: subcategory || "",
        product_sector: parseProductSector(product_sector),
        model_number: model_number || "",
        product_code: formatProductCode(product_code),
        brand_image: brand_image || "",
        productTypes: Array.isArray(productTypes) ? productTypes : [],
        images: images || [],
        updatedAt: new Date().toISOString(),
      };
    }

    if (productData.sale_price === undefined) {
      delete productData.sale_price
    }

    await db.collection("products").doc(id).update(productData);

    return NextResponse.json({
      success: true,
      data: { id, ...productData },
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    await db.collection("products").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

