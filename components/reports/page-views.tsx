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
import { Download } from "lucide-react"
import { exportMultipleSheets } from "@/lib/excel-export"

type PageViewData = Array<{ date: string; views: number; unique: number }>

const mockDataByPeriod: Record<string, PageViewData> = {
  month: [
    { date: "Дүүрэг 1", views: 1250, unique: 890 },
    { date: "Дүүрэг 2", views: 1420, unique: 1020 },
    { date: "Дүүрэг 3", views: 1380, unique: 980 },
    { date: "Дүүрэг 4", views: 1520, unique: 1100 },
  ],
  halfyear: [
    { date: "Дүүрэг 1", views: 1250, unique: 890 },
    { date: "Дүүрэг 2", views: 1420, unique: 1020 },
    { date: "Дүүрэг 3", views: 1380, unique: 980 },
    { date: "Дүүрэг 4", views: 1520, unique: 1100 },
    { date: "Дүүрэг 5", views: 1680, unique: 1200 },
    { date: "Дүүрэг 6", views: 1450, unique: 1050 },
    { date: "Дүүрэг 7", views: 1750, unique: 1280 },
  ],
  year: [
  { date: "Дүүрэг 1", views: 1250, unique: 890 },
  { date: "Дүүрэг 2", views: 1420, unique: 1020 },
  { date: "Дүүрэг 3", views: 1380, unique: 980 },
  { date: "Дүүрэг 4", views: 1520, unique: 1100 },
  { date: "Дүүрэг 5", views: 1680, unique: 1200 },
  { date: "Дүүрэг 6", views: 1450, unique: 1050 },
  { date: "Дүүрэг 7", views: 1750, unique: 1280 },
  { date: "Дүүрэг 8", views: 1620, unique: 1150 },
  { date: "Дүүрэг 9", views: 1890, unique: 1350 },
  { date: "Дүүрэг 10", views: 1950, unique: 1420 },
  { date: "Дүүрэг 11", views: 1820, unique: 1300 },
  { date: "Дүүрэг 12", views: 2100, unique: 1500 },
  { date: "Дүүрэг 13", views: 1980, unique: 1420 },
    { date: "Дүүрэг 14", views: 2250, unique: 1620 },
  ],
}

const mockData = mockDataByPeriod.month

const pageData = [
  { page: "Нүүр хуудас", views: 15200, unique: 10800 },
  { page: "Бүтээгдэхүүн", views: 12400, unique: 8900 },
  { page: "Бүтээгдэхүүн дэлгэрэнгүй", views: 9800, unique: 7200 },
  { page: "Холбоо барих", views: 3200, unique: 2400 },
  { page: "Бидний тухай", views: 2100, unique: 1600 },
  { page: "Үнийн санал", views: 5600, unique: 4200 },
]

interface PageViewsReportProps {
  period: string
}

export function PageViewsReport({ period }: PageViewsReportProps) {
  const data = useMemo(() => mockDataByPeriod[period] || mockDataByPeriod.month, [period])

  const handleExport = () => {
    const viewsData = data.map((item) => ({
      Огноо: item.date,
      "Нийт хандалт": item.views,
      "Өвөрмөц хандалт": item.unique,
    }))
    
    const pagesData = pageData.map((item) => ({
      Хуудас: item.page,
      "Нийт хандалт": item.views,
      "Өвөрмөц хандалт": item.unique,
    }))

    exportMultipleSheets(
      [
        { name: "Хандалтын түүх", data: viewsData },
        { name: "Хуудас бүрээр", data: pagesData },
      ],
      `page-views-${period}`
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Хандалтын тоо</CardTitle>
              <CardDescription>
                Page views and access count - Table and Graph ({period === "month" ? "Сар" : period === "halfyear" ? "Хагас жил" : "Жил"})
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Excel татах
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Хандалтын түүх (14 хоног)</h3>
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
                    dataKey="views"
                    stroke="#8884d8"
                    name="Нийт хандалт"
                  />
                  <Line
                    type="monotone"
                    dataKey="unique"
                    stroke="#82ca9d"
                    name="Өвөрмөц хандалт"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Хуудас бүрээр</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#8884d8" name="Нийт хандалт" />
                  <Bar dataKey="unique" fill="#82ca9d" name="Өвөрмөц хандалт" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Хандалтын түүх (Хүснэгт)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead className="text-right">Нийт хандалт</TableHead>
                  <TableHead className="text-right">Өвөрмөц хандалт</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell className="text-right">
                      {row.views.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.unique.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Хуудас бүрээр (Хүснэгт)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Хуудас</TableHead>
                  <TableHead className="text-right">Нийт хандалт</TableHead>
                  <TableHead className="text-right">Өвөрмөц хандалт</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.page}</TableCell>
                    <TableCell className="text-right">
                      {row.views.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.unique.toLocaleString()}
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

