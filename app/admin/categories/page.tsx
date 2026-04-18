"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Upload, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MainCategory {
  id: string
  name: string
  nameEn: string
  icon?: string
  createdAt?: string
  updatedAt?: string
}

interface Category {
  id: string
  name: string
  nameEn: string
  mainCategoryId: string
  icon?: string
  createdAt?: string
  updatedAt?: string
}

interface Subcategory {
  id: string
  name: string
  nameEn: string
  categoryId: string
  mainCategoryId: string
  icon?: string
  createdAt?: string
  updatedAt?: string
}

interface ProductSector {
  id: string
  name: string
  order?: number
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

const buildCategoryId = (mainCategoryId: string, name: string) => `${mainCategoryId}::${name}`
const parseCategoryName = (categoryId: string) => categoryId.split("::").slice(1).join("::") || categoryId

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState("main")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [categoryFilterMainCategory, setCategoryFilterMainCategory] = useState<string>("all")
  const [subcategoryFilterMainCategory, setSubcategoryFilterMainCategory] = useState<string>("all")
  const [subcategoryFilterCategory, setSubcategoryFilterCategory] = useState<string>("all")

  // Main Categories
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([])
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false)
  const [editingMainCategory, setEditingMainCategory] = useState<MainCategory | null>(null)
  const [mainFormData, setMainFormData] = useState({ name: "" })

  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({ name: "", mainCategoryId: "" })

  // Subcategories
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [subcategoryFormData, setSubcategoryFormData] = useState({ name: "", categoryId: "", mainCategoryId: "" })

  // Product Sectors
  const [productSectors, setProductSectors] = useState<ProductSector[]>([])
  const [isSectorDialogOpen, setIsSectorDialogOpen] = useState(false)
  const [editingSector, setEditingSector] = useState<ProductSector | null>(null)
  const [sectorFormData, setSectorFormData] = useState({ name: "" })
  const [sectorImageFile, setSectorImageFile] = useState<File | null>(null)
  const [sectorImagePreview, setSectorImagePreview] = useState("")

  // Fetch all data
  const fetchMainCategories = async () => {
    try {
      const response = await fetch("/api/categories/main")
      const result = await response.json()
      if (result.success) {
        setMainCategories(result.data)
      } else {
        setError(result.error || "Failed to fetch main categories")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch main categories")
    }
  }

  const buildDerivedCategories = (mainList: MainCategory[]) => {
    const derivedCategories: Category[] = []
    const derivedSubcategories: Subcategory[] = []
    mainList.forEach((main) => {
      const children = Array.isArray((main as any).children) ? (main as any).children : []
      children.forEach((childName: string) => {
        const categoryId = buildCategoryId(main.id, childName)
        derivedCategories.push({
          id: categoryId,
          name: childName,
          nameEn: "",
          mainCategoryId: main.id,
        })
        const subchildrenMap = (main as any).subchildren || {}
        const subchildren = Array.isArray(subchildrenMap?.[childName]) ? subchildrenMap[childName] : []
        subchildren.forEach((subName: string) => {
          derivedSubcategories.push({
            id: buildCategoryId(main.id, `${childName}::${subName}`),
            name: subName,
            nameEn: "",
            categoryId,
            mainCategoryId: main.id,
          })
        })
      })
    })
    setCategories(derivedCategories)
    setSubcategories(derivedSubcategories)
  }

  const fetchProductSectors = async () => {
    try {
      const response = await fetch("/api/product-sectors")
      const result = await response.json()
      if (result.success) {
        setProductSectors(result.data)
      } else {
        setError(result.error || "Failed to fetch product sectors")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch product sectors")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      await Promise.all([
        fetchMainCategories(),
        fetchProductSectors(),
      ])
      setIsLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    buildDerivedCategories(mainCategories)
  }, [mainCategories])

  const filteredSubcategories = subcategories.filter((subcategory) => {
    const matchesMain =
      subcategoryFilterMainCategory === "all" ||
      subcategory.mainCategoryId === subcategoryFilterMainCategory
    const matchesCategory =
      subcategoryFilterCategory === "all" ||
      subcategory.categoryId === subcategoryFilterCategory
    return matchesMain && matchesCategory
  })

  // Refresh product sectors when tab opens
  useEffect(() => {
    if (activeTab === "sectors") {
      fetchProductSectors()
    }
  }, [activeTab])

  // Main Category Handlers
  const handleOpenMainDialog = (category?: MainCategory) => {
    if (category) {
      setEditingMainCategory(category)
      setMainFormData({ name: category.name })
    } else {
      setEditingMainCategory(null)
      setMainFormData({ name: "" })
    }
    setIsMainDialogOpen(true)
  }

  const handleCloseMainDialog = () => {
    setIsMainDialogOpen(false)
    setEditingMainCategory(null)
    setMainFormData({ name: "" })
  }

  const handleSubmitMainCategory = async () => {
    try {
      if (!mainFormData.name.trim()) {
        alert("Name is required")
        return
      }

      const url = editingMainCategory
        ? `/api/categories/main/${editingMainCategory.id}`
        : "/api/categories/main"
      const method = editingMainCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mainFormData),
      })

      const result = await response.json()
      if (result.success) {
        await fetchMainCategories()
        handleCloseMainDialog()
      } else {
        alert(result.error || "Failed to save main category")
      }
    } catch (err: any) {
      alert(err.message || "Failed to save main category")
    }
  }

  const handleDeleteMainCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this main category?")) return

    try {
      const response = await fetch(`/api/categories/main/${id}`, { method: "DELETE" })
      const result = await response.json()
      if (result.success) {
        await fetchMainCategories()
      } else {
        alert(result.error || "Failed to delete main category")
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete main category")
    }
  }

  // Category Handlers
  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryFormData({ 
        name: category.name, 
        mainCategoryId: category.mainCategoryId || ""
      })
    } else {
      setEditingCategory(null)
      setCategoryFormData({ name: "", mainCategoryId: "" })
    }
    setIsCategoryDialogOpen(true)
  }

  const handleCloseCategoryDialog = () => {
    setIsCategoryDialogOpen(false)
    setEditingCategory(null)
    setCategoryFormData({ name: "", mainCategoryId: "" })
  }

  const handleSubmitCategory = async () => {
    try {
      if (!categoryFormData.name.trim()) {
        alert("Name is required")
        return
      }

      const mainCategoryId = categoryFormData.mainCategoryId
      if (!mainCategoryId) {
        alert("Main category is required")
        return
      }

      if (editingCategory) {
        const oldName = editingCategory.name
        const newName = categoryFormData.name.trim()
        const oldMainCategoryId = editingCategory.mainCategoryId || ""
        if (oldMainCategoryId && oldMainCategoryId !== mainCategoryId) {
          await fetch(`/api/categories/main/${oldMainCategoryId}/children`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: oldName }),
          })
          await fetch(`/api/categories/main/${mainCategoryId}/children`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
          })
        } else if (oldName !== newName) {
          await fetch(`/api/categories/main/${mainCategoryId}/children`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldName, newName }),
          })
        }
      } else {
        await fetch(`/api/categories/main/${mainCategoryId}/children`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryFormData.name.trim() }),
        })
      }

      await fetchMainCategories()
      handleCloseCategoryDialog()
    } catch (err: any) {
      alert(err.message || "Failed to save category")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const category = categories.find(cat => cat.id === id)
      if (!category?.mainCategoryId) {
        alert("Missing main category")
        return
      }
      const response = await fetch(`/api/categories/main/${category.mainCategoryId}/children`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: category.name }),
      })
      const result = await response.json()
      if (!result.success) {
        alert(result.error || "Failed to delete category")
        return
      }
      await fetchMainCategories()
    } catch (err: any) {
      alert(err.message || "Failed to delete category")
    }
  }

  // Subcategory Handlers
  const handleOpenSubcategoryDialog = (subcategory?: Subcategory) => {
    if (subcategory) {
      setEditingSubcategory(subcategory)
      setSubcategoryFormData({ 
        name: subcategory.name, 
        categoryId: subcategory.categoryId || "",
        mainCategoryId: subcategory.mainCategoryId || ""
      })
    } else {
      setEditingSubcategory(null)
      setSubcategoryFormData({ name: "", categoryId: "", mainCategoryId: "" })
    }
    setIsSubcategoryDialogOpen(true)
  }

  const handleCloseSubcategoryDialog = () => {
    setIsSubcategoryDialogOpen(false)
    setEditingSubcategory(null)
    setSubcategoryFormData({ name: "", categoryId: "", mainCategoryId: "" })
  }

  const handleSubmitSubcategory = async () => {
    try {
      if (!subcategoryFormData.name.trim()) {
        alert("Name is required")
        return
      }

      const mainCategoryId = subcategoryFormData.mainCategoryId
      if (!mainCategoryId || !subcategoryFormData.categoryId) {
        alert("Main category and category are required")
        return
      }

      const categoryName = parseCategoryName(subcategoryFormData.categoryId)
      const subcategoryName = subcategoryFormData.name.trim()

      if (editingSubcategory) {
        const oldCategoryName = parseCategoryName(editingSubcategory.categoryId || "")
        const oldName = editingSubcategory.name
        const oldMainCategoryId = editingSubcategory.mainCategoryId || ""

        if (oldMainCategoryId && oldMainCategoryId !== mainCategoryId) {
          await fetch(`/api/categories/main/${oldMainCategoryId}/subchildren`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryName: oldCategoryName, subcategoryName: oldName }),
          })
          await fetch(`/api/categories/main/${mainCategoryId}/subchildren`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryName, subcategoryName }),
          })
        } else {
          await fetch(`/api/categories/main/${mainCategoryId}/subchildren`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              oldCategoryName,
              newCategoryName: categoryName,
              oldName,
              newName: subcategoryName,
            }),
          })
        }
      } else {
        await fetch(`/api/categories/main/${mainCategoryId}/subchildren`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryName, subcategoryName }),
        })
      }

      await fetchMainCategories()
      handleCloseSubcategoryDialog()
    } catch (err: any) {
      alert(err.message || "Failed to save subcategory")
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return

    try {
      const subcategory = subcategories.find(sub => sub.id === id)
      if (!subcategory?.mainCategoryId || !subcategory.categoryId) {
        alert("Missing main category or category")
        return
      }
      const categoryName = parseCategoryName(subcategory.categoryId)
      const response = await fetch(`/api/categories/main/${subcategory.mainCategoryId}/subchildren`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName, subcategoryName: subcategory.name }),
      })
      const result = await response.json()
      if (!result.success) {
        alert(result.error || "Failed to delete subcategory")
        return
      }
      await fetchMainCategories()
    } catch (err: any) {
      alert(err.message || "Failed to delete subcategory")
    }
  }

  // Product Sector Handlers
  const handleOpenSectorDialog = (sector?: ProductSector) => {
    if (sector) {
      setEditingSector(sector)
      setSectorFormData({ name: sector.name })
      setSectorImagePreview(sector.imageUrl || "")
      setSectorImageFile(null)
    } else {
      setEditingSector(null)
      setSectorFormData({ name: "" })
      setSectorImagePreview("")
      setSectorImageFile(null)
    }
    setIsSectorDialogOpen(true)
  }

  const handleCloseSectorDialog = () => {
    setIsSectorDialogOpen(false)
    setEditingSector(null)
    setSectorFormData({ name: "" })
    if (sectorImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(sectorImagePreview)
    }
    setSectorImagePreview("")
    setSectorImageFile(null)
  }

  const handleSubmitSector = async () => {
    try {
      if (!sectorFormData.name.trim()) {
        alert("Name is required")
        return
      }

      const url = editingSector
        ? `/api/product-sectors/${editingSector.id}`
        : "/api/product-sectors"
      const method = editingSector ? "PUT" : "POST"

      const formData = new FormData()
      formData.append("name", sectorFormData.name.trim())
      if (sectorImageFile) {
        formData.append("image", sectorImageFile)
      } else if (editingSector?.imageUrl) {
        formData.append("image_url", editingSector.imageUrl)
      }

      const response = await fetch(url, {
        method,
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        await fetchProductSectors()
        handleCloseSectorDialog()
      } else {
        alert(result.error || "Failed to save product sector")
      }
    } catch (err: any) {
      alert(err.message || "Failed to save product sector")
    }
  }

  const handleDeleteSector = async (id: string) => {
    try {
      if (!confirm("Are you sure you want to delete this product sector?")) return
      const response = await fetch(`/api/product-sectors/${id}`, { method: "DELETE" })
      const result = await response.json()
      if (result.success) {
        await fetchProductSectors()
      } else {
        alert(result.error || "Failed to delete product sector")
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete product sector")
    }
  }

  const handleSectorImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (sectorImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(sectorImagePreview)
    }
    const preview = URL.createObjectURL(file)
    setSectorImagePreview(preview)
    setSectorImageFile(file)
    e.target.value = ""
  }

  const handleRemoveSectorImage = () => {
    if (sectorImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(sectorImagePreview)
    }
    setSectorImagePreview("")
    setSectorImageFile(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading categories...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  const handleMigrateCategories = async () => {
    if (!confirm("This will migrate categories into main_categories. Continue?")) return;

    try {
      const response = await fetch("/api/categories/migrate-to-main", {
        method: "POST",
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Migration successful! Migrated ${result.mainCategoriesCount} main categories.`);
        // Refresh main categories only
        await fetchMainCategories();
      } else {
        alert(result.error || "Failed to migrate categories");
      }
    } catch (err: any) {
      alert(err.message || "Failed to migrate categories");
    }
  }

  const handleAddFirstMainCategory = async () => {
    if (!confirm("This will add the first main category 'Хувь хүнийг хамгаалах хувцас хэрэгсэл' with all its categories and subcategories. Continue?")) return;

    try {
      // First, add the main category
      const mainCategoryData = {
        name: "Хувь хүнийг хамгаалах хувцас хэрэгсэл",
      };

      let mainCategoryResponse = await fetch("/api/categories/main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mainCategoryData),
      });

      let mainCategoryResult = await mainCategoryResponse.json();
      let mainCategoryId: string;

      if (mainCategoryResult.success) {
        mainCategoryId = mainCategoryResult.data.id;
      } else {
        // Try to find existing
        const existingResponse = await fetch("/api/categories/main");
        const existingResult = await existingResponse.json();
        const existing = existingResult.data?.find((cat: any) => cat.name === mainCategoryData.name);
        if (existing) {
          mainCategoryId = existing.id;
        } else {
          throw new Error("Failed to create main category");
        }
      }

      // Add categories and subcategories (matching the image exactly)
      const categoriesData = [
        {
          name: "Толгой хамгаалалт",
          mainCategoryId: mainCategoryId,
          subcategories: [
            "Малгай, каск",
            "Нүүрний хамгаалалт, нүдний шил",
            "Гагнуурын баг, дагалдах хэрэгсэлт",
            "Чихэвч, чихний бөглөө",
            "Амьсгал хамгаалах маск, хошуувч",
            "Баг шүүлтүүр",
          ],
        },
        {
          name: "Хамгаалалтын хувцас",
          mainCategoryId: mainCategoryId,
          subcategories: [
            "Зуны хувцас",
            "Өвлийн хувцас",
            "Цахилгаан, нуман ниргэлтээс хамгаалах хувцас хэрэглэл",
            "Гагнуурын хувцас хэрэгсэл",
          ],
        },
        {
          name: "Гар хамгаалах",
          mainCategoryId: mainCategoryId,
          subcategories: [
            "Ажлын бээлий",
            "Цахилгааны бээлий",
            "Гагнуурын бээлий",
            "Халуунаас хамгаалах бээлий",
            "Хими, шүлт, цагцраас хамгаалах бээлий",
          ],
        },
        {
          name: "Хөл хамгаалалт",
          mainCategoryId: mainCategoryId,
          subcategories: [
            "Ажлын гутал",
            "Гагнуурын гутал",
            "Хүчил шүлт, цацрагаас хамгаах",
            "Усны гутал",
            "Цахилгаанаас хамгаалах",
          ],
        },
      ];

      for (const categoryData of categoriesData) {
        // Add category
        let categoryResponse = await fetch("/api/categories/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryData.name,
            mainCategoryId: categoryData.mainCategoryId,
          }),
        });

        let categoryResult = await categoryResponse.json();
        let categoryId: string;

        if (categoryResult.success) {
          categoryId = categoryResult.data.id;
        } else {
          // Try to find existing
          const existingResponse = await fetch(`/api/categories/categories?mainCategoryId=${mainCategoryId}`);
          const existingResult = await existingResponse.json();
          const existing = existingResult.data?.find((cat: any) => cat.name === categoryData.name);
          if (existing) {
            categoryId = existing.id;
          } else {
            console.error(`Failed to create category: ${categoryData.name}`);
            continue;
          }
        }

        // Add subcategories
        for (const subcategoryName of categoryData.subcategories) {
          await fetch("/api/categories/subcategories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: subcategoryName,
              categoryId: categoryId,
              mainCategoryId: mainCategoryId,
            }),
          });
        }
      }

      alert("First main category and all its categories/subcategories added successfully!");
      // Refresh main categories only
      await fetchMainCategories();
    } catch (err: any) {
      alert(err.message || "Failed to add first main category");
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="main">Main Categories</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="sectors">Product Sectors</TabsTrigger>
        </TabsList>

        {/* Main Categories Tab */}
        <TabsContent value="main" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Main Categories</CardTitle>
                  <CardDescription>Manage main categories (top level)</CardDescription>
                </div>
                <Button onClick={() => handleOpenMainDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Main Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No main categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    mainCategories.map((category, index) => (
                      <TableRow key={category.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMainDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMainCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Manage categories (second level)</CardDescription>
                </div>
                <Button onClick={() => handleOpenCategoryDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label className="mb-2 block">Filter by Main Category</Label>
                <Select 
                  value={categoryFilterMainCategory} 
                  onValueChange={(value) => {
                    setCategoryFilterMainCategory(value)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="All Main Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Main Categories</SelectItem>
                    {mainCategories.map((mainCat) => (
                      <SelectItem key={mainCat.id} value={mainCat.id}>
                        {mainCat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Main Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category, index) => {
                      const mainCat = mainCategories.find(mc => mc.id === category.mainCategoryId)
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{mainCat?.name || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCategoryDialog(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subcategories Tab */}
        <TabsContent value="subcategories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subcategories</CardTitle>
                  <CardDescription>Manage subcategories (third level)</CardDescription>
                </div>
                <Button onClick={() => handleOpenSubcategoryDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div>
                  <Label className="mb-2 block">Filter by Main Category</Label>
                  <Select 
                    value={subcategoryFilterMainCategory} 
                    onValueChange={(value) => {
                      setSubcategoryFilterMainCategory(value)
                      setSubcategoryFilterCategory("all") // Reset category filter
                    // Categories are derived from main_categories now
                    // Subcategories are derived from main_categories now
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue placeholder="All Main Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Main Categories</SelectItem>
                      {mainCategories.map((mainCat) => (
                        <SelectItem key={mainCat.id} value={mainCat.id}>
                          {mainCat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Filter by Category</Label>
                  <Select 
                    value={subcategoryFilterCategory} 
                    onValueChange={(value) => {
                      setSubcategoryFilterCategory(value)
                      // Immediately fetch with new filter
                      // Subcategories are derived from main_categories now
                    }}
                    disabled={subcategoryFilterMainCategory === "all"}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue placeholder={subcategoryFilterMainCategory === "all" ? "Select main category first" : "All Categories"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories
                        .filter(cat => subcategoryFilterMainCategory === "all" || cat.mainCategoryId === subcategoryFilterMainCategory)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Main Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubcategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No subcategories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubcategories.map((subcategory, index) => {
                      const cat = categories.find(c => c.id === subcategory.categoryId)
                      const mainCat = mainCategories.find(mc => mc.id === subcategory.mainCategoryId)
                      return (
                        <TableRow key={subcategory.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="font-medium">{subcategory.name}</TableCell>
                          <TableCell>{cat?.name || "-"}</TableCell>
                          <TableCell>{mainCat?.name || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenSubcategoryDialog(subcategory)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSubcategory(subcategory.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Sectors Tab */}
        <TabsContent value="sectors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Sectors</CardTitle>
                  <CardDescription>Manage product sectors</CardDescription>
                </div>
                <Button onClick={() => handleOpenSectorDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Sector
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSectors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No product sectors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    productSectors.map((sector, index) => (
                      <TableRow key={sector.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{sector.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSectorDialog(sector)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSector(sector.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Main Category Dialog */}
      <Dialog open={isMainDialogOpen} onOpenChange={setIsMainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMainCategory ? "Edit Main Category" : "Add Main Category"}
            </DialogTitle>
            <DialogDescription>
              {editingMainCategory ? "Update main category details" : "Create a new main category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={mainFormData.name}
                onChange={(e) => setMainFormData({ ...mainFormData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseMainDialog}>
              Хаах
            </Button>
            <Button onClick={handleSubmitMainCategory}>
              {editingMainCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update category details" : "Create a new category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label>Main Category *</Label>
              <Select
                value={categoryFormData.mainCategoryId}
                onValueChange={(value) => setCategoryFormData({ ...categoryFormData, mainCategoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select main category" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((mainCat) => (
                    <SelectItem key={mainCat.id} value={mainCat.id}>
                      {mainCat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCategoryDialog}>
              Хаах
            </Button>
            <Button onClick={handleSubmitCategory}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Sector Dialog */}
      <Dialog open={isSectorDialogOpen} onOpenChange={setIsSectorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSector ? "Edit Product Sector" : "Add Product Sector"}
            </DialogTitle>
            <DialogDescription>
              {editingSector ? "Update product sector details" : "Create a new product sector"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={sectorFormData.name}
                onChange={(e) => setSectorFormData({ ...sectorFormData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Sector Image</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    id="sector-image-upload"
                    accept="image/*"
                    onChange={handleSectorImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="sector-image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-primary/50 bg-muted/30 hover:bg-muted/50"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {sectorImagePreview
                        ? "Зураг сонгогдсон"
                        : "Зураг сонгох (Click to select image)"}
                    </p>
                  </label>
                </div>
                {sectorImagePreview && (
                  <div className="relative mt-4 flex justify-center">
                    <div className="relative group">
                      <img
                        src={sectorImagePreview}
                        alt="Sector preview"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveSectorImage}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSectorDialog}>
              Хаах
            </Button>
            <Button onClick={handleSubmitSector}>
              {editingSector ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
            <DialogDescription>
              {editingSubcategory ? "Update subcategory details" : "Create a new subcategory"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={subcategoryFormData.name}
                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label>Main Category *</Label>
              <Select
                value={subcategoryFormData.mainCategoryId}
                onValueChange={(value) => {
                  setSubcategoryFormData({ ...subcategoryFormData, mainCategoryId: value, categoryId: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select main category" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((mainCat) => (
                    <SelectItem key={mainCat.id} value={mainCat.id}>
                      {mainCat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={subcategoryFormData.categoryId}
                onValueChange={(value) => setSubcategoryFormData({ ...subcategoryFormData, categoryId: value })}
                disabled={!subcategoryFormData.mainCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={subcategoryFormData.mainCategoryId ? "Select category" : "Select main category first"} />
                </SelectTrigger>
                <SelectContent>
                  {subcategoryFormData.mainCategoryId ? (
                    categories
                      .filter(cat => cat.mainCategoryId === subcategoryFormData.mainCategoryId)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="placeholder" disabled>Select main category first</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSubcategoryDialog}>
              Хаах
            </Button>
            <Button onClick={handleSubmitSubcategory}>
              {editingSubcategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
