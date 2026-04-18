"use client"

import { useMemo } from "react"
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

// Mock data for different time periods
const mockData: Record<string, Array<{ date: string; sales: number; quotes: number; purchases: number }>> = {
  "7days": [
    { date: "Дүүрэг 1", sales: 120000, quotes: 15, purchases: 8 },
    { date: "Дүүрэг 2", sales: 150000, quotes: 20, purchases: 12 },
    { date: "Дүүрэг 3", sales: 180000, quotes: 18, purchases: 10 },
    { date: "Дүүрэг 4", sales: 140000, quotes: 22, purchases: 15 },
    { date: "Дүүрэг 5", sales: 160000, quotes: 19, purchases: 11 },
    { date: "Дүүрэг 6", sales: 170000, quotes: 21, purchases: 13 },
    { date: "Дүүрэг 7", sales: 190000, quotes: 25, purchases: 16 },
  ],
  month: [
    { date: "1-р сар", sales: 4500000, quotes: 450, purchases: 280 },
    { date: "2-р сар", sales: 5200000, quotes: 520, purchases: 320 },
    { date: "3-р сар", sales: 4800000, quotes: 480, purchases: 300 },
    { date: "4-р сар", sales: 5500000, quotes: 550, purchases: 350 },
    { date: "5-р сар", sales: 6000000, quotes: 600, purchases: 380 },
    { date: "6-р сар", sales: 5800000, quotes: 580, purchases: 360 },
  ],
  quarter: [
    { date: "1-р улирал", sales: 14500000, quotes: 1450, purchases: 900 },
    { date: "2-р улирал", sales: 17300000, quotes: 1730, purchases: 1090 },
    { date: "3-р улирал", sales: 17800000, quotes: 1780, purchases: 1140 },
    { date: "4-р улирал", sales: 19500000, quotes: 1950, purchases: 1200 },
  ],
  halfyear: [
    { date: "1-р хагас жил", sales: 31800000, quotes: 3180, purchases: 1990 },
    { date: "2-р хагас жил", sales: 37300000, quotes: 3730, purchases: 2340 },
  ],
  year: [
    { date: "2023", sales: 69100000, quotes: 6910, purchases: 4330 },
    { date: "2024", sales: 85000000, quotes: 8500, purchases: 5200 },
  ],
}

interface HistoricalTrendsReportProps {
  period: string
}

export function HistoricalTrendsReport({ period }: HistoricalTrendsReportProps) {
  // Map period from parent to internal period format
  const internalPeriod = period === "month" ? "month" : period === "halfyear" ? "halfyear" : period === "year" ? "year" : "month"
  const data = mockData[internalPeriod] || []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Хянах самбар</CardTitle>
              <CardDescription>
                View historical data trends over different time periods ({period === "month" ? "Сар" : period === "halfyear" ? "Хагас жил" : "Жил"})
              </CardDescription>
            </div>
            <Button onClick={() => {
              const exportData = data.map((item) => ({
                Огноо: item.date,
                Борлуулалт: item.sales,
                "Үнийн санал": item.quotes,
                Худалдан_авалт: item.purchases,
              }))
              exportToExcel(exportData, `historical-trends-${period}`, "Historical Trends")
            }} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Excel татах
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#8884d8"
                  name="Борлуулалт (₮)"
                />
                <Line
                  type="monotone"
                  dataKey="quotes"
                  stroke="#82ca9d"
                  name="Үнийн санал"
                />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="#ffc658"
                  name="Худалдан авалт"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" name="Борлуулалт (₮)" />
                <Bar dataKey="quotes" fill="#82ca9d" name="Үнийн санал" />
                <Bar dataKey="purchases" fill="#ffc658" name="Худалдан авалт" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо/Хугацаа</TableHead>
                  <TableHead className="text-right">Борлуулалт (₮)</TableHead>
                  <TableHead className="text-right">Үнийн санал</TableHead>
                  <TableHead className="text-right">Худалдан авалт</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell className="text-right">
                      {row.sales.toLocaleString()}₮
                    </TableCell>
                    <TableCell className="text-right">{row.quotes}</TableCell>
                    <TableCell className="text-right">{row.purchases}</TableCell>
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

