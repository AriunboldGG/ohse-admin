"use client"

import { useState, useMemo } from "react"
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

type CustomerQuoteData = Array<{ customer: string; quotes: number; totalAmount: number }>

// Mock data for different periods
const mockDataByPeriod: Record<string, CustomerQuoteData> = {
  month: [
    { customer: "ABC ХХК", quotes: 15, totalAmount: 4500000 },
    { customer: "XYZ Корпораци", quotes: 12, totalAmount: 3200000 },
    { customer: "DEF Хувьцаат", quotes: 18, totalAmount: 5200000 },
    { customer: "GHI Бизнес", quotes: 9, totalAmount: 2400000 },
    { customer: "JKL Групп", quotes: 14, totalAmount: 3900000 },
  ],
  halfyear: [
    { customer: "ABC ХХК", quotes: 45, totalAmount: 12500000 },
    { customer: "XYZ Корпораци", quotes: 38, totalAmount: 9800000 },
    { customer: "DEF Хувьцаат", quotes: 52, totalAmount: 15200000 },
    { customer: "GHI Бизнес", quotes: 28, totalAmount: 7200000 },
    { customer: "JKL Групп", quotes: 41, totalAmount: 11800000 },
    { customer: "MNO Холдинг", quotes: 35, totalAmount: 8900000 },
  ],
  year: [
    { customer: "ABC ХХК", quotes: 85, totalAmount: 24500000 },
    { customer: "XYZ Корпораци", quotes: 72, totalAmount: 18800000 },
    { customer: "DEF Хувьцаат", quotes: 98, totalAmount: 28200000 },
    { customer: "GHI Бизнес", quotes: 56, totalAmount: 14200000 },
    { customer: "JKL Групп", quotes: 78, totalAmount: 21800000 },
    { customer: "MNO Холдинг", quotes: 65, totalAmount: 16800000 },
    { customer: "PQR Компани", quotes: 88, totalAmount: 25500000 },
  ],
}

const mockData = mockDataByPeriod.month

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00c49f", "#ffbb28"]

interface PriceQuotesByCustomerReportProps {
  period: string
}

export function PriceQuotesByCustomerReport({ period }: PriceQuotesByCustomerReportProps) {
  const data = useMemo(() => mockDataByPeriod[period] || mockDataByPeriod.month, [period])

  const handleExport = () => {
    const exportData = data.map((item) => ({
      Харилцагч: item.customer,
      "Үнийн санал тоо": item.quotes,
      "Нийт дүн(₮) (₮)": item.totalAmount,
    }))
    exportToExcel(exportData, `price-quotes-by-customer-${period}`, "Price Quotes by Customer")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Үнийн санал авсан харилцагчаар</CardTitle>
              <CardDescription>
                Price quotes by customer - Table and Graph ({period === "month" ? "Сар" : period === "halfyear" ? "Хагас жил" : "Жил"})
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
                <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
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
                  label={({ customer, quotes }) => `${customer}: ${quotes}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="quotes"
                  nameKey="customer"
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
                  <TableHead>Харилцагч</TableHead>
                  <TableHead className="text-right">Үнийн санал тоо</TableHead>
                  <TableHead className="text-right">Нийт дүн(₮) (₮)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.customer}</TableCell>
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

