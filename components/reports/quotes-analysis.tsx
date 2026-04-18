"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportToExcel } from "@/lib/excel-export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { PriceQuote } from "@/lib/types"

interface QuotesAnalysisReportProps {
  period: string
}

interface ChartData {
  date: string
  quotes: number
  [key: string]: string | number
}

const statusLabels: Record<string, string> = {
  sent_offer: "Үнийн санал",
  create_invoice: "Нэхэмжлэх",
  spent: "Зарцуулсан",
  pending: "Хүлээгдэж буй",
}

const statusTextColors: Record<string, string> = {
  sent_offer: "text-blue-600",
  create_invoice: "text-green-600",
  spent: "text-orange-600",
  pending: "text-gray-600",
}

const statusChartColors: Record<string, string> = {
  sent_offer: "#82ca9d",
  create_invoice: "#0088fe",
  spent: "#ffc658",
  pending: "#ff7300",
}

const fallbackChartColors = ["#8884d8", "#00c49f", "#ff8042", "#a855f7", "#22c55e"]

export function QuotesAnalysisReport({ period }: QuotesAnalysisReportProps) {
  const [quotes, setQuotes] = useState<PriceQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const getStatusLabel = (status: string) => statusLabels[status] || status

  const getChartColor = (status: string, index: number) =>
    statusChartColors[status] || fallbackChartColors[index % fallbackChartColors.length]

  const normalizeStatus = (status?: string) => status || "pending"

  const getQuoteStatus = (quote: PriceQuote) => {
    const products = quote.selectedProducts || []
    if (products.length === 0) {
      return normalizeStatus(quote.status)
    }

    const normalizedStatuses = products.map((product) =>
      normalizeStatus(product.status || (product as any).status_type)
    )

    const allSpent = normalizedStatuses.every((status) => status === "spent")
    if (allSpent) return "spent"

    const allInvoiceOrSpent = normalizedStatuses.every(
      (status) => status === "create_invoice" || status === "spent"
    )
    if (allInvoiceOrSpent) return "create_invoice"

    const hasStatus = normalizedStatuses.some((status) => status !== "pending")
    if (hasStatus) return "sent_offer"

    return "pending"
  }

  const filteredQuotes = useMemo(() => {
    if (!quotes.length) return []
    const now = new Date()
    let periodStartDate: Date

    switch (period) {
      case "month":
        periodStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1) // Last 6 months
        break
      case "halfyear":
        periodStartDate = new Date(now.getFullYear() - 1, now.getMonth(), 1) // Last year
        break
      case "year":
        periodStartDate = new Date(now.getFullYear() - 1, 0, 1) // Last 2 years
        break
      default:
        periodStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    }

    const rangeStart = startDate ? new Date(startDate) : null
    if (rangeStart) rangeStart.setHours(0, 0, 0, 0)
    const rangeEnd = endDate ? new Date(endDate) : null
    if (rangeEnd) rangeEnd.setHours(23, 59, 59, 999)

    return quotes.filter((quote) => {
      const quoteDate = new Date(quote.createdAt)
      if (quoteDate < periodStartDate) return false
      if (rangeStart && quoteDate < rangeStart) return false
      if (rangeEnd && quoteDate > rangeEnd) return false
      return true
    })
  }, [quotes, period, startDate, endDate])

  const { statusCounts, statusKeys } = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredQuotes.forEach((quote) => {
      const status = getQuoteStatus(quote)
      counts[status] = (counts[status] || 0) + 1
    })

    const orderedKeys = ["sent_offer", "create_invoice", "spent", "pending"]
    const remainingKeys = Object.keys(counts)
      .filter((key) => !orderedKeys.includes(key))
      .sort((a, b) => a.localeCompare(b))
    const keys = orderedKeys.filter((key) => counts[key]).concat(remainingKeys)

    return { statusCounts: counts, statusKeys: keys }
  }, [filteredQuotes])

  const productData = useMemo(() => {
    const grouped: Record<string, { product: string; quotes: number; quantity: number }> = {}
    filteredQuotes.forEach((quote) => {
      quote.selectedProducts?.forEach((product) => {
        const name = product.productName || "Unknown Product"
        if (!grouped[name]) {
          grouped[name] = { product: name, quotes: 0, quantity: 0 }
        }
        grouped[name].quotes += 1
        grouped[name].quantity += Number(product.quantity || 0)
      })
    })
    return Object.values(grouped).sort((a, b) => b.quotes - a.quotes)
  }, [filteredQuotes])

  const companyData = useMemo(() => {
    const grouped: Record<string, { company: string; quotes: number }> = {}
    filteredQuotes.forEach((quote) => {
      const company = quote.company || "Unknown Company"
      if (!grouped[company]) {
        grouped[company] = { company, quotes: 0 }
      }
      grouped[company].quotes += 1
    })
    return Object.values(grouped).sort((a, b) => b.quotes - a.quotes)
  }, [filteredQuotes])

  const topProductData = useMemo(() => productData.slice(0, 10), [productData])
  const topCompanyData = useMemo(() => companyData.slice(0, 10), [companyData])

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/quotes")
      const result = await response.json()

      if (result.success && result.data) {
        setQuotes(result.data)
      } else {
        setError(result.error || "Failed to fetch quotes")
      }
    } catch (err: any) {
      console.error("Error fetching quotes:", err)
      setError(err.message || "Failed to fetch quotes")
    } finally {
      setIsLoading(false)
    }
  }

  // Process quotes data based on period
  const chartData = useMemo(() => {
    if (!filteredQuotes.length) return []

    let groupBy: "month" | "quarter" | "year"

    switch (period) {
      case "month":
        groupBy = "month"
        break
      case "halfyear":
        groupBy = "quarter"
        break
      case "year":
        groupBy = "year"
        break
      default:
        groupBy = "month"
    }

    const grouped: Record<string, ChartData> = {}

    filteredQuotes.forEach((quote) => {
      const quoteDate = new Date(quote.createdAt)
      let key: string

      if (groupBy === "month") {
        const monthNames = [
          "1-р сар",
          "2-р сар",
          "3-р сар",
          "4-р сар",
          "5-р сар",
          "6-р сар",
          "7-р сар",
          "8-р сар",
          "9-р сар",
          "10-р сар",
          "11-р сар",
          "12-р сар",
        ]
        key = `${quoteDate.getFullYear()}-${quoteDate.getMonth()}`
        const displayKey = `${monthNames[quoteDate.getMonth()]} ${quoteDate.getFullYear()}`
        if (!grouped[key]) {
          grouped[key] = {
            date: displayKey,
            quotes: 0,
          }
        }
      } else if (groupBy === "quarter") {
        const quarter = Math.floor(quoteDate.getMonth() / 3) + 1
        key = `${quoteDate.getFullYear()}-Q${quarter}`
        const displayKey = `${quarter}-р улирал ${quoteDate.getFullYear()}`
        if (!grouped[key]) {
          grouped[key] = {
            date: displayKey,
            quotes: 0,
          }
        }
      } else {
        key = `${quoteDate.getFullYear()}`
        if (!grouped[key]) {
          grouped[key] = {
            date: key,
            quotes: 0,
          }
        }
      }

      const status = getQuoteStatus(quote)
      grouped[key].quotes = (grouped[key].quotes as number) + 1
      grouped[key][status] = ((grouped[key][status] as number) || 0) + 1
    })

    return Object.values(grouped).sort((a, b) => {
      const dateA = a.date
      const dateB = b.date
      return dateA.localeCompare(dateB)
    })
  }, [filteredQuotes, period])

  const handleExport = () => {
    const exportData = chartData.map((item) => {
      const row: Record<string, string | number> = {
        Огноо: item.date,
        "Үнийн санал": item.quotes,
      }
      statusKeys.forEach((status) => {
        row[getStatusLabel(status)] = (item[status] as number) || 0
      })
      return row
    })
    exportToExcel(exportData, `quotes-analysis-${period}`, "Quotes Analysis")
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p>Уншиж байна...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          <p>Алдаа: {error}</p>
          <Button onClick={fetchQuotes} className="mt-4" variant="outline">
            Дахин оролдох
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Эхлэх:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Дуусах:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  onClick={() => {
                    setStartDate("")
                    setEndDate("")
                  }}
                >
                  Цэвэрлэх
                </Button>
              )}
            </div>
            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Excel татах
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Counts Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Үнийн саналын мэдээлэл</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold">{filteredQuotes.length}</div>
                  <p className="text-sm text-muted-foreground mt-2">Нийт үнийн санал</p>
                </CardContent>
              </Card>
              {statusKeys.map((status) => {
                const count = statusCounts[status] || 0
                const percent = filteredQuotes.length
                  ? Math.round((count / filteredQuotes.length) * 100)
                  : 0
                return (
                  <Card key={status}>
                    <CardContent className="pt-6">
                      <div className={`text-3xl font-bold ${statusTextColors[status] || ""}`}>
                        {count}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{getStatusLabel(status)}</p>
                      <p className="text-xs text-muted-foreground mt-1">({percent}%)</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Status Breakdown Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Үнийн саналын мэдээлэл</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Төлөв</TableHead>
                        <TableHead className="text-center">Тоо</TableHead>
                        <TableHead className="text-center">Хувь</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Нийт үнийн санал</TableCell>
                        <TableCell className="text-center font-bold text-lg">{filteredQuotes.length}</TableCell>
                        <TableCell className="text-center">100%</TableCell>
                      </TableRow>
                      {statusKeys.map((status) => {
                        const count = statusCounts[status] || 0
                        const percent = filteredQuotes.length
                          ? Math.round((count / filteredQuotes.length) * 100)
                          : 0
                        const textClass = statusTextColors[status] || ""
                        return (
                          <TableRow key={status}>
                            <TableCell className={`font-medium ${textClass}`}>{getStatusLabel(status)}</TableCell>
                            <TableCell className={`text-center font-bold text-lg ${textClass}`}>{count}</TableCell>
                            <TableCell className="text-center">{percent}%</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart */}
          {chartData.length > 0 && (
            <>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="quotes"
                      stroke="#8884d8"
                      name="Нийт үнийн санал"
                      strokeWidth={2}
                    />
                    {statusKeys.map((status, index) => (
                      <Line
                        key={status}
                        type="monotone"
                        dataKey={status}
                        stroke={getChartColor(status, index)}
                        name={getStatusLabel(status)}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quotes" fill="#8884d8" name="Нийт үнийн санал" />
                    {statusKeys.map((status, index) => (
                      <Bar
                        key={status}
                        dataKey={status}
                        fill={getChartColor(status, index)}
                        name={getStatusLabel(status)}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо/Хугацаа</TableHead>
                      <TableHead className="text-right">Нийт үнийн санал</TableHead>
                      {statusKeys.map((status) => (
                        <TableHead key={status} className="text-right">
                          {getStatusLabel(status)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.date}</TableCell>
                        <TableCell className="text-right">{row.quotes}</TableCell>
                        {statusKeys.map((status) => (
                          <TableCell key={status} className="text-right">
                            {(row[status] as number) || 0}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Quotes by Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Үнийн саналын бараагаар</h3>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {productData.length > 0 ? (
                  <>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="product" angle={-25} textAnchor="end" height={90} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quotes" fill="#8884d8" name="Үнийн санал тоо" />
                          <Bar dataKey="quantity" fill="#82ca9d" name="Нийт тоо хэмжээ" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Барааны нэр</TableHead>
                            <TableHead className="text-right">Үнийн санал тоо</TableHead>
                            <TableHead className="text-right">Нийт тоо хэмжээ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productData.map((item) => (
                            <TableRow key={item.product}>
                              <TableCell className="font-medium">{item.product}</TableCell>
                              <TableCell className="text-right">{item.quotes}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Өгөгдөл олдсонгүй</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quotes by Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Үнийн саналын компаниар</h3>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {companyData.length > 0 ? (
                  <>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topCompanyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="company" angle={-25} textAnchor="end" height={90} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quotes" fill="#8884d8" name="Үнийн санал тоо" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Компани</TableHead>
                            <TableHead className="text-right">Үнийн санал тоо</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {companyData.map((item) => (
                            <TableRow key={item.company}>
                              <TableCell className="font-medium">{item.company}</TableCell>
                              <TableCell className="text-right">{item.quotes}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Өгөгдөл олдсонгүй</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {chartData.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Өгөгдөл олдсонгүй</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
