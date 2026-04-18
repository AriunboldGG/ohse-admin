"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download } from "lucide-react"
import { exportToExcel } from "@/lib/excel-export"

type ProductQuoteData = Array<{ product: string; quotes: number; totalAmount: number }>

const mockDataByPeriod: Record<string, ProductQuoteData> = {
  month: [
    { product: "Малгай, каск", quotes: 42, totalAmount: 6200000 },
    { product: "Нүүрний хамгаалалт, нүдний шил", quotes: 33, totalAmount: 4800000 },
    { product: "Хамгаалалтын хувцас", quotes: 52, totalAmount: 7800000 },
    { product: "Гар хамгаалалтын хувцас хэрэгсэл", quotes: 29, totalAmount: 4300000 },
  ],
  halfyear: [
    { product: "Малгай, каск", quotes: 125, totalAmount: 18500000 },
    { product: "Нүүрний хамгаалалт, нүдний шил", quotes: 98, totalAmount: 14200000 },
    { product: "Хамгаалалтын хувцас", quotes: 156, totalAmount: 23400000 },
    { product: "Гар хамгаалалтын хувцас хэрэгсэл", quotes: 87, totalAmount: 12800000 },
    { product: "Хөл хамгаалалтын хувцас хэрэгсэл", quotes: 112, totalAmount: 16800000 },
    { product: "Амьсгал хамгаалах маск, хошуувч", quotes: 134, totalAmount: 19800000 },
  ],
  year: [
    { product: "Малгай, каск", quotes: 125, totalAmount: 18500000 },
    { product: "Нүүрний хамгаалалт, нүдний шил", quotes: 98, totalAmount: 14200000 },
    { product: "Хамгаалалтын хувцас", quotes: 156, totalAmount: 23400000 },
    { product: "Гар хамгаалалтын хувцас хэрэгсэл", quotes: 87, totalAmount: 12800000 },
    { product: "Хөл хамгаалалтын хувцас хэрэгсэл", quotes: 112, totalAmount: 16800000 },
    { product: "Амьсгал хамгаалах маск, хошуувч", quotes: 134, totalAmount: 19800000 },
    { product: "Гагнуурын баг, дагалдах хэрэгсэлт", quotes: 76, totalAmount: 11200000 },
    { product: "Чихэвч, чихний бөглөө", quotes: 92, totalAmount: 13500000 },
  ],
}

const mockData = mockDataByPeriod.month

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00c49f", "#ffbb28", "#8884d8"]

interface PriceQuotesByProductReportProps {
  period: string
}

export function PriceQuotesByProductReport({ period }: PriceQuotesByProductReportProps) {
  const data = useMemo(() => mockDataByPeriod[period] || mockDataByPeriod.month, [period])

  const handleExport = () => {
    const exportData = data.map((item) => ({
      "Барааны нэр/Төрөл": item.product,
      "Үнийн санал тоо": item.quotes,
      "Нийт дүн(₮) (₮)": item.totalAmount,
    }))
    exportToExcel(exportData, `price-quotes-by-product-${period}`, "Price Quotes by Product")
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Үнийн санал авсан барааны нэр төрлөөр</CardTitle>
              <CardDescription>
                Price quotes by product name/type - Table and Graph ({period === "month" ? "Сар" : period === "halfyear" ? "Хагас жил" : "Жил"})
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Excel татах
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="product"
                  angle={-45}
                  textAnchor="end"
                  height={150}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quotes" fill="#8884d8" name="Үнийн санал тоо" />
                <Bar dataKey="totalAmount" fill="#82ca9d" name="Нийт дүн(₮) (₮)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ product, quotes }) => `${product.substring(0, 15)}: ${quotes}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="quotes"
                  nameKey="product"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Барааны нэр/Төрөл</TableHead>
                  <TableHead className="text-right">Үнийн санал тоо</TableHead>
                  <TableHead className="text-right">Нийт дүн(₮) (₮)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.product}</TableCell>
                    <TableCell className="text-right">{row.quotes}</TableCell>
                    <TableCell className="text-right">
                      {row.totalAmount.toLocaleString()}₮
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

