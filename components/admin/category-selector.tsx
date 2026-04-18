"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Shield, Wrench, Settings } from "lucide-react"

interface CategorySelectorProps {
  value?: string
  onValueChange: (value: string) => void
}

const iconMap: Record<string, React.ReactNode> = {
  shield: <Shield className="h-5 w-5" />,
  gear: <Settings className="h-5 w-5" />,
  wrench: <Wrench className="h-5 w-5" />,
}

export function CategorySelector({ value, onValueChange }: CategorySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedMainCategory, setSelectedMainCategory] = React.useState<string | null>(null)
  const [categories, setCategories] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories/main")
        const result = await response.json()
        if (result.success) {
          const built = (result.data || []).map((main: any) => {
            const children = Array.isArray(main.children) ? main.children : []
            const subchildren = main.subchildren || {}
            return {
              ...main,
              children: children.map((childName: string) => ({
                id: `${main.id}::${childName}`,
                name: childName,
                children: (Array.isArray(subchildren?.[childName]) ? subchildren[childName] : []).map((subName: string) => ({
                  id: `${main.id}::${childName}::${subName}`,
                  name: subName,
                })),
              })),
            }
          })
          setCategories(built)
        }
      } catch (error) {
        console.error("Failed to load categories:", error)
      }
    }
    fetchCategories()
  }, [])

  const getCategoryPath = (categoryId: string): string => {
    if (!categoryId) return ""
    for (const mainCat of categories) {
      if (mainCat.id === categoryId) return mainCat.name
      if (mainCat.children) {
        for (const subCat of mainCat.children) {
          if (subCat.id === categoryId) return `${mainCat.name} > ${subCat.name}`
          if (subCat.children) {
            for (const subSubCat of subCat.children) {
              if (subSubCat.id === categoryId) {
                return `${mainCat.name} > ${subCat.name} > ${subSubCat.name}`
              }
            }
          }
        }
      }
    }
    return categoryId
  }

  const selectedCategoryPath = value ? getCategoryPath(value) : ""

  // Find which main category the selected value belongs to
  React.useEffect(() => {
    if (value) {
      for (const mainCat of categories) {
        if (mainCat.id === value) {
          setSelectedMainCategory(mainCat.id)
          break
        }
        if (mainCat.children) {
          for (const subCat of mainCat.children) {
            if (subCat.id === value) {
              setSelectedMainCategory(mainCat.id)
              break
            }
            if (subCat.children) {
              for (const subSubCat of subCat.children) {
                if (subSubCat.id === value) {
                  setSelectedMainCategory(mainCat.id)
                  break
                }
              }
            }
          }
        }
      }
    }
  }, [value])

  const handleMainCategoryClick = (categoryId: string) => {
    setSelectedMainCategory(categoryId)
    // If clicking the same category, select it
    if (value === categoryId) {
      onValueChange(categoryId)
      setOpen(false)
    }
  }

  const handleSubCategoryClick = (categoryId: string) => {
    onValueChange(categoryId)
    setOpen(false)
  }

  const handleSubSubCategoryClick = (categoryId: string) => {
    onValueChange(categoryId)
    setOpen(false)
  }

  const selectedMainCategoryData = categories.find(cat => cat.id === selectedMainCategory)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCategoryPath || "Select category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="flex h-[400px]">
          {/* Left Column - Main Categories */}
          <div className="w-1/2 border-r bg-muted/30 overflow-y-auto">
            <div className="p-2 space-y-1">
              {categories.map((mainCategory) => {
                const isSelected = value === mainCategory.id
                const isActive = selectedMainCategory === mainCategory.id
                return (
                  <div
                    key={mainCategory.id}
                    onClick={() => handleMainCategoryClick(mainCategory.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : isSelected
                        ? "bg-accent"
                        : "hover:bg-accent"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 rounded",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {iconMap[mainCategory.icon || ""] || <Shield className="h-5 w-5" />}
                    </div>
                    <span className="text-sm font-medium flex-1">{mainCategory.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column - Subcategories */}
          <div className="w-1/2 overflow-y-auto">
            {selectedMainCategoryData ? (
              <div className="p-2 space-y-1">
                {/* Show main category as selectable if it has children */}
                {selectedMainCategoryData.children && selectedMainCategoryData.children.length > 0 && (
                  <div
                    onClick={() => handleMainCategoryClick(selectedMainCategoryData.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      value === selectedMainCategoryData.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    )}
                  >
                    <span className="text-sm font-medium">{selectedMainCategoryData.name}</span>
                    {value === selectedMainCategoryData.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                )}

                {/* Show subcategories */}
                {selectedMainCategoryData.children?.map((subCategory: any) => {
                  const isSelected = value === subCategory.id
                  const hasChildren = subCategory.children && subCategory.children.length > 0
                  
                  return (
                    <div key={subCategory.id} className="space-y-1">
                      <div
                        onClick={() => hasChildren ? null : handleSubCategoryClick(subCategory.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                          hasChildren ? "cursor-default" : "cursor-pointer hover:bg-accent",
                          isSelected && !hasChildren && "bg-primary/10 text-primary"
                        )}
                      >
                        <span className="text-sm text-muted-foreground">{subCategory.name}</span>
                        {isSelected && !hasChildren && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </div>

                      {/* Show sub-subcategories */}
                      {subCategory.children?.map((subSubCategory: any) => {
                        const isSubSelected = value === subSubCategory.id
                        return (
                          <div
                            key={subSubCategory.id}
                            onClick={() => handleSubSubCategoryClick(subSubCategory.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 ml-4 rounded-lg cursor-pointer transition-colors",
                              isSubSelected
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-accent"
                            )}
                          >
                            <span className="text-sm text-muted-foreground">{subSubCategory.name}</span>
                            {isSubSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a category from the left
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
