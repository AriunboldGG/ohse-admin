import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { PriceQuote } from "@/lib/types";

// GET - Fetch all quotes (with optional date filters)
export async function GET(request: NextRequest) {
  try {
    console.log("[Quotes API] Fetching quotes from Firestore...");
    
    // Note: db is a proxy that initializes on first access
    // If Firebase Admin is not configured, it will throw an error when we try to use db
    
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Start with base query
    let query: admin.firestore.Query = db.collection("quotes");

    // Convert date strings to Firestore Timestamps for proper comparison
    // Date format from input: "YYYY-MM-DD"
    let startDateTimestamp: admin.firestore.Timestamp | null = null;
    let endDateTimestamp: admin.firestore.Timestamp | null = null;

    if (startDateParam) {
      // Parse the date string and set to start of day
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      startDateTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    }

    if (endDateParam) {
      // Parse the date string and set to end of day
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      endDateTimestamp = admin.firestore.Timestamp.fromDate(endDate);
    }

    // Add date filters if provided
    // Note: Firestore requires an index for range queries on different fields
    // If you get an index error, create the index in Firebase Console
    if (startDateTimestamp && endDateTimestamp) {
      // Both dates provided - use range query
      query = query
        .where("createdAt", ">=", startDateTimestamp)
        .where("createdAt", "<=", endDateTimestamp)
        .orderBy("createdAt", "desc");
    } else if (startDateTimestamp) {
      // Only start date
      query = query
        .where("createdAt", ">=", startDateTimestamp)
        .orderBy("createdAt", "desc");
    } else if (endDateTimestamp) {
      // Only end date
      query = query
        .where("createdAt", "<=", endDateTimestamp)
        .orderBy("createdAt", "desc");
    } else {
      // No date filters - just order by createdAt
      query = query.orderBy("createdAt", "desc");
    }

    // Execute query
    console.log("[Quotes API] Executing Firestore query...");
    const quotesSnapshot = await query.get();
    console.log(`[Quotes API] Found ${quotesSnapshot.docs.length} quotes`);
    
    const quotes = quotesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        // Map 'items' from Firestore to 'selectedProducts' for the app
        // Handle both 'items' and 'selectedProducts' field names
        const items = data.items || data.selectedProducts || [];
        
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
            status: item.status || item.status_type || "pending",
            status_type: item.status || item.status_type || "pending", // Prefer status when available
            // Include all other fields from Firestore
            brand: item.brand || "",
            color: item.color || "",
            img: item.img || "",
            modelNumber: item.modelNumber || item.model_number || "",
            price: item.price || 0,
            priceNum: item.priceNum || item.price_num || 0,
            size: item.size || "",
            product_code: item.product_code || item.productCode || "",
            unit_of_measurement: item.unit_of_measurement || item.unitOfMeasurement || item.unit || "ш",
            delivery_time: item.delivery_time || item.deliveryTime || "",
            transaction_description: item.transaction_description || item.transactionDescription || item.productName || "",
            stockStatus: item.stockStatus || item.stock_status || "inStock", // Product stock status (inStock or preOrder)
            // Include any other fields that might exist
            ...(item.id !== undefined && { id: item.id }),
          };
        }) : [];
        
        // Convert Firestore Timestamps to ISO strings
        let createdAt: string;
        if (data.createdAt) {
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
          console.warn(`[Quotes API] Quote ${doc.id} missing createdAt, using current date`);
          createdAt = new Date().toISOString();
        }
        
        console.log(`[Quotes API] Quote ${doc.id} createdAt:`, createdAt);
        
        let updatedAt: string | undefined;
        if (data.updatedAt) {
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
          data.additionalInfo ||
          data.note ||
          data.additionalNote ||
          data.additional_note ||
          data.additional_info ||
          data.customerNote ||
          data.customer_note ||
          data.comment ||
          data.message ||
          "";
        
        const quoteData: any = {
          id: doc.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          additionalInfo: additionalInfo, // Map both 'note' and 'additionalInfo' to 'additionalInfo'
          company: data.company || "",
          companyNote: data.companyNote || "",
          companyAddress: data.companyAddress || "",
          companyEmail: data.companyEmail || "",
          companyPhone: data.companyPhone || "",
          companyMobile: data.companyMobile || "",
          status: data.status || "pending",
          quoteStatus: data.quoteStatus || "new",
          createdAt, // Always include createdAt
          selectedProducts: normalizedItems,
        };
        
        // Only include updatedAt if it exists
        if (updatedAt) {
          quoteData.updatedAt = updatedAt;
        }
        
        return quoteData as PriceQuote;
      });
      
    // Log how many quotes were found
    console.log(`[Quotes API] Total quotes found: ${quotes.length}`);
    
    // Optional: Filter quotes where note/additionalInfo is not null/empty
    // Commented out to show all quotes - uncomment if you want to filter by note
    // const filteredQuotes = quotes.filter((quote) => {
    //   const note = quote.additionalInfo || (quote as any).note;
    //   return note && note.trim().length > 0;
    // });
    // console.log(`[Quotes API] Quotes after note filter: ${filteredQuotes.length}`);
    // quotes = filteredQuotes;

    console.log(`[Quotes API] Returning ${quotes.length} quotes to client`);

    return NextResponse.json({ 
      success: true, 
      data: quotes,
      count: quotes.length 
    });
  } catch (error: any) {
    console.error("[Quotes API] Error fetching quotes:", error);
    console.error("[Quotes API] Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      nodeEnv: process.env.NODE_ENV,
    });
    
    let errorMessage = error?.message || "Failed to fetch quotes";
    
    // Check for Firebase Admin initialization errors
    if (error?.message?.includes("not initialized") || 
        error?.message?.includes("Missing required") || 
        error?.message?.includes("Firebase Admin") ||
        error?.message?.includes(".env.local")) {
      // The error message from firebase-admin.ts already includes helpful instructions
      // Use it as-is, but ensure it's clear
      const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || !!process.env.VERCEL;
      if (isProduction && !errorMessage.includes("deployment platform")) {
        errorMessage = "Firebase Admin SDK is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables in your deployment platform.";
      } else if (!isProduction && !errorMessage.includes(".env.local")) {
        errorMessage = "Firebase Admin SDK is not configured. Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your .env.local file.";
      }
      // If the error message already has instructions, use it as-is
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

// POST - Create a new quote
export async function POST(request: NextRequest) {
  try {
    console.log("[Quotes API] Creating new quote...");
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const quoteData = await request.json();
    
    // Validate required fields
    if (!quoteData.firstName || !quoteData.lastName || !quoteData.email || !quoteData.company) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: firstName, lastName, email, company" },
        { status: 400 }
      );
    }

    const quoteToSave: Omit<PriceQuote, "id"> = {
      firstName: quoteData.firstName,
      lastName: quoteData.lastName,
      email: quoteData.email,
      phone: quoteData.phone || "",
      additionalInfo: quoteData.additionalInfo || "",
      company: quoteData.company,
      selectedProducts: quoteData.selectedProducts || [],
      status: quoteData.status || "pending",
      quoteStatus: quoteData.quoteStatus || "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("quotes").add(quoteToSave);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...quoteToSave },
    });
  } catch (error: any) {
    console.error("[Quotes API] Error creating quote:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to create quote",
        code: error?.code,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

