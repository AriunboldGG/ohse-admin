export interface PriceQuote {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  additionalInfo: string
  company: string
  selectedProducts: Array<{
    productId: string
    productName: string
    quantity?: number
    status?: "sent_offer" | "create_invoice" | "spent"
  }>
  status: "sent_offer" | "create_invoice" | "spent" | "pending"
  quoteStatus?: "new" | "pending" | "in_progress" | "completed" | "rejected" // Overall quote status
  createdAt: string
  updatedAt?: string
}

export interface SpecialOrder {
  id: string
  name: string
  email: string
  phone: string
  organizationName?: string
  productName: string
  productDescription: string
  quantity: string
  technicalRequirements?: string
  additionalInfo?: string
  createdAt: string
  updatedAt?: string
}
