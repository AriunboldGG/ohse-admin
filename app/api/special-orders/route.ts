import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { SpecialOrder } from "@/lib/types";

// GET - Fetch all special orders (with optional date filters)
export async function GET(request: NextRequest) {
  try {
    console.log("[Special Orders API] Fetching special orders from Firestore...");
    
    // Check if db is initialized
    if (!db) {
      const errorMsg = "Firestore database is not initialized. Check Firebase Admin configuration. " +
        "In production, ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.";
      console.error("[Special Orders API]", errorMsg);
      throw new Error(errorMsg);
    }
    
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Start with base query
    let query: admin.firestore.Query = db.collection("special_quotes");

    // Convert date strings to Firestore Timestamps for proper comparison
    let startDateTimestamp: admin.firestore.Timestamp | null = null;
    let endDateTimestamp: admin.firestore.Timestamp | null = null;

    if (startDateParam) {
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      startDateTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    }

    if (endDateParam) {
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      endDateTimestamp = admin.firestore.Timestamp.fromDate(endDate);
    }

    // Add date filters if provided
    if (startDateTimestamp && endDateTimestamp) {
      query = query
        .where("createdAt", ">=", startDateTimestamp)
        .where("createdAt", "<=", endDateTimestamp)
        .orderBy("createdAt", "desc");
    } else if (startDateTimestamp) {
      query = query
        .where("createdAt", ">=", startDateTimestamp)
        .orderBy("createdAt", "desc");
    } else if (endDateTimestamp) {
      query = query
        .where("createdAt", "<=", endDateTimestamp)
        .orderBy("createdAt", "desc");
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    // Execute query
    console.log("[Special Orders API] Executing Firestore query...");
    const ordersSnapshot = await query.get();
    console.log(`[Special Orders API] Found ${ordersSnapshot.docs.length} special orders`);
    
    const orders = ordersSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        
        // Convert Firestore Timestamps to ISO strings
        let createdAt: string;
        if (data.createdAt) {
          if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (data.createdAt.seconds) {
            createdAt = new Date(data.createdAt.seconds * 1000).toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
          } else {
            createdAt = new Date(data.createdAt).toISOString();
          }
        } else {
          console.warn(`[Special Orders API] Order ${doc.id} missing createdAt, using current date`);
          createdAt = new Date().toISOString();
        }
        
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
        
        const orderData: any = {
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          // Check multiple possible field names for company/organization name
          organizationName: data.organizationName || data.organization || data.company || data["Байгууллагын нэр"] || "",
          productName: data.productName || "",
          productDescription: data.productDescription || "",
          quantity: data.quantity || "",
          technicalRequirements: data.technicalRequirements || "",
          additionalInfo: data.additionalInfo || "",
          createdAt,
        };
        
        if (updatedAt) {
          orderData.updatedAt = updatedAt;
        }
        
        return orderData as SpecialOrder;
      });
      
    console.log(`[Special Orders API] Returning ${orders.length} special orders to client`);

    return NextResponse.json({ 
      success: true, 
      data: orders,
      count: orders.length 
    });
  } catch (error: any) {
    console.error("[Special Orders API] Error fetching special orders:", error);
    
    let errorMessage = error?.message || "Failed to fetch special orders";
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

// POST - Create a new special order
export async function POST(request: NextRequest) {
  try {
    console.log("[Special Orders API] Creating new special order...");
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const orderData = await request.json();
    
    // Validate required fields
    if (!orderData.name || !orderData.email || !orderData.phone || !orderData.productName || !orderData.productDescription || !orderData.quantity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email, phone, productName, productDescription, quantity" },
        { status: 400 }
      );
    }

    const orderToSave: Omit<SpecialOrder, "id"> = {
      name: orderData.name,
      email: orderData.email,
      phone: orderData.phone,
      organizationName: orderData.organizationName || "",
      productName: orderData.productName,
      productDescription: orderData.productDescription,
      quantity: orderData.quantity,
      technicalRequirements: orderData.technicalRequirements || "",
      additionalInfo: orderData.additionalInfo || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("special_quotes").add(orderToSave);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...orderToSave },
    });
  } catch (error: any) {
    console.error("[Special Orders API] Error creating special order:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to create special order",
        code: error?.code,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
