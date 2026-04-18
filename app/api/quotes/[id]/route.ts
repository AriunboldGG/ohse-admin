import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { PriceQuote } from "@/lib/types";

// GET - Fetch a single quote by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    console.log(`[Quotes API] Fetching quote ${id}...`);
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const doc = await db.collection("quotes").doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const data = doc.data();
    
    // Map 'items' from Firestore to 'selectedProducts' for the app
    const items = data?.items || data?.selectedProducts || [];
    
    // Normalize the items array structure
    const normalizedItems = Array.isArray(items) ? items.map((item: any, index: number) => {
      // Handle different field name variations
      // Quantity: check quantity, qty, amount fields (preserve 0 values)
      const quantity = item.quantity !== undefined && item.quantity !== null 
        ? item.quantity 
        : (item.qty !== undefined && item.qty !== null 
            ? item.qty 
            : (item.amount !== undefined && item.amount !== null 
                ? item.amount 
                : null));
      
      return {
        productId: item.productId || item.id || item.product_id || `product-${index}`,
        productName: item.productName || item.name || item.product_name || item.product || "Unknown Product",
        quantity: quantity, // Preserve actual quantity value (including 0)
        status: item.status || "pending",
      };
    }) : [];
    
    // Convert Firestore Timestamps to ISO strings
    let createdAt: string;
    if (data?.createdAt) {
      if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
        // Firestore Timestamp with toDate() method
        createdAt = data.createdAt.toDate().toISOString();
      } else if (data.createdAt.seconds) {
        // Firestore Timestamp with seconds property
        createdAt = new Date(data.createdAt.seconds * 1000).toISOString();
      } else if (typeof data.createdAt === 'string') {
        // Already a string
        createdAt = data.createdAt;
      } else {
        // Try to convert to Date
        createdAt = new Date(data.createdAt).toISOString();
      }
    } else {
      // Fallback to current date if createdAt doesn't exist
      createdAt = new Date().toISOString();
    }
    
    let updatedAt: string | undefined;
    if (data?.updatedAt) {
      if (data.updatedAt.toDate && typeof data.updatedAt.toDate === 'function') {
        updatedAt = data.updatedAt.toDate().toISOString();
      } else if (data.updatedAt.seconds) {
        updatedAt = new Date(data.updatedAt.seconds * 1000).toISOString();
      } else if (typeof data.updatedAt === 'string') {
        updatedAt = data.updatedAt;
      } else {
        updatedAt = new Date(data.updatedAt).toISOString();
      }
    }
    
    // Build the quote object, ensuring createdAt is always included
    // Handle different field name variations for customer additional note
    const additionalInfo =
      data?.additionalInfo ||
      data?.note ||
      data?.additionalNote ||
      data?.additional_note ||
      data?.additional_info ||
      data?.customerNote ||
      data?.customer_note ||
      data?.comment ||
      data?.message ||
      "";
    
    const quoteData: any = {
      id: doc.id,
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      email: data?.email || "",
      phone: data?.phone || "",
      additionalInfo: additionalInfo, // Map both 'note' and 'additionalInfo' to 'additionalInfo'
      company: data?.company || "",
      companyNote: data?.companyNote || "",
      companyAddress: data?.companyAddress || "",
      companyEmail: data?.companyEmail || "",
      companyPhone: data?.companyPhone || "",
      companyMobile: data?.companyMobile || "",
      status: data?.status || "pending",
      quoteStatus: data?.quoteStatus || "new",
      createdAt, // Always include createdAt
      selectedProducts: normalizedItems,
    };
    
    // Only include updatedAt if it exists
    if (updatedAt) {
      quoteData.updatedAt = updatedAt;
    }
    
    const quote = quoteData as PriceQuote;

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error("[Quotes API] Error fetching quote:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to fetch quote",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

// PUT - Update a quote
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    console.log(`[Quotes API] Updating quote ${id}...`);
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const quoteData = await request.json();
    
    // Build update object (only include fields that are provided)
    // Filter out empty strings as Firestore doesn't allow them
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Helper function to safely add field (skip empty strings)
    const addField = (key: string, value: any) => {
      if (value !== undefined) {
        // Only skip if it's an empty string, allow other falsy values like 0, false, null
        if (value !== "") {
          updateData[key] = value;
        }
      }
    };

    addField("firstName", quoteData.firstName);
    addField("lastName", quoteData.lastName);
    addField("email", quoteData.email);
    addField("phone", quoteData.phone);
    addField("additionalInfo", quoteData.additionalInfo);
    addField("company", quoteData.company);
    addField("companyNote", quoteData.companyNote);
    addField("companyAddress", quoteData.companyAddress);
    addField("companyEmail", quoteData.companyEmail);
    addField("companyPhone", quoteData.companyPhone);
    addField("companyMobile", quoteData.companyMobile);
    
    // Handle selectedProducts/items - always include if provided (even if empty array)
    if (quoteData.selectedProducts !== undefined) {
      updateData.selectedProducts = quoteData.selectedProducts;
      // Also update 'items' field for backward compatibility
      updateData.items = quoteData.selectedProducts;
    }
    
    addField("status", quoteData.status);
    addField("quoteStatus", quoteData.quoteStatus);

    await db.collection("quotes").doc(id).update(updateData);

    // Fetch updated document
    const updatedDoc = await db.collection("quotes").doc(id).get();
    const data = updatedDoc.data();
    const items = data?.selectedProducts || data?.items || [];
    const normalizedItems = Array.isArray(items)
      ? items.map((item: any, index: number) => ({
          ...item,
          productId: item.productId || item.id || item.product_id || `product-${index}`,
        }))
      : [];

    // Handle different field name variations for customer additional note
    const additionalInfo =
      data?.additionalInfo ||
      data?.note ||
      data?.additionalNote ||
      data?.additional_note ||
      data?.additional_info ||
      data?.customerNote ||
      data?.customer_note ||
      data?.comment ||
      data?.message ||
      "";

    const updatedQuote: PriceQuote = {
      id: updatedDoc.id,
      ...data,
      additionalInfo,
      selectedProducts: normalizedItems,
    } as PriceQuote;

    return NextResponse.json({
      success: true,
      data: updatedQuote,
    });
  } catch (error: any) {
    console.error("[Quotes API] Error updating quote:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to update quote",
        code: error?.code,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    console.log(`[Quotes API] Deleting quote ${id}...`);
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    await db.collection("quotes").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Quote deleted successfully",
    });
  } catch (error: any) {
    console.error("[Quotes API] Error deleting quote:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to delete quote",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

