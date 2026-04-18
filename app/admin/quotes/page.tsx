"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, CheckCircle, XCircle, Download, FileDown, FileText, Trash2, Mail, Loader2 } from "lucide-react"
import { PriceQuote } from "@/lib/types"
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType, BorderStyle, LineRuleType } from "docx"
import { saveAs } from "file-saver"

// Mock data removed - now fetching from Firebase

const statusColors = {
  sent_offer: "bg-blue-100 text-blue-800 border-blue-200",
  create_invoice: "bg-purple-100 text-purple-800 border-purple-200",
  spent: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels = {
  sent_offer: "Үнийн санал",
  create_invoice: "Нэхэмжлэл",
  spent: "Зарлагын баримт",
  pending: "Хүлээгдэж буй",
}

const stockStatusColors = {
  inStock: "bg-green-100 text-green-800 border-green-200",
  preOrder: "bg-orange-100 text-orange-800 border-orange-200",
}

const stockStatusLabels = {
  inStock: "Бэлэн байгаа",
  preOrder: "Захиалгаар",
}


export default function QuotesPage() {
  const [quotes, setQuotes] = useState<PriceQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<PriceQuote | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSendOfferDialogOpen, setIsSendOfferDialogOpen] = useState(false)
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)
  const [isSpentDialogOpen, setIsSpentDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [invoicePrices, setInvoicePrices] = useState<Record<string, string>>({})
  const [editingInvoicePriceId, setEditingInvoicePriceId] = useState<string | null>(null)
  const [invoiceQuantities, setInvoiceQuantities] = useState<Record<string, number>>({})
  const [invoiceDeliveryTimes, setInvoiceDeliveryTimes] = useState<Record<string, string>>({})
  const [invoiceNumber, setInvoiceNumber] = useState<string>("")
  const [invoiceDate, setInvoiceDate] = useState<string>("")
  const [paymentDueDate, setPaymentDueDate] = useState<string>("")
  const [spentPrices, setSpentPrices] = useState<Record<string, string>>({})
  const [spentQuantities, setSpentQuantities] = useState<Record<string, number>>({})
  const [spentDeliveryTimes, setSpentDeliveryTimes] = useState<Record<string, string>>({})
  const [spentNumber, setSpentNumber] = useState<string>("")
  const [spentDate, setSpentDate] = useState<string>("")
  const [selectedForSendOffer, setSelectedForSendOffer] = useState<Set<string>>(new Set())
  const [selectedForInvoice, setSelectedForInvoice] = useState<Set<string>>(new Set())
  const [selectedForSpent, setSelectedForSpent] = useState<Set<string>>(new Set())
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState<string>("")
  const [quoteDate, setQuoteDate] = useState<string>("")
  const [companyNote, setCompanyNote] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("БАЯН ӨНДӨР ХХК")
  const [companyAddress, setCompanyAddress] = useState<string>("УБ хот, Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө, Мишээл сити оффис М1 тауэр, 11 давхарт, 1107, 1108 тоот")
  const [companyEmail, setCompanyEmail] = useState<string>("sales1@bayan-undur.mn")
  const [companyPhone, setCompanyPhone] = useState<string>("70118585")
  const [companyMobile, setCompanyMobile] = useState<string>("99080867")
  const [companyRegNumber, setCompanyRegNumber] = useState<string>("5332044")
  const [companyBankName, setCompanyBankName] = useState<string>("Худалдаа хөгжлийн банк")
  const [companyAccountNumber, setCompanyAccountNumber] = useState<string>("MN610004000 415148288")
  const [buyerRegNumber, setBuyerRegNumber] = useState<string>("")
  const [sendOfferQuantities, setSendOfferQuantities] = useState<Record<string, number>>({})
  const [sendOfferDeliveryTimes, setSendOfferDeliveryTimes] = useState<Record<string, string>>({})
  const [isSavingSendOffer, setIsSavingSendOffer] = useState(false)
  const [isSavingInvoice, setIsSavingInvoice] = useState(false)
  const [isSavingSpent, setIsSavingSpent] = useState(false)

  // Generate quote number when dialog opens
  useEffect(() => {
    if (isSendOfferDialogOpen && selectedQuote) {
      const currentDate = new Date().toISOString().split("T")[0]
      setQuoteDate(currentDate)
      
      // Initialize Компанийн тэмдэглэл and company info from saved data
      setCompanyName((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК")
      setCompanyNote((selectedQuote as any).companyNote || "")
      setCompanyAddress((selectedQuote as any).companyAddress || "УБ хот, Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө, Мишээл сити оффис М1 тауэр, 11 давхарт, 1107, 1108 тоот")
      setCompanyEmail((selectedQuote as any).companyEmail || "sales1@bayan-undur.mn")
      setCompanyPhone((selectedQuote as any).companyPhone || "70118585")
      setCompanyMobile((selectedQuote as any).companyMobile || "99080867")
      setCompanyRegNumber((selectedQuote as any).companyRegNumber || "5332044")
      setCompanyBankName((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк")
      setCompanyAccountNumber((selectedQuote as any).companyAccountNumber || "MN610004000 415148288")
      setBuyerRegNumber((selectedQuote as any).buyerRegNumber || "")
      
      // Initialize quantities and delivery times for selected products
      const initialQuantities: Record<string, number> = {}
      const initialDeliveryTimes: Record<string, string> = {}
      selectedQuote.selectedProducts
        .filter((product, index) => selectedForSendOffer.has(getProductKey(product, index)))
        .forEach((product, index) => {
          const productId = getProductKey(product, index)
          if (!productId) return
          initialQuantities[productId] = product.quantity || 0
          initialDeliveryTimes[productId] = (product as any).delivery_time || (product as any).deliveryTime || ""
        })
      setSendOfferQuantities(initialQuantities)
      setSendOfferDeliveryTimes(initialDeliveryTimes)
      
      // Generate quote number asynchronously
      let isMounted = true
      generateQuoteNumber(currentDate)
        .then((number) => {
          if (isMounted) {
            setQuoteNumber(number)
          }
        })
        .catch((error) => {
          console.error("Error generating quote number:", error)
          if (isMounted) {
            // Fallback: generate a simple number if API fails
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, '0')
            const day = String(new Date().getDate()).padStart(2, '0')
            setQuoteNumber(`BU-QT-${year}${month}${day}-001`)
          }
        })
      
      return () => {
        isMounted = false
      }
    } else if (!isSendOfferDialogOpen) {
      // Reset when dialog closes
      setQuoteNumber("")
      setQuoteDate("")
      setCompanyName("БАЯН ӨНДӨР ХХК")
      setCompanyNote("")
      setCompanyAddress("УБ хот, Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө, Мишээл сити оффис М1 тауэр, 11 давхарт, 1107, 1108 тоот")
      setCompanyEmail("sales1@bayan-undur.mn")
      setCompanyPhone("70118585")
      setCompanyMobile("99080867")
      setCompanyRegNumber("5332044")
      setCompanyBankName("Худалдаа хөгжлийн банк")
      setCompanyAccountNumber("MN610004000 415148288")
      setBuyerRegNumber("")
      setSendOfferQuantities({})
      setSendOfferDeliveryTimes({})
    }
  }, [isSendOfferDialogOpen, selectedQuote?.id])

  // Generate invoice number when invoice dialog opens
  useEffect(() => {
    if (isCreateInvoiceDialogOpen && selectedQuote) {
      const currentDate = new Date().toISOString().split("T")[0]
      setInvoiceDate(currentDate)

      // Initialize quantities and delivery times for selected products
      const initialQuantities: Record<string, number> = {}
      const initialDeliveryTimes: Record<string, string> = {}
      selectedQuote.selectedProducts
        .filter((product, index) => selectedForInvoice.has(getProductKey(product, index)))
        .forEach((product, index) => {
          const productId = getProductKey(product, index)
          if (!productId) return
          initialQuantities[productId] = product.quantity || 0
          initialDeliveryTimes[productId] = (product as any).delivery_time || (product as any).deliveryTime || ""
        })
      setInvoiceQuantities(initialQuantities)
      setInvoiceDeliveryTimes(initialDeliveryTimes)

      // Use saved invoice number/date if available, otherwise generate new
      const savedInvoiceNumber = (selectedQuote as any).invoiceNumber || ""
      const savedInvoiceDate = (selectedQuote as any).invoiceDate || ""
      const savedPaymentDueDate = (selectedQuote as any).paymentDueDate || ""
      if (savedInvoiceNumber) {
        setInvoiceNumber(savedInvoiceNumber)
      } else {
        generateInvoiceNumber(currentDate)
          .then((number) => setInvoiceNumber(number))
          .catch((error) => {
            console.error("Error generating invoice number:", error)
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, '0')
            const day = String(new Date().getDate()).padStart(2, '0')
            setInvoiceNumber(`BU-INV-${year}${month}${day}-001`)
          })
      }
      if (savedInvoiceDate) {
        setInvoiceDate(savedInvoiceDate)
      }
      if (savedPaymentDueDate) {
        setPaymentDueDate(savedPaymentDueDate)
      }
    } else if (!isCreateInvoiceDialogOpen) {
      setInvoiceNumber("")
      setInvoiceDate("")
      setPaymentDueDate("")
      setInvoiceQuantities({})
      setInvoiceDeliveryTimes({})
    }
  }, [isCreateInvoiceDialogOpen, selectedQuote?.id])

  // Generate spent number when expense receipt dialog opens
  useEffect(() => {
    if (isSpentDialogOpen && selectedQuote) {
      const currentDate = new Date().toISOString().split("T")[0]
      setSpentDate(currentDate)

      // Initialize quantities and delivery times for selected products
      const initialQuantities: Record<string, number> = {}
      const initialDeliveryTimes: Record<string, string> = {}
      selectedQuote.selectedProducts
        .filter((product, index) => selectedForSpent.has(getProductKey(product, index)))
        .forEach((product, index) => {
          const productId = getProductKey(product, index)
          if (!productId) return
          initialQuantities[productId] = product.quantity || 0
          initialDeliveryTimes[productId] = (product as any).delivery_time || (product as any).deliveryTime || ""
        })
      setSpentQuantities(initialQuantities)
      setSpentDeliveryTimes(initialDeliveryTimes)

      // Use saved spent number/date if available, otherwise generate new
      const savedSpentNumber = (selectedQuote as any).spentNumber || ""
      const savedSpentDate = (selectedQuote as any).spentDate || ""
      if (savedSpentNumber) {
        setSpentNumber(savedSpentNumber)
      } else {
        generateSpentNumber(currentDate)
          .then((number) => setSpentNumber(number))
          .catch((error) => {
            console.error("Error generating spent number:", error)
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, '0')
            const day = String(new Date().getDate()).padStart(2, '0')
            setSpentNumber(`BU-EXP-${year}${month}${day}-001`)
          })
      }
      if (savedSpentDate) {
        setSpentDate(savedSpentDate)
      }
    } else if (!isSpentDialogOpen) {
      setSpentNumber("")
      setSpentDate("")
      setSpentQuantities({})
      setSpentDeliveryTimes({})
    }
  }, [isSpentDialogOpen, selectedQuote?.id])

  // Function to generate quote number in format: BU-QT-YYYYMMDD-XXX
  const generateQuoteNumber = async (quoteDate?: string): Promise<string> => {
    // Use provided date or current date
    const date = quoteDate ? new Date(quoteDate) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}` // YYYYMMDD format
    
    // Format: BU-QT-YYYYMMDD-XXX
    const prefix = `BU-QT-${dateStr}`
    
    try {
      // Fetch all quotes to check for existing quote numbers
      const response = await fetch("/api/quotes")
      const result = await response.json()
      
      if (result.success) {
        // Filter quotes that match the date pattern
        const sameDateQuotes = result.data.filter((quote: PriceQuote) => {
          // Check if quote has a quoteNumber field that matches our pattern
          const quoteNumber = (quote as any).quoteNumber || ""
          if (quoteNumber && quoteNumber.startsWith(prefix)) {
            return true
          }
          
          // Also check createdAt to see if it's the same date (for quotes without quoteNumber)
          if (quote.createdAt) {
            const quoteDate = new Date(quote.createdAt)
            const quoteYear = quoteDate.getFullYear()
            const quoteMonth = String(quoteDate.getMonth() + 1).padStart(2, '0')
            const quoteDay = String(quoteDate.getDate()).padStart(2, '0')
            const quoteDateStr = `${quoteYear}${quoteMonth}${quoteDay}`
            return quoteDateStr === dateStr
          }
          return false
        })
        
        // Find the highest sequential number for this date
        let maxNumber = 0
        sameDateQuotes.forEach((quote: PriceQuote) => {
          const quoteNumber = (quote as any).quoteNumber || ""
          if (quoteNumber && quoteNumber.startsWith(prefix)) {
            // Extract the sequential number (XXX part)
            const match = quoteNumber.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })
        
        // Generate next number (padded to 3 digits)
        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        return `${prefix}-${nextNumber}`
      }
    } catch (error) {
      console.error("Error generating quote number:", error)
    }
    
    // Fallback: return with 001 if no quotes found for this date
    return `${prefix}-001`
  }

  // Function to generate invoice number in format: BU-INV-YYYYMMDD-XXX
  const generateInvoiceNumber = async (invoiceDate?: string): Promise<string> => {
    const date = invoiceDate ? new Date(invoiceDate) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const prefix = `BU-INV-${dateStr}`

    try {
      const response = await fetch("/api/quotes")
      const result = await response.json()
      if (result.success) {
        const sameDateInvoices = result.data.filter((quote: PriceQuote) => {
          const existingNumber = (quote as any).invoiceNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            return true
          }
          if ((quote as any).invoiceDate) {
            const savedDate = new Date((quote as any).invoiceDate)
            const savedDateStr = `${savedDate.getFullYear()}${String(savedDate.getMonth() + 1).padStart(2, '0')}${String(savedDate.getDate()).padStart(2, '0')}`
            return savedDateStr === dateStr
          }
          return false
        })

        let maxNumber = 0
        sameDateInvoices.forEach((quote: PriceQuote) => {
          const existingNumber = (quote as any).invoiceNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            const match = existingNumber.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })

        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        return `${prefix}-${nextNumber}`
      }
    } catch (error) {
      console.error("Error generating invoice number:", error)
    }

    return `${prefix}-001`
  }

  // Function to generate expense receipt number in format: BU-EXP-YYYYMMDD-XXX
  const generateSpentNumber = async (spentDateValue?: string): Promise<string> => {
    const date = spentDateValue ? new Date(spentDateValue) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const prefix = `BU-EXP-${dateStr}`

    try {
      const response = await fetch("/api/quotes")
      const result = await response.json()
      if (result.success) {
        const sameDateSpent = result.data.filter((quote: PriceQuote) => {
          const existingNumber = (quote as any).spentNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            return true
          }
          if ((quote as any).spentDate) {
            const savedDate = new Date((quote as any).spentDate)
            const savedDateStr = `${savedDate.getFullYear()}${String(savedDate.getMonth() + 1).padStart(2, '0')}${String(savedDate.getDate()).padStart(2, '0')}`
            return savedDateStr === dateStr
          }
          return false
        })

        let maxNumber = 0
        sameDateSpent.forEach((quote: PriceQuote) => {
          const existingNumber = (quote as any).spentNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            const match = existingNumber.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })

        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        return `${prefix}-${nextNumber}`
      }
    } catch (error) {
      console.error("Error generating spent number:", error)
    }

    return `${prefix}-001`
  }

  // Fetch quotes from Firebase
  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Build query params for date filtering
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const url = `/api/quotes${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMsg = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMsg = errorData.error
          }
        } catch {
          // If response is not JSON, use default message
        }
        throw new Error(errorMsg)
      }
      
      const result = await response.json()

      if (result.success) {
        setQuotes(result.data || [])
      } else {
        // Use the error message from the API as-is (it already includes helpful instructions)
        setError(result.error || "Failed to fetch quotes")
      }
    } catch (err: any) {
      console.error("Error fetching quotes:", err)
      let errorMsg = err?.message || "Failed to load quotes. Please try again."
      
      // Check if it's a Firebase configuration error first (most specific)
      if (err?.message?.includes("not initialized") || err?.message?.includes("Missing required") || err?.message?.includes("Firebase Admin") || err?.message?.includes("Firebase configuration")) {
        // Only add the message if it's not already included
        if (!err.message.includes(".env.local") && !err.message.includes("environment variables")) {
          const isProduction = process.env.NODE_ENV === "production";
          if (isProduction) {
            errorMsg = `${err.message} Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your deployment platform.`
          } else {
            errorMsg = `${err.message} Please add these to your .env.local file.`
          }
        } else {
          errorMsg = err.message
        }
      }
      // Check if it's a network connection error (fetch failed completely, not HTTP error status)
      // Network errors: TypeError (Failed to fetch), NetworkError, or fetch timeout
      // NOT HTTP error status codes (those are server errors, handled above)
      else if (err?.name === "TypeError" && err?.message?.includes("fetch")) {
        // This is a real network error - fetch couldn't reach the server
        errorMsg = "Unable to connect to the server. Please check your network connection and try again."
      }
      else if (err?.name === "NetworkError" || err?.message?.includes("NetworkError")) {
        errorMsg = "Unable to connect to the server. Please check your network connection and try again."
      }
      // HTTP error status codes (like 500) are server errors, not network errors
      // These should show the actual error message from the API
      else if (err?.message?.includes("HTTP error")) {
        // Keep the original error message which includes the API error details
        errorMsg = err.message
      }
      
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch quotes when date filters change (with debounce)
  useEffect(() => {
    // Skip initial load (already handled by first useEffect)
    if (quotes.length === 0 && isLoading) return

    const timer = setTimeout(() => {
      fetchQuotes()
      setSelectedQuotes(new Set()) // Clear selections when filters change
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const handleViewQuote = (quote: PriceQuote) => {
    setSelectedQuote(quote)
    setIsDialogOpen(true)
    // Initialize selections based on existing product statuses
    const sendOfferSet = new Set<string>()
    const invoiceSet = new Set<string>()
    const spentSet = new Set<string>()
    quote.selectedProducts.forEach((product, index) => {
      const productKey = getProductKey(product, index)
      if (!productKey) return
      const statusValue = product.status || (product as any).status_type || "pending"
      if (["sent_offer", "create_invoice", "spent"].includes(statusValue)) {
        sendOfferSet.add(productKey)
      }
      if (["create_invoice", "spent"].includes(statusValue)) {
        invoiceSet.add(productKey)
      }
      if (statusValue === "spent") {
        spentSet.add(productKey)
      }
    })
    setSelectedForSendOffer(sendOfferSet)
    setSelectedForInvoice(invoiceSet)
    setSelectedForSpent(spentSet)
  }

  // Calculate overall quote status based on product statuses
  const calculateQuoteStatus = (products: PriceQuote["selectedProducts"]): PriceQuote["status"] => {
    if (products.length === 0) return "pending"
    
    // If all products are spent, quote is spent
    const allSpent = products.every((p) => p.status === "spent")
    if (allSpent) return "spent"
    
    // If all products are at create_invoice or spent, quote is create_invoice
    const allInvoiceOrSpent = products.every((p) => p.status === "create_invoice" || p.status === "spent")
    if (allInvoiceOrSpent) return "create_invoice"
    
    // If any product has a status, use sent_offer
    const hasStatus = products.some((p) => p.status)
    if (hasStatus) return "sent_offer"
    
    return "pending"
  }

  const quoteStatusColors = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    pending: "bg-orange-100 text-orange-800 border-orange-200",
    in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  }

  const quoteStatusLabels = {
    new: "New",
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
  }

  // Get display status for main table
  const getDisplayStatus = (quote: PriceQuote): { label: string; color: string } => {
    const status = quote.quoteStatus || "new"
    return {
      label: quoteStatusLabels[status],
      color: quoteStatusColors[status],
    }
  }

  const getProductKey = (product: any, index?: number): string => {
    const key =
      product?.productId ??
      product?.id ??
      product?.product_id ??
      (index !== undefined ? `product-${index}` : "")
    return key ? String(key) : ""
  }

  const toNumber = (value: any): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0
    }
    const sanitized = String(value).replace(/[^0-9.-]/g, "")
    const parsed = parseFloat(sanitized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const PRICE_DECIMALS = 3

  const roundToThousandth = (value: number): number => {
    const factor = 10 ** PRICE_DECIMALS
    if (!Number.isFinite(value)) return 0
    return Math.round((value + Number.EPSILON) * factor) / factor
  }

  const formatPriceInput = (value: number | string): string => {
    const rounded = roundToThousandth(toNumber(value))
    return rounded.toFixed(PRICE_DECIMALS)
  }

  const priceFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: PRICE_DECIMALS,
    maximumFractionDigits: PRICE_DECIMALS,
  })
  const priceFormatterNoDecimals = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const formatPriceDisplay = (value: number | string): string => {
    const rounded = roundToThousandth(toNumber(value))
    const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-9
    return (isWhole ? priceFormatterNoDecimals : priceFormatter).format(rounded)
  }

  const numberToMongolianWords = (value: number): string => {
    const ones = ["тэг", "нэг", "хоёр", "гурав", "дөрөв", "тав", "зургаа", "долоо", "найм", "ес"]
    const tens = ["", "арав", "хорь", "гуч", "дөч", "тавь", "жаран", "далан", "наян", "ерэн"]
    const groupNames = ["", "мянга", "сая", "тэрбум", "их наяд"]

    const chunkToWords = (chunk: number) => {
      const words: string[] = []
      const hundreds = Math.floor(chunk / 100)
      const rest = chunk % 100

      if (hundreds) {
        words.push(ones[hundreds])
        words.push("зуун")
      }

      if (rest) {
        if (rest < 10) {
          words.push(ones[rest])
        } else if (rest < 20) {
          if (rest === 10) {
            words.push("арав")
          } else {
            words.push("арван")
            words.push(ones[rest - 10])
          }
        } else {
          const tensIndex = Math.floor(rest / 10)
          words.push(tens[tensIndex])
          const unit = rest % 10
          if (unit) words.push(ones[unit])
        }
      }

      return words.join(" ")
    }

    const absolute = Math.floor(Math.abs(value))
    if (absolute === 0) return "тэг"

    const parts: string[] = []
    let remaining = absolute
    let groupIndex = 0

    while (remaining > 0) {
      const chunk = remaining % 1000
      if (chunk) {
        const chunkWords = chunkToWords(chunk)
        const groupLabel = groupNames[groupIndex]
        parts.unshift(groupLabel ? `${chunkWords} ${groupLabel}` : chunkWords)
      }
      remaining = Math.floor(remaining / 1000)
      groupIndex += 1
    }

    return parts.join(" ")
  }

  const formatAmountInWords = (value: number): string => {
    const normalized = Math.round(toNumber(value))
    const words = numberToMongolianWords(Math.abs(normalized))
    const prefix = normalized < 0 ? "хасах " : ""
    return `${prefix}${words} төгрөг`
  }

  const buildMailtoLink = (type: "offer" | "invoice" | "spent") => {
    const email = selectedQuote?.email || ""
    if (!email) return ""

    const customerName = `${selectedQuote?.firstName || ""} ${selectedQuote?.lastName || ""}`.trim()
    const company = selectedQuote?.company || ""
    const subjectMap = {
      offer: "Үнийн санал",
      invoice: "Нэхэмжлэл",
      spent: "Зарлагын баримт",
    }
    const numberMap = {
      offer: quoteNumber || "",
      invoice: invoiceNumber || "",
      spent: spentNumber || "",
    }
    const dateMap = {
      offer: quoteDate || new Date().toISOString().split("T")[0],
      invoice: invoiceDate || new Date().toISOString().split("T")[0],
      spent: spentDate || new Date().toISOString().split("T")[0],
    }

    const subject = `${subjectMap[type]}${numberMap[type] ? ` - ${numberMap[type]}` : ""}`
    const lines = [
      `Сайн байна уу${customerName ? `, ${customerName}` : ""}?`,
      "",
      `${subjectMap[type]}${numberMap[type] ? ` (${numberMap[type]})` : ""} - ${dateMap[type]}`,
      company ? `Компани: ${company}` : "",
      "",
      "Хүндэтгэсэн,",
      companyName,
    ].filter(Boolean)

    const body = lines.join("\n")
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleProductStatusChange = async (
    quoteId: string,
    productId: string,
    newStatus: "sent_offer" | "create_invoice" | "spent" | "pending"
  ): Promise<void> => {
    try {
      // Find the quote and update the product status
      const quote = quotes.find(q => q.id === quoteId)
      if (!quote) {
        throw new Error("Quote not found")
      }

      const updatedProducts = quote.selectedProducts.map((product, index) => {
        const resolvedProductId = getProductKey(product, index)
        if (!resolvedProductId) return product
        if (resolvedProductId !== productId) {
          return { ...product, productId: resolvedProductId }
        }
        if (newStatus === "pending") {
          const { status, status_type, ...rest } = product as any
          return { ...rest, productId: resolvedProductId }
        }
        return { ...product, productId: resolvedProductId, status: newStatus, status_type: newStatus }
      })
      const newQuoteStatus = calculateQuoteStatus(updatedProducts)

      // Save to Firebase
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedProducts: updatedProducts,
          status: newQuoteStatus,
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Update local state
        setQuotes(
          quotes.map((q) => {
            if (q.id === quoteId) {
              return result.data
            }
            return q
          })
        )
        
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(result.data)
        }
      } else {
        throw new Error(result.error || "Failed to update product status")
      }
    } catch (err: any) {
      console.error("Error updating product status:", err)
      alert("Failed to update product status. Please try again.")
      throw err // Re-throw to allow Promise.all to handle errors
    }
  }

  const getStatusFromSelections = (
    isSendOffer: boolean,
    isInvoice: boolean,
    isSpent: boolean
  ): "sent_offer" | "create_invoice" | "spent" | "pending" => {
    if (isSpent) return "spent"
    if (isInvoice) return "create_invoice"
    if (isSendOffer) return "sent_offer"
    return "pending"
  }

  const handleProductSelectionChange = async (
    productId: string,
    update: Partial<{ sendOffer: boolean; invoice: boolean; spent: boolean }>
  ) => {
    if (!selectedQuote?.id) return

    let nextSendOffer = update.sendOffer ?? selectedForSendOffer.has(productId)
    let nextInvoice = update.invoice ?? selectedForInvoice.has(productId)
    let nextSpent = update.spent ?? selectedForSpent.has(productId)

    if (nextSpent) {
      nextInvoice = true
      nextSendOffer = true
    } else if (nextInvoice) {
      nextSendOffer = true
    } else if (!nextSendOffer) {
      nextInvoice = false
      nextSpent = false
    }

    const nextSendOfferSet = new Set(selectedForSendOffer)
    const nextInvoiceSet = new Set(selectedForInvoice)
    const nextSpentSet = new Set(selectedForSpent)

    if (nextSendOffer) {
      nextSendOfferSet.add(productId)
    } else {
      nextSendOfferSet.delete(productId)
    }

    if (nextInvoice) {
      nextInvoiceSet.add(productId)
    } else {
      nextInvoiceSet.delete(productId)
    }

    if (nextSpent) {
      nextSpentSet.add(productId)
    } else {
      nextSpentSet.delete(productId)
    }

    setSelectedForSendOffer(nextSendOfferSet)
    setSelectedForInvoice(nextInvoiceSet)
    setSelectedForSpent(nextSpentSet)

    const nextStatus = getStatusFromSelections(nextSendOffer, nextInvoice, nextSpent)
    await handleProductStatusChange(selectedQuote.id, productId, nextStatus)
  }

  const handleQuoteStatusChange = async (quoteId: string, newStatus: "new" | "pending" | "in_progress" | "completed" | "rejected") => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteStatus: newStatus }),
      })

      const result = await response.json()
      if (result.success) {
        // Update local state
        setQuotes(
          quotes.map((quote) => {
            if (quote.id === quoteId) {
              return result.data
            }
            return quote
          })
        )
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(result.data)
        }
      } else {
        alert(result.error || "Failed to update quote status")
      }
    } catch (err: any) {
      console.error("Error updating quote status:", err)
      alert("Failed to update quote status. Please try again.")
    }
  }

  const formatDate = (dateString: string | Date | any) => {
    if (!dateString) return "Огноо байхгүй"
    
    try {
      let date: Date
      
      // Handle Firestore Timestamp objects
      if (dateString && typeof dateString === 'object' && dateString.toDate) {
        date = dateString.toDate()
      } 
      // Handle Firestore Timestamp with seconds/nanoseconds
      else if (dateString && typeof dateString === 'object' && dateString.seconds) {
        date = new Date(dateString.seconds * 1000)
      }
      // Handle string dates
      else if (typeof dateString === 'string') {
        date = new Date(dateString)
      }
      // Handle Date objects
      else if (dateString instanceof Date) {
        date = dateString
      }
      else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Огноо буруу"
      }
      
      return date.toLocaleString("mn-MN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return "Огноо буруу"
    }
  }

  const formatDateOnly = (dateString: string | Date | any) => {
    if (!dateString) return "Огноо байхгүй"

    try {
      let date: Date

      if (dateString && typeof dateString === "object" && dateString.toDate) {
        date = dateString.toDate()
      } else if (dateString && typeof dateString === "object" && dateString.seconds) {
        date = new Date(dateString.seconds * 1000)
      } else if (typeof dateString === "string") {
        date = new Date(dateString)
      } else if (dateString instanceof Date) {
        date = dateString
      } else {
        date = new Date(dateString)
      }

      if (isNaN(date.getTime())) {
        return "Огноо буруу"
      }

      return date.toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return "Огноо буруу"
    }
  }

  // Generate Татаж авах document for Send Offer
  const handleDownloadSendOfferWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
      (product, index) => selectedForSendOffer.has(getProductKey(product, index))
    )
    const sendOfferColumnWidths = [5, 22, 14, 10, 6, 12, 12, 19]
    const sendOfferCell = (text: string | number, colIndex: number) =>
      new DocxTableCell({
        children: [new Paragraph(String(text))],
        width: { size: sendOfferColumnWidths[colIndex], type: WidthType.PERCENTAGE },
      })
    const resolvedQuoteNumber =
      quoteNumber || `BU-QT-${new Date().toISOString().split("T")[0]}-001`
    const totalAmount = selectedProducts.reduce((sum, product, index) => {
      const productId = getProductKey(product, index)
      const unitPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
      const quantity = toNumber(sendOfferQuantities[productId] ?? product.quantity ?? 0)
      return sum + unitPrice * quantity
    }, 0)

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 24,
              color: "000000",
            },
          },
        },
      },
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `ҮНИЙН САНАЛ № ${resolvedQuoteNumber}`,
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Огноо: ", bold: true }),
              new TextRun({ text: quoteDate ? formatDateOnly(quoteDate) : formatDateOnly(selectedQuote.createdAt) }),
            ],
          }),
          new Paragraph({ text: "" }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Үнийн санал хүсгэгч:",
                            bold: true,
                            size: 28,
                            color: "000000",
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Компани: ", bold: true }),
                          new TextRun({ text: selectedQuote.company }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Хариуцсан ажилтны нэр: ", bold: true }),
                          new TextRun({ text: `${selectedQuote.firstName} ${selectedQuote.lastName}` }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Утас: ", bold: true }),
                          new TextRun({ text: selectedQuote.phone || "-" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Нэмэлт мэдээлэл: ", bold: true }),
                          new TextRun({ text: selectedQuote.additionalInfo || "" }),
                        ],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Үнийн санал илгээгч:",
                            bold: true,
                            size: 28,
                            color: "000000",
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Компанийн нэр: ", bold: true }),
                          new TextRun({ text: companyName }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Регистерийн №: ", bold: true }),
                          new TextRun({ text: companyRegNumber }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Хаяг: ", bold: true }),
                          new TextRun({ text: companyAddress }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Email: ", bold: true }),
                          new TextRun({ text: companyEmail }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Утас, Факс: ", bold: true }),
                          new TextRun({ text: companyPhone }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Гар утас: ", bold: true }),
                          new TextRun({ text: companyMobile }),
                        ],
                      }),
                      ...(companyNote ? [new Paragraph({
                        children: [
                          new TextRun({ text: "Компанийн тэмдэглэл: ", bold: true }),
                          new TextRun({ text: companyNote }),
                        ],
                      })] : []),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Сонгосон бараа",
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
          }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  sendOfferCell("№", 0),
                  sendOfferCell("Барааны нэр", 1),
                  sendOfferCell("Код", 2),
                  sendOfferCell("Хэмжих нэгж", 3),
                  sendOfferCell("Тоо", 4),
                  sendOfferCell("Барааны төлөв", 5),
                  sendOfferCell("Нэгжийн үнэ(₮)", 6),
                  sendOfferCell("Нийт дүн(₮)(НӨАТ орсон)", 7),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const productId = getProductKey(product, index)
                const unitPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                const quantity = sendOfferQuantities[productId] !== undefined 
                  ? sendOfferQuantities[productId] 
                  : toNumber(product.quantity || 0)
                const total = unitPrice * quantity
                const productCode = (product as any).product_code || (product as any).productCode || ""
                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                const deliveryTime = sendOfferDeliveryTimes[productId] !== undefined 
                  ? sendOfferDeliveryTimes[productId] 
                  : ((product as any).delivery_time || (product as any).deliveryTime || "")
                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                const statusLabel = stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock
                
                // Format delivery time date if it exists
                let deliveryTimeDisplay = "-"
                if (deliveryTime) {
                  try {
                    const date = new Date(deliveryTime)
                    if (!isNaN(date.getTime())) {
                      deliveryTimeDisplay = date.toLocaleDateString("mn-MN")
                    } else {
                      deliveryTimeDisplay = deliveryTime
                    }
                  } catch {
                    deliveryTimeDisplay = deliveryTime
                  }
                }
                
                return new DocxTableRow({
                  children: [
                    sendOfferCell(index + 1, 0),
                    sendOfferCell(transactionDescription, 1),
                    sendOfferCell(productCode || "-", 2),
                    sendOfferCell(unitOfMeasurement, 3),
                    sendOfferCell(quantity, 4),
                    sendOfferCell(statusLabel, 5),
                    sendOfferCell(formatPriceDisplay(unitPrice), 6),
                    sendOfferCell(formatPriceDisplay(total), 7),
                  ],
                })
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    columnSpan: 7,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "НИЙТ ДҮН", bold: true })],
                      }),
                    ],
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: formatPriceDisplay(totalAmount), bold: true })],
                      }),
                    ],
                    width: { size: sendOfferColumnWidths[7], type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Тамга", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        children: [
                          new TextRun({ text: "Нягтлан бодогч ", bold: true }),
                          new TextRun({ text: ".................................. / ........................... /" }),
                        ],
                      }),
                    ],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const fileDate = quoteDate || new Date().toISOString().split("T")[0]
    const fileQuoteNumber = quoteNumber || selectedQuote.id
    saveAs(blob, `Send offer - ${fileQuoteNumber} - ${fileDate}.docx`)
  }

  // Generate Татаж авах document for Invoice
  const handleDownloadInvoiceWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
        (product, index) => selectedForInvoice.has(getProductKey(product, index))
      )
    const resolvedInvoiceNumber =
      invoiceNumber || `BU-INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001`
    const totalAmount = selectedProducts.reduce((sum, product, index) => {
      const productId = getProductKey(product, index)
      const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
      const unitPrice = toNumber(invoicePrices[productId] ?? fallbackPrice)
      const quantity = toNumber(invoiceQuantities[productId] ?? product.quantity ?? 0)
      return sum + unitPrice * quantity
    }, 0)

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 24,
              color: "000000",
            },
          },
        },
      },
      sections: [{
        children: [
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "НХМаягт БМ-3" })],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: "Сангийн сайдын 2017 оны  347 тоот тушаалын хавсралт",
                          }),
                        ],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: `НЭХЭМЖЛЭЛ № ${resolvedInvoiceNumber}`,
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Огноо: ", bold: true }),
              new TextRun({ text: invoiceDate ? formatDateOnly(invoiceDate) : formatDateOnly(selectedQuote.createdAt) }),
            ],
          }),
          new Paragraph({ text: "" }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Төлөгч:",
                            bold: true,
                            size: 28,
                            color: "000000",
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Худалдан авагчийн нэр: ", bold: true }),
                          new TextRun({ text: selectedQuote.company }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Хаяг: ", bold: true }),
                          new TextRun({ text: "-" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Гэрээний дугаар: ", bold: true }),
                          new TextRun({ text: "-" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Нэхэмжилсэн огноо: ", bold: true }),
                          new TextRun({ text: invoiceDate ? formatDateOnly(invoiceDate) : formatDateOnly(selectedQuote.createdAt) }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Төлбөр төлөх хугацаа: ", bold: true }),
                          new TextRun({ text: paymentDueDate ? formatDateOnly(paymentDueDate) : "-" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Регистерийн №: ", bold: true }),
                          new TextRun({ text: buyerRegNumber || "-" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Гүйлгээний утга: ", bold: true }),
                          new TextRun({ text: resolvedInvoiceNumber }),
                        ],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Нэхэмжлэгч:",
                            bold: true,
                            size: 28,
                            color: "000000",
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Байгууллагын нэр: ", bold: true }),
                          new TextRun({ text: companyName }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Хаяг: ", bold: true }),
                          new TextRun({ text: companyAddress }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Email: ", bold: true }),
                          new TextRun({ text: companyEmail }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Утас, Факс: ", bold: true }),
                          new TextRun({ text: companyPhone }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Банкны нэр: ", bold: true }),
                          new TextRun({ text: companyBankName }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Дансны дугаар: ", bold: true }),
                          new TextRun({ text: companyAccountNumber }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Регистерийн №: ", bold: true }),
                          new TextRun({ text: companyRegNumber }),
                        ],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Сонгосон бараа",
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
          }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph("№")] }),
                  new DocxTableCell({ children: [new Paragraph("Барааны нэр")] }),
                  new DocxTableCell({ children: [new Paragraph("Код")] }),
                  new DocxTableCell({ children: [new Paragraph("Хэмжих нэгж")] }),
                  new DocxTableCell({ children: [new Paragraph("Тоо")] }),
                  new DocxTableCell({ children: [new Paragraph("Нэгжийн үнэ(₮)")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийт дүн(₮)(НӨАТ орсон)")] }),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const productId = getProductKey(product, index)
                const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                const unitPrice = toNumber(invoicePrices[productId] ?? fallbackPrice)
                const quantity = invoiceQuantities[productId] !== undefined 
                  ? invoiceQuantities[productId] 
                  : (product.quantity || 0)
                const total = unitPrice * quantity
                const productCode = (product as any).product_code || (product as any).productCode || ""
                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                return new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph(String(index + 1))] }),
                    new DocxTableCell({ children: [new Paragraph(transactionDescription)] }),
                    new DocxTableCell({ children: [new Paragraph(productCode || "-")] }),
                    new DocxTableCell({ children: [new Paragraph(unitOfMeasurement)] }),
                    new DocxTableCell({ children: [new Paragraph(String(quantity))] }),
                    new DocxTableCell({ children: [new Paragraph(formatPriceDisplay(unitPrice))] }),
                    new DocxTableCell({ children: [new Paragraph(formatPriceDisplay(total))] }),
                  ],
                })
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    columnSpan: 6,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "НИЙТ ДҮН", bold: true })],
                      }),
                    ],
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: formatPriceDisplay(totalAmount), bold: true })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Тамга", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        children: [
                          new TextRun({ text: "Захирал ", bold: true }),
                          new TextRun({ text: ".................................. / ........................... /" }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        children: [
                          new TextRun({ text: "Нягтлан бодогч ", bold: true }),
                          new TextRun({ text: ".................................. / ........................... /" }),
                        ],
                      }),
                    ],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const fileDate = invoiceDate || new Date().toISOString().split("T")[0]
    const fileInvoiceNumber = invoiceNumber || `BU-INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001`
    saveAs(blob, `Invoice - ${fileInvoiceNumber} - ${fileDate}.docx`)
  }

  // Generate Татаж авах document for Зарлагын баримт/Expense Receipt
  const handleDownloadSpentWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
      (product, index) => selectedForSpent.has(getProductKey(product, index))
    )
    const spentColumnWidths = [5, 24, 16, 10, 6, 12, 27]
    const spentCell = (text: string | number, colIndex: number) =>
      new DocxTableCell({
        children: [new Paragraph(String(text))],
        width: { size: spentColumnWidths[colIndex], type: WidthType.PERCENTAGE },
      })
    const resolvedSpentNumber =
      spentNumber || `BU-EXP-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001`
    const totalAmount = selectedProducts.reduce((sum, product, index) => {
      const productId = getProductKey(product, index)
      const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
      const unitPrice = toNumber(spentPrices[productId] ?? fallbackPrice)
      const quantity = toNumber(spentQuantities[productId] ?? product.quantity ?? 0)
      return sum + unitPrice * quantity
    }, 0)

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 24,
              color: "000000",
            },
          },
        },
      },
      sections: [{
        children: [
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "НХМаягт БМ-3 Т-1" })],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: "Сангийн сайдын 2017 оны  347 тоот тушаалын хавсралт",
                          }),
                        ],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: `ЗАРЛАГЫН БАРИМТ № ${resolvedSpentNumber}`,
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: companyName })] }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Хаяг: ", bold: true }),
                          new TextRun({ text: companyAddress }),
                        ],
                      }),
                      new Paragraph({ children: [new TextRun({ text: "(Байгууллагын нэр)" })] }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: selectedQuote.company })] }),
                      new Paragraph({ children: [new TextRun({ text: "(Худалдан авагчийн нэр)" })] }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Регистерийн №: ", bold: true }),
                          new TextRun({ text: companyRegNumber }),
                        ],
                      }),
                    ],
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Регистерийн №: ", bold: true }),
                          new TextRun({ text: buyerRegNumber || "-" }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Огноо: ", bold: true }),
                          new TextRun({ text: spentDate ? formatDateOnly(spentDate) : formatDateOnly(selectedQuote.createdAt) }),
                        ],
                      }),
                    ],
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "(тээвэрлэгчийн хаяг, албан тушаал, нэр)" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Сонгосон бараа",
                bold: true,
                size: 28,
                color: "000000",
              }),
            ],
          }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  spentCell("№", 0),
                  spentCell("Барааны нэр", 1),
                  spentCell("Код", 2),
                  spentCell("Хэмжих нэгж", 3),
                  spentCell("Тоо", 4),
                  spentCell("Нэгжийн үнэ(₮)", 5),
                  spentCell("Нийт дүн(₮)(НӨАТ орсон)", 6),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const productId = getProductKey(product, index)
                const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                const unitPrice = toNumber(spentPrices[productId] ?? fallbackPrice)
                const quantity = spentQuantities[productId] !== undefined 
                  ? spentQuantities[productId] 
                  : toNumber(product.quantity || 0)
                const total = unitPrice * quantity
                const productCode = (product as any).product_code || (product as any).productCode || ""
                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
              
                
                return new DocxTableRow({
                  children: [
                    spentCell(index + 1, 0),
                    spentCell(transactionDescription, 1),
                    spentCell(productCode || "-", 2),
                    spentCell(unitOfMeasurement, 3),
                    spentCell(quantity, 4),
                    spentCell(formatPriceDisplay(unitPrice), 5),
                    spentCell(formatPriceDisplay(total), 6),
                  ],
                })
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    columnSpan: 6,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "НИЙТ ДҮН", bold: true })],
                      }),
                    ],
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: formatPriceDisplay(totalAmount), bold: true })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new DocxTable({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Тэмдэг", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [
                      new Paragraph({
                        spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        children: [
                          new TextRun({ text: "Хүлээлгэн өгсөн эд хариуцагч ", bold: true }),
                          new TextRun({ text: "......................./ ......................./" }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        children: [
                          new TextRun({ text: "Хүлээн авагч ", bold: true }),
                          new TextRun({ text: "................................ / ............................ /" }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        children: [
                          new TextRun({ text: "Шалгасан нягтлан бодогч ", bold: true }),
                          new TextRun({ text: "............................/ ......................../" }),
                        ],
                      }),
                    ],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const fileDate = spentDate || new Date().toISOString().split("T")[0]
    const fileSpentNumber = spentNumber || `BU-EXP-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001`
    saveAs(blob, `Expense Receipt - ${fileSpentNumber} - ${fileDate}.docx`)
  }

  // Filter quotes by date range (client-side fallback if server-side filtering fails)
  const getFilteredQuotes = (): PriceQuote[] => {
    if (!startDate && !endDate) {
      return quotes
    }
    
    return quotes.filter((quote) => {
      try {
        // Parse quote date - handle various formats
        let quoteDate: Date
        const createdAt = quote.createdAt as any // Use 'as any' to handle different possible types
        
        if (createdAt) {
          if (typeof createdAt === 'string') {
            quoteDate = new Date(createdAt)
          } else if (createdAt instanceof Date) {
            quoteDate = createdAt
          } else if (createdAt.toDate && typeof createdAt.toDate === 'function') {
            quoteDate = createdAt.toDate()
          } else if (createdAt.seconds) {
            quoteDate = new Date(createdAt.seconds * 1000)
          } else {
            quoteDate = new Date(createdAt)
          }
        } else {
          return false // Skip quotes without createdAt
        }
        
        // Check if date is valid
        if (isNaN(quoteDate.getTime())) {
          return false
        }
        
        // Normalize to date only (remove time)
        const quoteDateOnly = new Date(quoteDate.getFullYear(), quoteDate.getMonth(), quoteDate.getDate())
        
        if (startDate && endDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return quoteDateOnly >= start && quoteDateOnly <= end
        } else if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          return quoteDateOnly >= start
        } else if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return quoteDateOnly <= end
        }
        
        return true
      } catch (error) {
        console.error("Error filtering quote by date:", error, quote)
        return false
      }
    })
  }

  const filteredQuotes = getFilteredQuotes()

  // Select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuotes(new Set(filteredQuotes.map(q => q.id)))
    } else {
      setSelectedQuotes(new Set())
    }
  }

  const handleSelectQuote = (quoteId: string, checked: boolean) => {
    const newSet = new Set(selectedQuotes)
    if (checked) {
      newSet.add(quoteId)
    } else {
      newSet.delete(quoteId)
    }
    setSelectedQuotes(newSet)
  }

  const handleDeleteSelected = async () => {
    if (selectedQuotes.size === 0) return

    if (!confirm(`Та ${selectedQuotes.size} үнийн саналыг устгахдаа итгэлтэй байна уу?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedQuotes).map(id =>
        fetch(`/api/quotes/${id}`, { method: "DELETE" })
      )
      
      const results = await Promise.allSettled(deletePromises)
      const failed = results.filter(r => r.status === "rejected" || !r.value.ok)
      
      if (failed.length > 0) {
        alert(`Зарим үнийн саналыг устгахад алдаа гарлаа. ${failed.length} алдаатай.`)
      } else {
        setSelectedQuotes(new Set())
        await fetchQuotes()
      }
    } catch (error) {
      console.error("Error deleting quotes:", error)
      alert("Үнийн саналыг устгахад алдаа гарлаа.")
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = filteredQuotes.length > 0 && selectedQuotes.size === filteredQuotes.length
  const isIndeterminate = selectedQuotes.size > 0 && selectedQuotes.size < filteredQuotes.length

  const handleDownloadExcel = async () => {
    // Dynamically import xlsx to avoid SSR issues
    const XLSX = await import("xlsx")

    // Prepare data for Excel export (use filtered quotes)
    const excelData = filteredQuotes.map((quote) => {
      const products = quote.selectedProducts
        .map((p) => `${p.productName} (${p.quantity || "N/A"})`)
        .join("; ")

      return {
        "Огноо": formatDate(quote.createdAt),
        "Нэр": quote.firstName,
        "Овог": quote.lastName,
        "И-мэйл": quote.email,
        "Утас": quote.phone,
        "Компани": quote.company,
        "Нэмэлт мэдээлэл": quote.additionalInfo,
        "Сонгосон бараа": products,
        "Барааны тоо": (quote.selectedProducts || []).length,
        "Төлөв": statusLabels[quote.status] || statusLabels.pending,
        "Шинэчлэгдсэн огноо": quote.updatedAt
          ? formatDate(quote.updatedAt)
          : "",
      }
    })

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Үнийн санал")

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Огноо
      { wch: 15 }, // Нэр
      { wch: 15 }, // Овог
      { wch: 25 }, // И-мэйл
      { wch: 15 }, // Утас
      { wch: 20 }, // Компани
      { wch: 40 }, // Нэмэлт мэдээлэл
      { wch: 50 }, // Сонгосон бараа
      { wch: 15 }, // Барааны тоо
      { wch: 15 }, // Төлөв
      { wch: 20 }, // Шинэчлэгдсэн огноо
    ]
    worksheet["!cols"] = columnWidths

    // Generate Excel file and download
    let fileName = `Үнийн_санал_${new Date().toISOString().split("T")[0]}`
    if (startDate || endDate) {
      const dateRange = `${startDate || "эхлэл"}_${endDate || "төгсгөл"}`
      fileName = `Үнийн_санал_${dateRange}`
    }
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  const handleDownloadSingleQuote = async (quote: PriceQuote) => {
    // Dynamically import xlsx to avoid SSR issues
    const XLSX = await import("xlsx")

    // Prepare data for Excel export - single quote with detailed breakdown
    const quoteData = [
      {
        "Талбар": "Огноо",
        "Утга": formatDate(quote.createdAt),
      },
      {
        "Талбар": "Нэр",
        "Утга": quote.firstName,
      },
      {
        "Талбар": "Овог",
        "Утга": quote.lastName,
      },
      {
        "Талбар": "И-мэйл",
        "Утга": quote.email,
      },
      {
        "Талбар": "Утас",
        "Утга": quote.phone,
      },
      {
        "Талбар": "Компаний нэр",
        "Утга": quote.company,
      },
      {
        "Талбар": "Нэмэлт мэдээлэл",
        "Утга": quote.additionalInfo,
      },
      {
        "Талбар": "Төлөв",
        "Утга": statusLabels[quote.status] || statusLabels.pending,
      },
      {
        "Талбар": "Шинэчлэгдсэн огноо",
        "Утга": quote.updatedAt ? formatDate(quote.updatedAt) : "Байхгүй",
      },
      {
        "Талбар": "",
        "Утга": "",
      },
      {
        "Талбар": "Сонгосон бараа",
        "Утга": "",
      },
    ]

    // Add products as separate rows
    quote.selectedProducts.forEach((product, index) => {
      quoteData.push({
        "Талбар": `${index + 1}. ${product.productName}`,
        "Утга": `Тоо ширхэг: ${product.quantity || "N/A"}, Төлөв: ${product.status ? statusLabels[product.status] : statusLabels.pending}`,
      })
    })

    // Create workbook with two sheets: Summary and Products
    const summarySheet = XLSX.utils.json_to_sheet(quoteData)
    
    // Products sheet
    const productsData = quote.selectedProducts.map((product, index) => ({
      "Дугаар": index + 1,
      "Барааны нэр": product.productName,
      "Тоо ширхэг": product.quantity || "N/A",
      "Төлөв": product.status ? statusLabels[product.status] : statusLabels.pending,
    }))
    const productsSheet = XLSX.utils.json_to_sheet(productsData)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Дэлгэрэнгүй")
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Бараа")

    // Set column widths for summary sheet
    summarySheet["!cols"] = [{ wch: 25 }, { wch: 50 }]
    productsSheet["!cols"] = [{ wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 20 }]

    // Generate Excel file and download
    const fileName = `Үнийн_санал_${quote.firstName}_${quote.lastName}_${quote.id}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const sendOfferTotal = selectedQuote
    ? selectedQuote.selectedProducts.reduce((sum, product, index) => {
        if (!selectedForSendOffer.has(getProductKey(product, index))) return sum
        const productId = getProductKey(product, index)
        const unitPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
        const quantity = toNumber(sendOfferQuantities[productId] ?? product.quantity ?? 0)
        return sum + unitPrice * quantity
      }, 0)
    : 0

  const invoiceTotal = selectedQuote
    ? selectedQuote.selectedProducts.reduce((sum, product, index) => {
        if (!selectedForInvoice.has(getProductKey(product, index))) return sum
        const productId = getProductKey(product, index)
        const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
        const unitPrice = toNumber(invoicePrices[productId] ?? fallbackPrice)
        const quantity = toNumber(invoiceQuantities[productId] ?? product.quantity ?? 0)
        return sum + unitPrice * quantity
      }, 0)
    : 0

  const spentTotal = selectedQuote
    ? selectedQuote.selectedProducts.reduce((sum, product, index) => {
        if (!selectedForSpent.has(getProductKey(product, index))) return sum
        const productId = getProductKey(product, index)
        const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
        const unitPrice = toNumber(spentPrices[productId] ?? fallbackPrice)
        const quantity = toNumber(spentQuantities[productId] ?? product.quantity ?? 0)
        return sum + unitPrice * quantity
      }, 0)
    : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Үнийн санал</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Харилцагчаас ирсэн үнийн санал удирдах цэс
          </p>
          {filteredQuotes.length !== quotes.length && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Нийт: <span className="font-semibold text-foreground">{quotes.length}</span> үнийн санал
              (Харуулж байна: <span className="font-semibold text-foreground">{filteredQuotes.length}</span>)
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Label htmlFor="startDate" className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Эхлэх огноо:
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-[160px] lg:w-[180px]"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Label htmlFor="endDate" className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Дуусах огноо:
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-[160px] lg:w-[180px]"
              min={startDate || undefined}
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="outline"
              onClick={() => {
                setStartDate("")
                setEndDate("")
              }}
              className="w-full sm:w-auto"
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Үнийн саналууд</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {selectedQuotes.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Устгах ({selectedQuotes.size})
                </Button>
              )}
              <Button onClick={handleDownloadExcel} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Excel татах</span>
                <span className="sm:hidden">Excel</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </TableHead>
                <TableHead className="min-w-[120px]">Огноо</TableHead>
                <TableHead className="min-w-[150px]">Харилцагч</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[150px]">Компаний нэр</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[180px]">И-мэйл</TableHead>
                <TableHead className="hidden md:table-cell min-w-[120px]">Утас</TableHead>
                <TableHead className="min-w-[100px]">Барааны тоо</TableHead>
                <TableHead className="min-w-[100px]">Төлөв</TableHead>
                <TableHead className="text-right min-w-[100px]">Үйлдлүүд</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Уншиж байна...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-destructive">
                    {error}
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={fetchQuotes}
                    >
                      Дахин оролдох
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    {quotes.length === 0 
                      ? "No quote requests found."
                      : `No quotes found for selected date range${startDate || endDate ? ` (${startDate || "..."} - ${endDate || "..."})` : ""}.`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => {
                  // Use items from Firestore (mapped to selectedProducts in API)
                  const items = quote.selectedProducts || []
                  return (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedQuotes.has(quote.id)}
                          onChange={(e) => handleSelectQuote(quote.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </TableCell>
                      <TableCell className="min-w-[120px]">{formatDate(quote.createdAt)}</TableCell>
                      <TableCell className="font-medium min-w-[150px]">
                        {quote.firstName} {quote.lastName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell min-w-[150px]">{quote.company}</TableCell>
                      <TableCell className="hidden lg:table-cell min-w-[180px]">{quote.email}</TableCell>
                      <TableCell className="hidden md:table-cell min-w-[120px]">{quote.phone}</TableCell>
                      <TableCell className="min-w-[100px]">{items.length}</TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge className={getDisplayStatus(quote).color}>
                          {getDisplayStatus(quote).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewQuote(quote)}
                            title="Дэлгэрэнгүй харах"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadSingleQuote(quote)}
                            title="Excel татах"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
          {selectedQuote && (
            <>
              <DialogHeader>
                <DialogTitle>Үнийн санал авах хүсэлт</DialogTitle>
              
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Customer Information */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Харилцагчийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Нэр
                      </label>
                      <p className="text-sm">{selectedQuote.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Овог
                      </label>
                      <p className="text-sm">{selectedQuote.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        И-мэйл
                      </label>
                      <p className="text-sm">{selectedQuote.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Утас
                      </label>
                      <p className="text-sm">{selectedQuote.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Компаний нэр
                      </label>
                      <p className="text-sm">{selectedQuote.company}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information / Note */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Нэмэлт мэдээлэл (Note)
                  </label>
                  <div className="mt-1 p-3 bg-muted rounded-md min-h-[80px]">
                    {selectedQuote.additionalInfo ? (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {selectedQuote.additionalInfo}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Нэмэлт мэдээлэл байхгүй (No additional information)
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараа</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Барааны нэр</TableHead>
                          <TableHead>Брэнд</TableHead>
                          <TableHead>Өнгө</TableHead>
                          <TableHead>Хэмжээ</TableHead>
                          <TableHead>Модель дугаар</TableHead>
                          <TableHead className="text-right">Үнэ</TableHead>
                          <TableHead className="text-right">Үнэ (тоо)</TableHead>
                          <TableHead className="text-right">Тоо ширхэг</TableHead>
                          <TableHead className="text-center">Төлөв</TableHead>
                          <TableHead className="text-center">Барааны нөөц</TableHead>
                          <TableHead className="text-center">Үнийн санал</TableHead>
                          <TableHead className="text-center">Нэхэмжлэл</TableHead>
                          <TableHead className="text-center">Зарлагын баримт</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Use items from Firestore (mapped to selectedProducts in API)
                          const items = selectedQuote.selectedProducts || []
                          
                          if (items.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={14} className="text-center text-muted-foreground py-4">
                                  Бараа олдсонгүй (No products found)
                                </TableCell>
                              </TableRow>
                            )
                          }
                          
                          return items.map((product: any, index: number) => {
                            // Type the status properly to avoid 'any' indexing errors
                            // Prefer status if present, otherwise fallback to status_type
                            type ProductStatus = "sent_offer" | "create_invoice" | "spent" | "pending"
                            const statusValue = product.status || product.status_type || "pending"
                            const productStatus: ProductStatus = 
                              (statusValue && ["sent_offer", "create_invoice", "spent", "pending"].includes(statusValue))
                                ? statusValue as ProductStatus
                                : "pending"
                            // Handle different field names from Firestore
                            const productName = product.productName || product.name || product.product || "Unknown Product"
                            const productId = getProductKey(product, index)
                            // Handle quantity from items array - check multiple field name variations
                            const quantity = product.quantity !== undefined && product.quantity !== null 
                              ? product.quantity 
                              : (product.qty !== undefined && product.qty !== null 
                                  ? product.qty 
                                  : (product.amount !== undefined && product.amount !== null 
                                      ? product.amount 
                                      : "N/A"))
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  {product.id !== undefined ? product.id : productId}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {productName}
                                </TableCell>
                                <TableCell>{product.brand || "-"}</TableCell>
                                <TableCell>{product.color || "-"}</TableCell>
                                <TableCell>{product.size || "-"}</TableCell>
                                <TableCell>{product.modelNumber || "-"}</TableCell>
                                <TableCell className="text-right">
                                  {product.price !== undefined && product.price !== null
                                    ? formatPriceDisplay(product.price)
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {product.priceNum !== undefined && product.priceNum !== null
                                    ? formatPriceDisplay(product.priceNum)
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {quantity}
                                </TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusColors[productStatus]}>
                                  {statusLabels[productStatus]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={stockStatusColors[(product.stockStatus || product.stock_status || "inStock") as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                  {stockStatusLabels[(product.stockStatus || product.stock_status || "inStock") as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForSendOffer.has(productId)}
                                  onChange={(e) => {
                                    handleProductSelectionChange(productId, { sendOffer: e.target.checked })
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForInvoice.has(productId)}
                                  onChange={(e) => {
                                    handleProductSelectionChange(productId, { invoice: e.target.checked })
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForSpent.has(productId)}
                                  onChange={(e) => {
                                    handleProductSelectionChange(productId, { spent: e.target.checked })
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                              </TableCell>
                            </TableRow>
                          )
                          })
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForSendOffer.size > 0) {
                        setIsSendOfferDialogOpen(true)
                      }
                    }}
                    disabled={selectedForSendOffer.size === 0}
                    className="w-full sm:w-auto"
                  >
                    Үнийн санал
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForInvoice.size > 0) {
                        setIsCreateInvoiceDialogOpen(true)
                      }
                    }}
                    disabled={selectedForInvoice.size === 0}
                    className="w-full sm:w-auto"
                  >
                    Нэхэмжлэл
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForSpent.size > 0) {
                        setIsSpentDialogOpen(true)
                      }
                    }}
                    disabled={selectedForSpent.size === 0}
                    className="w-full sm:w-auto"
                  >
                    Зарлагын баримт
                  </Button>
                </div>

                {/* Status and Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Төлөв
                    </label>
                    <div className="mt-1">
                      <Select
                        value={selectedQuote.quoteStatus || "new"}
                        onValueChange={(value: "new" | "pending" | "in_progress" | "completed" | "rejected") => {
                          handleQuoteStatusChange(selectedQuote.id, value)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Огноо
                    </label>
                    <p className="text-sm mt-1">{formatDate(selectedQuote.createdAt)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDialogOpen(false)}>Хаах</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Offer Form Dialog */}
      <Dialog
        open={isSendOfferDialogOpen}
        onOpenChange={(open) => {
          if (isSavingSendOffer) return
          setIsSendOfferDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Үнийн санал илгээх форм</DialogTitle>
            <DialogDescription>
              Сонгосон бараануудын үнийн санал илгээх форм
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Quote Information */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Үнийн саналын дугаар</Label>
                      <Input
                        value={quoteNumber}
                        onChange={(e) => setQuoteNumber(e.target.value)}
                        placeholder=""
                      />
                    </div>
                    <div>
                      <Label>Огноо</Label>
                      <Input
                        type="date"
                        value={quoteDate || new Date().toISOString().split("T")[0]}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Холбоо барих ажилтан</Label>
                      <Input
                        value={`${selectedQuote.firstName} ${selectedQuote.lastName}`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Компаний нэр</Label>
                      <Input value={selectedQuote.company} disabled />
                    </div>
                  
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={buyerRegNumber}
                        onChange={(e) => setBuyerRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                  </div>
                </div>

                {/* Products to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараанууд</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <Table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-12" />
                        <col className="w-[180px]" />
                        <col className="w-[140px]" />
                        <col className="w-[110px]" />
                        <col className="w-[90px]" />
                        <col className="w-[140px]" />
                        <col className="w-[150px]" />
                        <col className="w-[190px]" />
                      </colgroup>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Барааны нэр</TableHead>
                          <TableHead>Код</TableHead>
                          <TableHead>Хэмжих нэгж</TableHead>
                          <TableHead className="text-right w-[90px]">Тоо</TableHead>
                          <TableHead>Барааны төлөв</TableHead>
                          <TableHead className="text-right font-semibold w-[150px]">Нэгжийн үнэ(₮)</TableHead>
                          <TableHead className="text-right font-semibold w-[190px]">Нийт дүн(₮) (НӨАТ орсон)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filteredProducts = selectedQuote.selectedProducts.filter((product, index) =>
                            selectedForSendOffer.has(getProductKey(product, index))
                          )
                          const totalAmount = filteredProducts.reduce((sum, product, index) => {
                            const productId = getProductKey(product, index)
                            const unitPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                            const rawQuantity =
                              sendOfferQuantities[productId] !== undefined
                                ? sendOfferQuantities[productId]
                                : product.quantity
                            const quantity = toNumber(rawQuantity)
                            return sum + unitPrice * quantity
                          }, 0)

                          return (
                            <>
                              {filteredProducts.map((product, index) => {
                                const productId = getProductKey(product, index)
                                const unitPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                                const rawQuantity = sendOfferQuantities[productId] !== undefined 
                                  ? sendOfferQuantities[productId] 
                                  : product.quantity
                                const quantity = toNumber(rawQuantity)
                                const total = unitPrice * quantity
                                const productCode = (product as any).product_code || (product as any).productCode || ""
                                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                                const deliveryTime = sendOfferDeliveryTimes[productId] !== undefined 
                                  ? sendOfferDeliveryTimes[productId] 
                                  : ((product as any).delivery_time || (product as any).deliveryTime || "")
                                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                                const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="text-center">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{transactionDescription}</TableCell>
                                    <TableCell>{productCode || "-"}</TableCell>
                                    <TableCell>{unitOfMeasurement}</TableCell>
                                    <TableCell className="text-right w-[90px]">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={quantity}
                                        onChange={(e) => {
                                          const newQuantity = parseFloat(e.target.value) || 0
                                          setSendOfferQuantities({
                                            ...sendOfferQuantities,
                                            [productId]: newQuantity
                                          })
                                        }}
                                        className="w-full text-right"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={stockStatusColors[stockStatus as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                        {stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right w-[150px]">
                                      <Input
                                        type="text"
                                        value={formatPriceDisplay(unitPrice)}
                                        readOnly
                                        className="w-full text-right bg-muted cursor-not-allowed font-medium"
                                      />
                                    </TableCell>
                                    <TableCell className="text-right w-[190px]">
                                      <Input
                                        type="text"
                                        value={formatPriceDisplay(total)}
                                        readOnly
                                        className="w-full text-right bg-muted cursor-not-allowed font-semibold"
                                      />
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              <TableRow>
                                <TableCell colSpan={7} className="text-center font-semibold">
                                  НИЙТ ДҮН
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatPriceDisplay(totalAmount)}
                                </TableCell>
                              </TableRow>
                            </>
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
 
                </div>

                {/* Нэмэлт мэдээлэл */}
                <div>
                  <Label>Нэмэлт мэдээлэл</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                    placeholder="Нэмэлт мэдээлэл ..."
                    value={selectedQuote.additionalInfo || ""}
                    readOnly
                    disabled
                  />
                </div>

                {/* Our Company Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Үнийн санал илгээгч компанийн мэдээлэл </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Компанийн нэр</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={companyRegNumber}
                        onChange={(e) => setCompanyRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг</Label>
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Enter company address"
                      />
                    </div>
                    <div>
                      <Label>Имэйл хаяг</Label>
                      <Input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Утас</Label>
                      <Input
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="Enter phone/fax"
                      />
                    </div>
                    <div>
                      <Label>Гар утас </Label>
                      <Input
                        value={companyMobile}
                        onChange={(e) => setCompanyMobile(e.target.value)}
                        placeholder="Enter mobile phone"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Компанийн тэмдэглэл</Label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Enter Компанийн тэмдэглэл"
                        value={companyNote}
                        onChange={(e) => setCompanyNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

              
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSendOfferDialogOpen(false)}
              disabled={isSavingSendOffer}
            >
              Хаах
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to sent_offer and save Компанийн тэмдэглэл and company info
                if (selectedQuote) {
                  setIsSavingSendOffer(true)
                  try {
                    // Update selected products with new quantities and delivery times
                    const updatedProducts = selectedQuote.selectedProducts.map((product, index) => {
                      const productId = getProductKey(product, index)
                      if (!productId) return product
                      if (selectedForSendOffer.has(productId)) {
                        return {
                          ...product,
                          productId,
                          quantity: sendOfferQuantities[productId] !== undefined 
                            ? sendOfferQuantities[productId] 
                            : (product.quantity || 0),
                          delivery_time: sendOfferDeliveryTimes[productId] !== undefined 
                            ? sendOfferDeliveryTimes[productId] 
                            : ((product as any).delivery_time || (product as any).deliveryTime || ""),
                          status: "sent_offer",
                        }
                      }
                      return { ...product, productId }
                    })
                    
                    // Save Компанийн тэмдэглэл, company info, and updated products
                    const hasChanges = 
                      companyBankName !== ((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк") ||
                      companyAccountNumber !== ((selectedQuote as any).companyAccountNumber || "MN610004000 415148288") ||
                      companyName !== ((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК") ||
                      companyNote !== ((selectedQuote as any).companyNote || "") ||
                      companyAddress !== ((selectedQuote as any).companyAddress || "") ||
                      companyEmail !== ((selectedQuote as any).companyEmail || "") ||
                      companyPhone !== ((selectedQuote as any).companyPhone || "") ||
                      companyMobile !== ((selectedQuote as any).companyMobile || "") ||
                      companyRegNumber !== ((selectedQuote as any).companyRegNumber || "5332044") ||
                      buyerRegNumber !== ((selectedQuote as any).buyerRegNumber || "") ||
                      JSON.stringify(updatedProducts) !== JSON.stringify(selectedQuote.selectedProducts)
                    
                    if (hasChanges) {
                      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          companyBankName: companyBankName,
                          companyAccountNumber: companyAccountNumber,
                          companyName: companyName,
                          companyNote: companyNote,
                          companyAddress: companyAddress,
                          companyEmail: companyEmail,
                          companyPhone: companyPhone,
                          companyMobile: companyMobile,
                          companyRegNumber: companyRegNumber,
                          buyerRegNumber: buyerRegNumber,
                          selectedProducts: updatedProducts,
                        }),
                      })
                      const result = await response.json()
                      if (!result.success) {
                        throw new Error(result.error || "Failed to save company information")
                      }
                    }
                    
                    // Update only selected products to "sent_offer" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForSendOffer.has(getProductKey(product, index)))
                      .map((product, index) => {
                        return handleProductStatusChange(selectedQuote.id, getProductKey(product, index), "sent_offer")
                      })
                    
                    await Promise.all(updatePromises)
                    setIsSendOfferDialogOpen(false)
                    await fetchQuotes() // Refresh quotes list
                  } catch (error) {
                    console.error("Error saving offer:", error)
                    alert("Failed to save. Please try again.")
                  } finally {
                    setIsSavingSendOffer(false)
                  }
                }
              }}
              disabled={isSavingSendOffer}
              aria-busy={isSavingSendOffer}
            >
              {isSavingSendOffer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadSendOfferWord}
              disabled={isSavingSendOffer}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const mailto = buildMailtoLink("offer")
                if (!mailto) return
                window.location.href = mailto
              }}
              disabled={isSavingSendOffer}
            >
              <Mail className="mr-2 h-4 w-4" />
              Mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Form Dialog */}
      <Dialog
        open={isCreateInvoiceDialogOpen}
        onOpenChange={(open) => {
          if (isSavingInvoice) return
          setIsCreateInvoiceDialogOpen(open)
        }}
      >
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>НЭХЭМЖЛЭЛ </DialogTitle>
         
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Invoice Information */}
                <div>
                <h3 className="text-lg font-semibold mb-3">Харилцагчийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Нэхэмжлэлийн дугаар</Label>
                      <Input
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Гүйлгээний утга (№)</Label>
                      <Input
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Огноо</Label>
                      <Input
                        type="date"
                        value={invoiceDate || new Date().toISOString().split("T")[0]}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Холбоо барих ажилтан</Label>
                      <Input
                        value={`${selectedQuote.firstName} ${selectedQuote.lastName}`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Компаний нэр</Label>
                      <Input value={selectedQuote.company} disabled />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={buyerRegNumber}
                        onChange={(e) => setBuyerRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div>
                      <Label>Имэйл</Label>
                      <Input value={selectedQuote.email} disabled />
                    </div>
                    <div>
                      <Label>Утас</Label>
                      <Input value={selectedQuote.phone} disabled />
                    </div>
                    <div>
                      <Label>Төлбөр төлөх хугацаа</Label>
                      <Input
                        type="date"
                        value={paymentDueDate}
                        onChange={(e) => setPaymentDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Products to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараанууд</h3>
                  <div className="border rounded-md overflow-x-hidden">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Барааны нэр</TableHead>
                          <TableHead>Код</TableHead>
                          <TableHead>Хэмжих нэгж</TableHead>
                          <TableHead className="text-right w-[90px]">Тоо</TableHead>
                          <TableHead>Барааны төлөв</TableHead>
                          <TableHead className="text-right font-semibold w-[150px]">Нэгжийн үнэ(₮)</TableHead>
                          <TableHead className="text-right font-semibold w-[190px]">Нийт дүн(₮) (НӨАТ орсон)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filteredProducts = selectedQuote.selectedProducts.filter((product, index) =>
                            selectedForInvoice.has(getProductKey(product, index))
                          )
                          const totalAmount = filteredProducts.reduce((sum, product, index) => {
                            const productId = getProductKey(product, index)
                            const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                            const unitPrice = toNumber(invoicePrices[productId] ?? fallbackPrice)
                            const rawQuantity =
                              invoiceQuantities[productId] !== undefined
                                ? invoiceQuantities[productId]
                                : product.quantity
                            const quantity = toNumber(rawQuantity)
                            return sum + unitPrice * quantity
                          }, 0)

                          return (
                            <>
                              {filteredProducts.map((product, index) => {
                                const productId = getProductKey(product, index)
                                const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                                const unitPriceValue = invoicePrices[productId] ?? formatPriceInput(fallbackPrice)
                                const unitPriceDisplay = editingInvoicePriceId === productId
                                  ? unitPriceValue
                                  : formatPriceDisplay(unitPriceValue)
                                const rawQuantity = invoiceQuantities[productId] !== undefined 
                                  ? invoiceQuantities[productId] 
                                  : product.quantity
                                const quantity = toNumber(rawQuantity)
                                const total = toNumber(unitPriceValue) * quantity
                                const productCode = (product as any).product_code || (product as any).productCode || ""
                                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                                const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="text-center">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{transactionDescription}</TableCell>
                                    <TableCell>{productCode || "-"}</TableCell>
                                    <TableCell>{unitOfMeasurement}</TableCell>
                                    <TableCell className="text-right w-[90px]">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={quantity}
                                        onChange={(e) => {
                                          const newQuantity = parseFloat(e.target.value) || 0
                                          setInvoiceQuantities({
                                            ...invoiceQuantities,
                                            [productId]: newQuantity
                                          })
                                        }}
                                        className="w-full text-right"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={stockStatusColors[stockStatus as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                        {stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right w-[150px]">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={unitPriceDisplay}
                                        onFocus={() => setEditingInvoicePriceId(productId)}
                                        onChange={(e) => {
                                          setInvoicePrices((prev) => ({
                                            ...prev,
                                            [productId]: e.target.value
                                          }))
                                        }}
                                        onBlur={(e) => {
                                          const rounded = formatPriceInput(e.target.value)
                                          setInvoicePrices((prev) => ({
                                            ...prev,
                                            [productId]: rounded
                                          }))
                                          setEditingInvoicePriceId((prev) => (prev === productId ? null : prev))
                                        }}
                                        className="w-full text-right"
                                      />
                                    </TableCell>
                                    <TableCell className="text-right w-[190px]">
                                      <Input
                                        type="text"
                                        value={formatPriceDisplay(total)}
                                        readOnly
                                        className="w-full text-right bg-muted cursor-not-allowed font-semibold"
                                      />
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              <TableRow>
                                <TableCell colSpan={7} className="text-center font-semibold">
                                  НИЙТ ДҮН
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatPriceDisplay(totalAmount)}
                                </TableCell>
                              </TableRow>
                            </>
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
 
                </div>

                {/* Нэмэлт мэдээлэл */}
                <div>
                  <Label>Нэмэлт мэдээлэл</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                    placeholder="Нэмэлт мэдээлэл ..."
                    value={selectedQuote.additionalInfo || ""}
                    readOnly
                    disabled
                  />
                </div>

                {/* Our Company Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Нэхэмжлэл илгээгч компанийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Компанийн нэр</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={companyRegNumber}
                        onChange={(e) => setCompanyRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div>
                      <Label>Банкны нэр</Label>
                      <Input
                        value={companyBankName}
                        onChange={(e) => setCompanyBankName(e.target.value)}
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Дансны дугаар</Label>
                      <Input
                        value={companyAccountNumber}
                        onChange={(e) => setCompanyAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг</Label>
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Enter company address"
                      />
                    </div>
                    <div>
                      <Label>Имэйл хаяг</Label>
                      <Input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Утас, Факс</Label>
                      <Input
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="Enter phone/fax"
                      />
                    </div>
                    <div>
                      <Label>Гар утас</Label>
                      <Input
                        value={companyMobile}
                        onChange={(e) => setCompanyMobile(e.target.value)}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Компанийн тэмдэглэл</Label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Enter Компанийн тэмдэглэл "
                        value={companyNote}
                        onChange={(e) => setCompanyNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
             
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateInvoiceDialogOpen(false)}
              disabled={isSavingInvoice}
            >
              Хаах 
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to create_invoice
                if (selectedQuote) {
                  setIsSavingInvoice(true)
                  try {
                    const updatedProducts = selectedQuote.selectedProducts.map((product, index) => {
                      const productId = getProductKey(product, index)
                      if (!productId) return product
                      if (selectedForInvoice.has(productId)) {
                        return {
                          ...product,
                          productId,
                          quantity: invoiceQuantities[productId] !== undefined 
                            ? invoiceQuantities[productId] 
                            : (product.quantity || 0),
                          delivery_time: invoiceDeliveryTimes[productId] !== undefined
                            ? invoiceDeliveryTimes[productId]
                            : ((product as any).delivery_time || (product as any).deliveryTime || ""),
                        }
                      }
                      return { ...product, productId }
                    })

                    // Save invoice info, Компанийн тэмдэглэл, and company info if changed
                    const hasChanges = 
                      invoiceNumber !== ((selectedQuote as any).invoiceNumber || "") ||
                      invoiceDate !== ((selectedQuote as any).invoiceDate || "") ||
                      paymentDueDate !== ((selectedQuote as any).paymentDueDate || "") ||
                      companyBankName !== ((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк") ||
                      companyAccountNumber !== ((selectedQuote as any).companyAccountNumber || "MN610004000 415148288") ||
                      companyName !== ((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК") ||
                      companyNote !== ((selectedQuote as any).companyNote || "") ||
                      companyAddress !== ((selectedQuote as any).companyAddress || "") ||
                      companyEmail !== ((selectedQuote as any).companyEmail || "") ||
                      companyPhone !== ((selectedQuote as any).companyPhone || "") ||
                      companyMobile !== ((selectedQuote as any).companyMobile || "") ||
                      companyRegNumber !== ((selectedQuote as any).companyRegNumber || "5332044") ||
                      buyerRegNumber !== ((selectedQuote as any).buyerRegNumber || "") ||
                      JSON.stringify(updatedProducts) !== JSON.stringify(selectedQuote.selectedProducts)

                    if (hasChanges) {
                      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          invoiceNumber: invoiceNumber,
                          invoiceDate: invoiceDate,
                          paymentDueDate: paymentDueDate,
                          companyBankName: companyBankName,
                          companyAccountNumber: companyAccountNumber,
                          companyName: companyName,
                          companyNote: companyNote,
                          companyAddress: companyAddress,
                          companyEmail: companyEmail,
                          companyPhone: companyPhone,
                          companyMobile: companyMobile,
                          companyRegNumber: companyRegNumber,
                          buyerRegNumber: buyerRegNumber,
                          selectedProducts: updatedProducts,
                        }),
                      })
                      const result = await response.json()
                      if (!result.success) {
                        throw new Error(result.error || "Failed to save company information")
                      }
                    }

                    // Update only selected products to "create_invoice" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForInvoice.has(getProductKey(product, index)))
                      .map((product, index) => {
                        return handleProductStatusChange(selectedQuote.id, getProductKey(product, index), "create_invoice")
                      })
                    
                    await Promise.all(updatePromises)
                    setSelectedQuote((prev) => prev ? {
                      ...prev,
                      invoiceNumber,
                      invoiceDate,
                      paymentDueDate,
                      companyNote,
                      companyAddress,
                      companyEmail,
                      companyPhone,
                      companyMobile,
                      selectedProducts: updatedProducts,
                    } : prev)
                    setQuotes((prev) => prev.map((quote) => 
                      quote.id === selectedQuote.id
                        ? {
                            ...quote,
                            invoiceNumber,
                            invoiceDate,
                            paymentDueDate,
                            companyNote,
                            companyAddress,
                            companyEmail,
                            companyPhone,
                            companyMobile,
                            selectedProducts: updatedProducts,
                          }
                        : quote
                    ))
                    setIsCreateInvoiceDialogOpen(false)
                    await fetchQuotes() // Refresh quotes list
                  } catch (error) {
                    console.error("Error saving invoice:", error)
                  } finally {
                    setIsSavingInvoice(false)
                  }
                }
              }}
              disabled={isSavingInvoice}
              aria-busy={isSavingInvoice}
            >
              {isSavingInvoice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadInvoiceWord}
              disabled={isSavingInvoice}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const mailto = buildMailtoLink("invoice")
                if (!mailto) return
                window.location.href = mailto
              }}
              disabled={isSavingInvoice}
            >
              <Mail className="mr-2 h-4 w-4" />
              Mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Зарлагын баримт Form Dialog - Expense Receipt */}
      <Dialog
        open={isSpentDialogOpen}
        onOpenChange={(open) => {
          if (isSavingSpent) return
          setIsSpentDialogOpen(open)
        }}
      >
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>ЗАРЛАГЫН БАРИМТ</DialogTitle>

          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Expense Receipt Information */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div>
                      
                      <Label>Зарлагын баримтын дугаар</Label>
                      <Input
                        value={spentNumber}
                        onChange={(e) => setSpentNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Огноо</Label>
                      <Input
                        type="date"
                        value={spentDate || new Date().toISOString().split("T")[0]}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Холбоо барих ажилтан</Label>
                      <Input
                        value={`${selectedQuote.firstName} ${selectedQuote.lastName}`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Компани</Label>
                      <Input value={selectedQuote.company} disabled />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={buyerRegNumber}
                        onChange={(e) => setBuyerRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div>
                      <Label>Имэйл</Label>
                      <Input value={selectedQuote.email} disabled />
                    </div>
                    <div>
                      <Label>Утас</Label>
                      <Input value={selectedQuote.phone} disabled />
                    </div>
                  </div>
                </div>

                {/* Products to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараанууд</h3>
                  <div className="border rounded-md overflow-x-hidden">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Барааны нэр</TableHead>
                          <TableHead>Код</TableHead>
                          <TableHead>Хэмжих нэгж</TableHead>
                          <TableHead className="text-right w-[90px]">Тоо</TableHead>
                          <TableHead>Барааны төлөв</TableHead>
                          <TableHead className="text-right font-semibold w-[150px]">Нэгжийн үнэ(₮)</TableHead>
                          <TableHead className="text-right font-semibold w-[190px]">Нийт дүн(₮) (НӨАТ орсон)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filteredProducts = selectedQuote.selectedProducts.filter((product, index) =>
                            selectedForSpent.has(getProductKey(product, index))
                          )
                          const totalAmount = filteredProducts.reduce((sum, product, index) => {
                            const productId = getProductKey(product, index)
                            const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                            const unitPrice = toNumber(spentPrices[productId] ?? fallbackPrice)
                            const rawQuantity =
                              spentQuantities[productId] !== undefined
                                ? spentQuantities[productId]
                                : product.quantity
                            const quantity = toNumber(rawQuantity)
                            return sum + unitPrice * quantity
                          }, 0)

                          return (
                            <>
                              {filteredProducts.map((product, index) => {
                                const productId = getProductKey(product, index)
                                const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                                const unitPrice = spentPrices[productId] ?? String(fallbackPrice)
                                const rawQuantity = spentQuantities[productId] !== undefined 
                                  ? spentQuantities[productId] 
                                  : product.quantity
                                const quantity = toNumber(rawQuantity)
                                const total = toNumber(unitPrice) * quantity
                                const productCode = (product as any).product_code || (product as any).productCode || ""
                                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                                const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="text-center">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{transactionDescription}</TableCell>
                                    <TableCell>{productCode || "-"}</TableCell>
                                    <TableCell>{unitOfMeasurement}</TableCell>
                                    <TableCell className="text-right w-[90px]">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={quantity}
                                        onChange={(e) => {
                                          const newQuantity = parseFloat(e.target.value) || 0
                                          setSpentQuantities({
                                            ...spentQuantities,
                                            [productId]: newQuantity
                                          })
                                        }}
                                        className="w-full text-right"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={stockStatusColors[stockStatus as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                        {stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right w-[150px]">
                                      <Input
                                        type="text"
                                        value={formatPriceDisplay(unitPrice)}
                                        readOnly
                                        className="w-full text-right bg-muted cursor-not-allowed font-medium"
                                      />
                                    </TableCell>
                                    <TableCell className="text-right w-[190px]">
                                      <Input
                                        type="text"
                                        value={formatPriceDisplay(total)}
                                        readOnly
                                        className="w-full text-right bg-muted cursor-not-allowed font-semibold"
                                      />
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              <TableRow>
                                <TableCell colSpan={7} className="text-center font-semibold">
                                  НИЙТ ДҮН
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatPriceDisplay(totalAmount)}
                                </TableCell>
                              </TableRow>
                            </>
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
 
                </div>

                {/* Нэмэлт мэдээлэл */}
                <div>
                  <Label>Нэмэлт мэдээлэл</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                    placeholder="Нэмэлт мэдээлэл ..."
                    value={selectedQuote.additionalInfo || ""}
                    readOnly
                    disabled
                  />
                </div>

                {/* Our Company Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Зарлагын баримт илгээгч компанийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Компанийн нэр</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="БАЯН ӨНДӨР ХХК"
                      />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={companyRegNumber}
                        onChange={(e) => setCompanyRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг</Label>
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Enter company address"
                      />
                    </div>
                    <div>
                      <Label>Имэйл хаяг</Label>
                      <Input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Утас, Факс</Label>
                      <Input
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="Enter phone/fax"
                      />
                    </div>
                    <div>
                      <Label>Гар утас</Label>
                      <Input
                        value={companyMobile}
                        onChange={(e) => setCompanyMobile(e.target.value)}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Компанийн тэмдэглэл</Label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Enter Компанийн тэмдэглэл (will be displayed in Invoice form)..."
                        value={companyNote}
                        onChange={(e) => setCompanyNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDownloadSpentWord}
              disabled={isSavingSpent}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const mailto = buildMailtoLink("spent")
                if (!mailto) return
                window.location.href = mailto
              }}
              disabled={isSavingSpent}
            >
              <Mail className="mr-2 h-4 w-4" />
              Mail
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSpentDialogOpen(false)}
              disabled={isSavingSpent}
            >
              Хаах 
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to spent
                if (selectedQuote) {
                  setIsSavingSpent(true)
                  try {
                    const updatedProducts = selectedQuote.selectedProducts.map((product, index) => {
                      const productId = getProductKey(product, index)
                      if (!productId) return product
                      if (selectedForSpent.has(productId)) {
                        return {
                          ...product,
                          productId,
                          quantity: spentQuantities[productId] !== undefined 
                            ? spentQuantities[productId] 
                            : (product.quantity || 0),
                          delivery_time: spentDeliveryTimes[productId] !== undefined
                            ? spentDeliveryTimes[productId]
                            : ((product as any).delivery_time || (product as any).deliveryTime || ""),
                        }
                      }
                      return { ...product, productId }
                    })

                    const hasChanges = 
                      spentNumber !== ((selectedQuote as any).spentNumber || "") ||
                      spentDate !== ((selectedQuote as any).spentDate || "") ||
                      companyBankName !== ((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк") ||
                      companyAccountNumber !== ((selectedQuote as any).companyAccountNumber || "MN610004000 415148288") ||
                      companyName !== ((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК") ||
                      companyNote !== ((selectedQuote as any).companyNote || "") ||
                      companyAddress !== ((selectedQuote as any).companyAddress || "") ||
                      companyEmail !== ((selectedQuote as any).companyEmail || "") ||
                      companyPhone !== ((selectedQuote as any).companyPhone || "") ||
                      companyMobile !== ((selectedQuote as any).companyMobile || "") ||
                      companyRegNumber !== ((selectedQuote as any).companyRegNumber || "5332044") ||
                      buyerRegNumber !== ((selectedQuote as any).buyerRegNumber || "") ||
                      JSON.stringify(updatedProducts) !== JSON.stringify(selectedQuote.selectedProducts)

                    if (hasChanges) {
                      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          spentNumber: spentNumber,
                          spentDate: spentDate,
                          companyBankName: companyBankName,
                          companyAccountNumber: companyAccountNumber,
                          companyName: companyName,
                          companyNote: companyNote,
                          companyAddress: companyAddress,
                          companyEmail: companyEmail,
                          companyPhone: companyPhone,
                          companyMobile: companyMobile,
                          companyRegNumber: companyRegNumber,
                          buyerRegNumber: buyerRegNumber,
                          selectedProducts: updatedProducts,
                        }),
                      })
                      const result = await response.json()
                      if (!result.success) {
                        throw new Error(result.error || "Failed to save expense receipt information")
                      }
                    }

                    // Update only selected products to "spent" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForSpent.has(getProductKey(product, index)))
                      .map((product, index) => {
                        return handleProductStatusChange(selectedQuote.id, getProductKey(product, index), "spent")
                      })
                    
                    await Promise.all(updatePromises)
                    
                    // Decrement stock only for items newly marked as spent
                    const itemsToDecrement = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForSpent.has(getProductKey(product, index)))
                      .filter((product) => {
                        const statusValue = product.status || (product as any).status_type || "pending"
                        return statusValue !== "spent"
                      })
                      .map((product, index) => {
                        const rawId =
                          (product as any).productId ||
                          (product as any).product_id ||
                          (product as any).id ||
                          ""
                        const resolvedId = String(rawId).trim()
                        const productCode =
                          (product as any).product_code ||
                          (product as any).productCode ||
                          ""
                        const quantity = spentQuantities[getProductKey(product, index)] !== undefined
                          ? spentQuantities[getProductKey(product, index)]
                          : (product as any).quantity || 0
                        return {
                          productId: resolvedId,
                          productCode: String(productCode).trim(),
                          quantity: Number(quantity) || 0,
                        }
                      })
                      .filter(
                        (item) =>
                          (item.productId || item.productCode) &&
                          (!item.productId || !item.productId.startsWith("product-")) &&
                          item.quantity > 0
                      )

                    if (itemsToDecrement.length > 0) {
                      const stockResponse = await fetch("/api/products/decrement-stock", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ items: itemsToDecrement }),
                      })
                      const stockResult = await stockResponse.json()
                      if (!stockResult.success) {
                        throw new Error(stockResult.error || "Failed to update product stock")
                      }
                      if (stockResult.count === 0) {
                        alert("Нөөц шинэчлэгдсэнгүй. Барааны код/ID таарахгүй байж магадгүй.")
                      }
                      if (stockResult.missing && stockResult.missing.length > 0) {
                        console.warn("Missing products for stock update:", stockResult.missing)
                      }
                    }

                    setSelectedQuote((prev) => prev ? {
                      ...prev,
                      spentNumber,
                      spentDate,
                      companyNote,
                      companyAddress,
                      companyEmail,
                      companyPhone,
                      companyMobile,
                      selectedProducts: updatedProducts,
                    } : prev)
                    setQuotes((prev) => prev.map((quote) => 
                      quote.id === selectedQuote.id
                        ? {
                            ...quote,
                            spentNumber,
                            spentDate,
                            companyNote,
                            companyAddress,
                            companyEmail,
                            companyPhone,
                            companyMobile,
                            selectedProducts: updatedProducts,
                          }
                        : quote
                    ))
                    setIsSpentDialogOpen(false)
                    await fetchQuotes() // Refresh quotes list
                  } catch (error) {
                    console.error("Error saving spent:", error)
                  } finally {
                    setIsSavingSpent(false)
                  }
                }
              }}
              disabled={isSavingSpent}
              aria-busy={isSavingSpent}
            >
              {isSavingSpent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

