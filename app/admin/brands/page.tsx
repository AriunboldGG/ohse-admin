"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Upload, XCircle } from "lucide-react"

type Brand = {
  id: string
  name: string
  image: string
  createdAt?: string
  updatedAt?: string
}

const emptyForm = { name: "", image: "" }

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const fetchBrands = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/brands")
      const result = await res.json()
      if (result.success) {
        setBrands(result.data)
      }
    } catch (err) {
      console.error("Error fetching brands:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({ name: brand.name, image: brand.image || "" })
      setImagePreview(brand.image || "")
    } else {
      setEditingBrand(null)
      setFormData(emptyForm)
      setImagePreview("")
    }
    setImageFile(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview)
    }
    setIsDialogOpen(false)
    setEditingBrand(null)
    setFormData(emptyForm)
    setImageFile(null)
    setImagePreview("")
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith("image/")) {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview)
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
    e.target.value = ""
  }

  const handleRemoveImage = () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview("")
    setFormData((prev) => ({ ...prev, image: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert("Брэндийн нэр оруулна уу (Please enter brand name)")
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name", formData.name.trim())
      if (imageFile) {
        fd.append("image", imageFile)
      } else {
        fd.append("image_url", formData.image)
      }

      const url = editingBrand ? `/api/brands/${editingBrand.id}` : "/api/brands"
      const method = editingBrand ? "PUT" : "POST"

      const res = await fetch(url, { method, body: fd })
      const result = await res.json()

      if (result.success) {
        await fetchBrands()
        handleCloseDialog()
      } else {
        alert(result.error || "Failed to save brand")
      }
    } catch (err) {
      console.error("Error saving brand:", err)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ брэндийг устгах уу? (Delete this brand?)")) return
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (result.success) {
        await fetchBrands()
      } else {
        alert(result.error || "Failed to delete brand")
      }
    } catch (err) {
      console.error("Error deleting brand:", err)
      alert("An error occurred. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">Брэнд удирдах цэс</p>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              Нийт: <span className="font-semibold text-foreground">{brands.length}</span> брэнд
            </p>
          )}
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Брэнд нэмэх
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Брэндийн жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading brands...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead className="w-20">Зураг</TableHead>
                  <TableHead>Брэндийн нэр</TableHead>
                  <TableHead className="text-right">Өөрчлөх</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No brands found. Add your first brand.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand, index) => (
                    <TableRow key={brand.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        {brand.image ? (
                          <img
                            src={brand.image}
                            alt={brand.name}
                            className="w-12 h-12 object-contain rounded border bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            No img
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(brand)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(brand.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
              <DialogDescription>
                {editingBrand
                  ? "Update the brand name or image."
                  : "Fill in the details to add a new brand."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Брэндийн нэр (Brand Name) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Nike"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Брэндийн зураг (Brand Image)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <input
                    type="file"
                    id="brand-image-upload"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="brand-image-upload"
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-7 w-7 text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground text-center">
                      {imagePreview
                        ? "Зураг сонгогдсон (Image selected)"
                        : "Зураг сонгох (Click to select image)"}
                    </p>
                  </label>

                  {imagePreview && (
                    <div className="mt-4 flex justify-center">
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Brand preview"
                          className="w-28 h-28 object-contain rounded-md border bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
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
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                Хаах
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingBrand ? "Save Changes" : "Add Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
