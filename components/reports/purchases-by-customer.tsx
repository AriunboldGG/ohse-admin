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
} from "recharts"
import { Download } from "lucide-react"
import { exportToExcel } from "@/lib/excel-export"

const baseMockData = [
  {
    customer: "ABC ХХК",
    products: [
      { product: "Малгай, каск", amount: 2500000 },
      { product: "Хамгаалалтын хувцас", amount: 1800000 },
      { product: "Гар хамгаалалт", amount: 1200000 },
    ],
    totalAmount: 5500000,
  },
  {
    customer: "XYZ Корпораци",
    products: [
      { product: "Нүүрний хамгаалалт", amount: 3200000 },
      { product: "Хөл хамгаалалт", amount: 2100000 },
    ],
    totalAmount: 5300000,
  },
  {
    customer: "DEF Хувьцаат",
    products: [
      { product: "Малгай, каск", amount: 4500000 },
      { product: "Амьсгал хамгаалах маск", amount: 2800000 },
      { product: "Гагнуурын баг", amount: 1500000 },
    ],
    totalAmount: 8800000,
  },
  {
    customer: "GHI Бизнес",
    products: [
      { product: "Хамгаалалтын хувцас", amount: 1900000 },
      { product: "Чихэвч, чихний бөглөө", amount: 800000 },
    ],
    totalAmount: 2700000,
  },
  {
    customer: "JKL Групп",
    products: [
      { product: "Малгай, каск", amount: 3800000 },
      { product: "Хамгаалалтын хувцас", amount: 2400000 },
      { product: "Гар хамгаалалт", amount: 1600000 },
    ],
    totalAmount: 7800000,
  },
]

const mockDataByPeriod: Record<string, typeof baseMockData> = {
  month: [
    {
      customer: "ABC ХХК",
      products: [
        { product: "Малгай, каск", amount: 850000 },
        { product: "Хамгаалалтын хувцас", amount: 600000 },
      ],
      totalAmount: 1450000,
    },
    {
      customer: "XYZ Корпораци",
      products: [
        { product: "Нүүрний хамгаалалт", amount: 1100000 },
      ],
      totalAmount: 1100000,
    },
  ],
  halfyear: baseMockData,
  year: [
    ...baseMockData,
    {
      customer: "MNO Холдинг",
      products: [
        { product: "Малгай, каск", amount: 5200000 },
        { product: "Хамгаалалтын хувцас", amount: 3800000 },
        { product: "Гар хамгаалалт", amount: 2400000 },
      ],
      totalAmount: 11400000,
    },
    {
      customer: "PQR Компани",
      products: [
        { product: "Амьсгал хамгаалах маск", amount: 4200000 },
        { product: "Гагнуурын баг", amount: 2800000 },
      ],
      totalAmount: 7000000,
    },
  ],
}

interface PurchasesByCustomerReportProps {
  period: string
}

export function PurchasesByCustomerReport({ period }: PurchasesByCustomerReportProps) {
  const data = useMemo(() => mockDataByPeriod[period] || mockDataByPeriod.month, [period])
  
  const flattenedData = useMemo(() => 
    data.flatMap((customer) =>
      customer.products.map((product) => ({
        customer: customer.customer,
        product: product.product,
        amount: product.amount,
      }))
    ), [data]
  )

  const handleExport = () => {
    exportToExcel(flattenedData, `purchases-by-customer-${period}`, "Purchases by Customer")
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Худалдан авалт хийсэн харилцагчаар</CardTitle>
              <CardDescription>
                Purchases by customer - by product name/type and price amount ({period === "month" ? "Сар" : period === "halfyear" ? "Хагас жил" : "Жил"})
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
              <BarChart data={flattenedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="customer"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" name="Дүн (₮)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flattenedData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#82ca9d" name="Дүн (₮)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Харилцагч</TableHead>
                  <TableHead>Барааны нэр/Төрөл</TableHead>
                  <TableHead className="text-right">Үнийн дүн (₮)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flattenedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.customer}</TableCell>
                    <TableCell>{row.product}</TableCell>
                    <TableCell className="text-right">
                      {row.amount.toLocaleString()}₮
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

