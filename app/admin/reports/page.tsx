"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { QuotesAnalysisReport } from "@/components/reports/quotes-analysis"

const timePeriods = [
  { value: "month", label: "Сар (Month)" },
  { value: "halfyear", label: "Хагас жил (Half Year)" },
  { value: "year", label: "Жил (Year)" },
]

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Тайлан хянах удирдах цэс 
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Label htmlFor="period" className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Хугацаа:
          </Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger id="period" className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {timePeriods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <QuotesAnalysisReport period={selectedPeriod} />
    </div>
  )
}

