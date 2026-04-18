import { NextRequest, NextResponse } from "next/server";
import { db, getStorageBucket } from "@/lib/firebase-admin";
import admin from "firebase-admin";

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

const getNextProductCode = async (): Promise<string> => {
  const counterRef = db.collection("counters").doc("product_code")

  return db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    let current = counterSnap.exists ? Number(counterSnap.data()?.current || 0) : 0

    const next = current + 1
    transaction.set(counterRef, { current: next }, { merge: true })
    return `BK-${String(next).padStart(7, "0")}`
  })
}

// GET - Fetch all products (with optional filters)
export async function GET(request: NextRequest) {
  try {
    console.log("[Products API] Fetching products from Firestore...");
    
    // Check if db is initialized
    if (!db) {
      const errorMsg = "Firestore database is not initialized. Check Firebase Admin configuration. " +
        "In production, ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.";
      console.error("[Products API]", errorMsg);
      throw new Error(errorMsg);
    }
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const stockStatus = searchParams.get("stockStatus");
    const cat = searchParams.get("cat");
    const subcat = searchParams.get("subcat");

    // Start with base query
    let query: admin.firestore.Query = db.collection("products");

    // Add filters if provided
    if (categoryId) {
      query = query.where("categoryId", "==", categoryId);
    }
    if (stockStatus) {
      query = query.where("stockStatus", "==", stockStatus);
    }
    if (cat) {
      query = query.where("cat", "==", cat);
    }
    if (subcat) {
      query = query.where("subcat", "==", subcat);
    }

    // Execute query
    console.log("[Products API] Executing Firestore query...");
    const productsSnapshot = await query.get();
    console.log(`[Products API] Found ${productsSnapshot.docs.length} products`);
    
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ 
      success: true, 
      data: products,
      count: products.length 
    });
  } catch (error: any) {
    console.error("[Products API] Error fetching products:", error);
    console.error("[Products API] Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      nodeEnv: process.env.NODE_ENV,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    });
    
    // Provide helpful error message for production
    let errorMessage = error?.message || "Failed to fetch products";
    if (error?.message?.includes("not initialized") || error?.message?.includes("Missing required")) {
      errorMessage = "Firebase configuration error. Please check environment variables in production settings.";
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: error?.code,
        details: process.env.NODE_ENV === "development" ? error?.stack : "Check server logs for details"
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
          `https://console.firebase.google.com/project/ohse-backend/storage ` +
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

// POST - Create a new product (supports both JSON and FormData)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    let productData: any;
    let imageUrls: string[] = [];

    // Check if request is FormData (multipart/form-data)
    // Note: Browser automatically sets Content-Type with boundary when using FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // Extract product fields from FormData
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
        color: formData.get("color") ? (formData.get("color") as string).split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0) : [],
        size: formData.get("size") ? (formData.get("size") as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
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
        createdAt: new Date().toISOString(),
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

      // Upload images to Firebase Storage
      if (imageFiles.length > 0) {
        imageUrls = await uploadImagesToStorage(imageFiles);
      }

      // Add image URLs to product data
      productData.images = imageUrls;

      // Handle brand image upload
      const brandImageFile = formData.get("brand_image") as File;
      if (brandImageFile && brandImageFile instanceof File && brandImageFile.type.startsWith('image/')) {
        const brandImageUrls = await uploadImagesToStorage([brandImageFile]);
        if (brandImageUrls.length > 0) {
          productData.brand_image = brandImageUrls[0];
        }
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (productData.sale_price === undefined) {
      delete productData.sale_price
    }

    productData.product_code = await getNextProductCode()
    const docRef = await db.collection("products").add(productData);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...productData },
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

