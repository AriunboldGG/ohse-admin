"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Eye, Download, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react"
import { SpecialOrder } from "@/lib/types"

const ITEMS_PER_PAGE = 25

export default function SpecialOrdersPage() {
  const [orders, setOrders] = useState<SpecialOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<SpecialOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch orders from Firebase
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Build query params for date filtering
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const url = `/api/special-orders${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success) {
        setOrders(result.data || [])
        setCurrentPage(1) // Reset to first page when filters change
      } else {
        setError(result.error || "Failed to fetch special orders")
      }
    } catch (err: any) {
      console.error("Error fetching special orders:", err)
      setError(err?.message || "Failed to load special orders. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch orders when date filters change (with debounce)
  useEffect(() => {
    if (orders.length === 0 && isLoading) return

    const timer = setTimeout(() => {
      fetchOrders()
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const handleViewOrder = (order: SpecialOrder) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
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

  // Filter orders by date range (client-side fallback if server-side filtering fails)
  const getFilteredOrders = (): SpecialOrder[] => {
    if (!startDate && !endDate) {
      return orders
    }
    
    return orders.filter((order) => {
      try {
        let orderDate: Date
        const createdAt = order.createdAt as any
        
        if (createdAt) {
          if (typeof createdAt === 'string') {
            orderDate = new Date(createdAt)
          } else if (createdAt instanceof Date) {
            orderDate = createdAt
          } else if (createdAt.toDate && typeof createdAt.toDate === 'function') {
            orderDate = createdAt.toDate()
          } else if (createdAt.seconds) {
            orderDate = new Date(createdAt.seconds * 1000)
          } else {
            orderDate = new Date(createdAt)
          }
        } else {
          return false
        }
        
        if (isNaN(orderDate.getTime())) {
          return false
        }
        
        const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
        
        if (startDate && endDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return orderDateOnly >= start && orderDateOnly <= end
        } else if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          return orderDateOnly >= start
        } else if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return orderDateOnly <= end
        }
        
        return true
      } catch (error) {
        console.error("Error filtering order by date:", error, order)
        return false
      }
    })
  }

  const filteredOrders = getFilteredOrders()

  // Search filtering
  const getSearchedOrders = (): SpecialOrder[] => {
    if (!searchQuery.trim()) {
      return filteredOrders
    }

    const query = searchQuery.toLowerCase().trim()
    return filteredOrders.filter((order) => {
      const searchableFields = [
        order.name,
        order.email,
        order.phone,
        order.organizationName,
        order.productName,
        order.productDescription,
        order.quantity,
        order.technicalRequirements,
        order.additionalInfo,
      ]
        .filter(Boolean)
        .map((field) => field?.toLowerCase() || "")

      return searchableFields.some((field) => field.includes(query))
    })
  }

  const searchedOrders = getSearchedOrders()

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(searchedOrders.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedOrders = searchedOrders.slice(startIndex, endIndex)

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1)
    setSelectedOrders(new Set()) // Clear selections when search changes
  }, [searchQuery])

  // Clear selections when date filters change
  useEffect(() => {
    setSelectedOrders(new Set())
  }, [startDate, endDate])

  // Select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(searchedOrders.map(o => o.id)))
    } else {
      setSelectedOrders(new Set())
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSet = new Set(selectedOrders)
    if (checked) {
      newSet.add(orderId)
    } else {
      newSet.delete(orderId)
    }
    setSelectedOrders(newSet)
  }

  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) return

    if (!confirm(`Та ${selectedOrders.size} захиалгыг устгахдаа итгэлтэй байна уу?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedOrders).map(id =>
        fetch(`/api/special-orders/${id}`, { method: "DELETE" })
      )
      
      const results = await Promise.allSettled(deletePromises)
      const failed = results.filter(r => r.status === "rejected" || !r.value.ok)
      
      if (failed.length > 0) {
        alert(`Зарим захиалгыг устгахад алдаа гарлаа. ${failed.length} алдаатай.`)
      } else {
        setSelectedOrders(new Set())
        await fetchOrders()
      }
    } catch (error) {
      console.error("Error deleting orders:", error)
      alert("Захиалгыг устгахад алдаа гарлаа.")
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = searchedOrders.length > 0 && selectedOrders.size === searchedOrders.length
  const isIndeterminate = selectedOrders.size > 0 && selectedOrders.size < searchedOrders.length

  const handleDownloadExcel = async () => {
    // Dynamically import xlsx to avoid SSR issues
    const XLSX = await import("xlsx")

    // Prepare data for Excel export (use searched orders)
    const excelData = searchedOrders.map((order) => ({
      "Огноо": formatDate(order.createdAt),
      "Нэр": order.name,
      "И-мэйл": order.email,
      "Утас": order.phone,
      "Байгууллагын нэр": order.organizationName || "-",
      "Бүтээгдэхүүний нэр": order.productName,
      "Бүтээгдэхүүний тайлбар": order.productDescription,
      "Тоо ширхэг": order.quantity,
      "Техникийн шаардлага": order.technicalRequirements || "-",
      "Нэмэлт мэдээлэл": order.additionalInfo || "-",
    }))

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Тусгай захиалга")

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Огноо
      { wch: 15 }, // Нэр
      { wch: 25 }, // И-мэйл
      { wch: 15 }, // Утас
      { wch: 20 }, // Байгууллагын нэр
      { wch: 30 }, // Бүтээгдэхүүний нэр
      { wch: 40 }, // Бүтээгдэхүүний тайлбар
      { wch: 15 }, // Тоо ширхэг
      { wch: 30 }, // Техникийн шаардлага
      { wch: 40 }, // Нэмэлт мэдээлэл
    ]
    worksheet["!cols"] = columnWidths

    // Generate Excel file and download
    let fileName = `Тусгай_захиалга_${new Date().toISOString().split("T")[0]}`
    if (startDate || endDate) {
      const dateRange = `${startDate || "эхлэл"}_${endDate || "төгсгөл"}`
      fileName = `Тусгай_захиалга_${dateRange}`
    }
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Тусгай захиалга</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Тусгай захиалгын удирдах цэс
          </p>
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
              <CardTitle className="text-lg sm:text-xl">Тусгай захиалгууд</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Нийт {filteredOrders.length} захиалга ({currentPage}/{totalPages} хуудас)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {selectedOrders.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Устгах ({selectedOrders.size})
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
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

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
                <TableHead className="min-w-[120px]">Нэр</TableHead>
                <TableHead className="hidden md:table-cell min-w-[180px]">И-мэйл</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[120px]">Утас</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[150px]">Байгууллагын нэр</TableHead>
                <TableHead className="min-w-[150px]">Бүтээгдэхүүний нэр</TableHead>
                <TableHead className="min-w-[100px]">Тоо ширхэг</TableHead>
                <TableHead className="text-right min-w-[100px]">Үйлдлүүд</TableHead>
                <TableHead className="min-w-[120px]">Огноо</TableHead>
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
                      onClick={fetchOrders}
                    >
                      Дахин оролдох
                    </Button>
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    {orders.length === 0 
                      ? "Тусгай захиалга олдсонгүй."
                      : searchQuery
                        ? `"${searchQuery}" хайлтад тохирох захиалга олдсонгүй.`
                        : `Сонгосон огнооны хүрээнд захиалга олдсонгүй${startDate || endDate ? ` (${startDate || "..."} - ${endDate || "..."})` : ""}.`}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </TableCell>
                    <TableCell className="font-medium min-w-[120px]">{order.name}</TableCell>
                    <TableCell className="hidden md:table-cell min-w-[180px]">{order.email}</TableCell>
                    <TableCell className="hidden lg:table-cell min-w-[120px]">{order.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell font-medium min-w-[150px]">{order.organizationName || "-"}</TableCell>
                    <TableCell className="min-w-[150px]">{order.productName}</TableCell>
                    <TableCell className="min-w-[100px]">{order.quantity}</TableCell>
                    <TableCell className="text-right min-w-[100px]">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewOrder(order)}
                        title="Дэлгэрэнгүй харах"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="min-w-[120px]">{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </div>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Нийт {searchedOrders.length} захиалга ({currentPage}/{totalPages} хуудас)
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="hidden sm:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Өмнөх
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="sm:hidden"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 sm:w-10 text-xs sm:text-sm"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex"
                >
                  Дараах
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="sm:hidden"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Тусгай захиалгын дэлгэрэнгүй</DialogTitle>
                <DialogDescription>
                  Захиалгын бүх мэдээлэл
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact Information */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Харилцагчийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Нэр
                      </label>
                      <p className="text-sm">{selectedOrder.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        И-мэйл
                      </label>
                      <p className="text-sm">{selectedOrder.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Утас
                      </label>
                      <p className="text-sm">{selectedOrder.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Байгууллагын нэр
                      </label>
                      <p className="text-sm">{selectedOrder.organizationName || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Бүтээгдэхүүний мэдээлэл</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Бүтээгдэхүүний нэр
                      </label>
                      <p className="text-sm">{selectedOrder.productName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Бүтээгдэхүүний тайлбар
                      </label>
                      <div className="mt-1 p-3 bg-muted rounded-md min-h-[80px]">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {selectedOrder.productDescription}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Тоо ширхэг
                      </label>
                      <p className="text-sm">{selectedOrder.quantity}</p>
                    </div>
                    {selectedOrder.technicalRequirements && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Техникийн шаардлага / Хэмжээ, хэлбэр
                        </label>
                        <div className="mt-1 p-3 bg-muted rounded-md min-h-[80px]">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {selectedOrder.technicalRequirements}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedOrder.additionalInfo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Нэмэлт мэдээлэл
                        </label>
                        <div className="mt-1 p-3 bg-muted rounded-md min-h-[80px]">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {selectedOrder.additionalInfo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Information */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Огноо
                  </label>
                  <p className="text-sm mt-1">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDialogOpen(false)}>Хаах</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
