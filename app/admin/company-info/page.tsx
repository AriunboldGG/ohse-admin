"use client"

import { useEffect, useRef, useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Loader2, Upload, XCircle } from "lucide-react"

type CompanyInfoItem = {
  id: string
  address?: string
  company_phone?: string
  company_description?: string
  delivery_info?: string
  company_image_url?: string
  partners_images?: string[]
  riim_images?: string[]
  email?: string
  fb?: string
  mobile_phone?: string
  wechat?: string
  whatsup?: string
  createdAt?: string
  updatedAt?: string
}

const emptyForm = {
  address: "",
  company_phone: "",
  company_description: "",
  delivery_info: "",
  email: "",
  fb: "",
  mobile_phone: "",
  wechat: "",
  whatsup: "",
}

type PartnerImageItem = {
  url: string
  file?: File
}

export default function CompanyInfoPage() {
  const [items, setItems] = useState<CompanyInfoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CompanyInfoItem | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [companyImageFile, setCompanyImageFile] = useState<File | null>(null)
  const [companyImagePreview, setCompanyImagePreview] = useState("")
  const [partnerImages, setPartnerImages] = useState<PartnerImageItem[]>([])
  const [riimImages, setRiimImages] = useState<PartnerImageItem[]>([])
  const partnerInputRef = useRef<HTMLInputElement | null>(null)
  const riimInputRef = useRef<HTMLInputElement | null>(null)

  const fetchCompanyInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/company-info")
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch company info")
      }
      setItems(result.data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load company info")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    setFormData({ ...emptyForm })
    setCompanyImageFile(null)
    setCompanyImagePreview("")
    setPartnerImages([])
    setRiimImages([])
    setIsDialogOpen(true)
  }

  const openEdit = (item: CompanyInfoItem) => {
    setEditingItem(item)
    setFormData({
      address: item.address || "",
      company_phone: item.company_phone || "",
      company_description: item.company_description || "",
      delivery_info: item.delivery_info || "",
      email: item.email || "",
      fb: item.fb || "",
      mobile_phone: item.mobile_phone || "",
      wechat: item.wechat || "",
      whatsup: item.whatsup || "",
    })
    setCompanyImageFile(null)
    setCompanyImagePreview(item.company_image_url || "")
    setPartnerImages((item.partners_images || []).map((url) => ({ url })))
    setRiimImages((item.riim_images || []).map((url) => ({ url })))
    setIsDialogOpen(true)
  }

  const handleCompanyImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    if (companyImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(companyImagePreview)
    }
    const preview = URL.createObjectURL(file)
    setCompanyImageFile(file)
    setCompanyImagePreview(preview)
    event.target.value = ""
  }

  const handleRemoveCompanyImage = () => {
    if (companyImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(companyImagePreview)
    }
    setCompanyImageFile(null)
    setCompanyImagePreview("")
  }

  const handlePartnerImagesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    const newItems: PartnerImageItem[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file)
        newItems.push({ url: preview, file })
      }
    })
    if (newItems.length) {
      setPartnerImages((prev) => [...prev, ...newItems])
    }
    event.target.value = ""
  }

  const handleRemovePartnerImage = (index: number) => {
    setPartnerImages((prev) => {
      const updated = [...prev]
      const removed = updated[index]
      if (removed?.url && removed.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url)
      }
      updated.splice(index, 1)
      return updated
    })
  }

  const handleRiimImagesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    const newItems: PartnerImageItem[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file)
        newItems.push({ url: preview, file })
      }
    })
    if (newItems.length) {
      setRiimImages((prev) => {
        const remaining = Math.max(0, 3 - prev.length)
        if (remaining === 0) return prev
        const limited = newItems.slice(0, remaining)
        if (limited.length < newItems.length) {
          alert("Show room images хамгийн ихдээ 3 байна.")
        }
        return [...prev, ...limited]
      })
    }
    event.target.value = ""
  }

  const handleRemoveRiimImage = (index: number) => {
    setRiimImages((prev) => {
      const updated = [...prev]
      const removed = updated[index]
      if (removed?.url && removed.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url)
      }
      updated.splice(index, 1)
      return updated
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const url = editingItem ? `/api/company-info/${editingItem.id}` : "/api/company-info"
      const method = editingItem ? "PUT" : "POST"
      const payload = new FormData()
      payload.append("address", formData.address)
      payload.append("company_phone", formData.company_phone)
      payload.append("company_description", formData.company_description)
      payload.append("delivery_info", formData.delivery_info)
      payload.append("email", formData.email)
      payload.append("fb", formData.fb)
      payload.append("mobile_phone", formData.mobile_phone)
      payload.append("wechat", formData.wechat)
      payload.append("whatsup", formData.whatsup)

      if (companyImageFile) {
        payload.append("company_image", companyImageFile)
      } else if (editingItem?.company_image_url) {
        payload.append("company_image_url", editingItem.company_image_url)
      }

      const existingPartners = partnerImages.filter((item) => !item.file).map((item) => item.url)
      payload.append("partners_existing", JSON.stringify(existingPartners))
      partnerImages.forEach((item) => {
        if (item.file) {
          payload.append("partners_images", item.file)
        }
      })

      const existingRiim = riimImages.filter((item) => !item.file).map((item) => item.url)
      payload.append("riim_existing", JSON.stringify(existingRiim))
      riimImages.forEach((item) => {
        if (item.file) {
          payload.append("riim_images", item.file)
        }
      })

      const response = await fetch(url, {
        method,
        body: payload,
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save company info")
      }
      setIsDialogOpen(false)
      setEditingItem(null)
      if (companyImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(companyImagePreview)
      }
      partnerImages.forEach((item) => {
        if (item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url)
        }
      })
      riimImages.forEach((item) => {
        if (item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url)
        }
      })
      setCompanyImageFile(null)
      setCompanyImagePreview("")
      setPartnerImages([])
      setRiimImages([])
      await fetchCompanyInfo()
    } catch (err: any) {
      alert(err?.message || "Failed to save company info")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: CompanyInfoItem) => {
    if (!confirm("Та энэ мэдээллийг устгахдаа итгэлтэй байна уу?")) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/company-info/${item.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete company info")
      }
      await fetchCompanyInfo()
    } catch (err: any) {
      alert(err?.message || "Failed to delete company info")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Company Info</h1>
          
        </div>
        {/* <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Company Info
        </Button> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Info</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Уншиж байна...</p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-destructive">Алдаа: {error}</p>
              <Button variant="outline" onClick={fetchCompanyInfo}>
                Дахин оролдох
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Өгөгдөл олдсонгүй</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead className="min-w-[360px]">Description</TableHead>
                    <TableHead className="min-w-[260px]">Хүргэлтийн мэдээлэл</TableHead>
                    <TableHead>Company Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Facebook</TableHead>
                    <TableHead>Mobile Phone</TableHead>
                    <TableHead>WeChat</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Partners</TableHead>
                    <TableHead>Show room images</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[200px]">{item.address || "-"}</TableCell>
                      <TableCell className="min-w-[360px]">
                        <div className="max-w-[520px] overflow-x-auto whitespace-nowrap">
                          {item.company_description || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[260px]">{item.delivery_info || "-"}</TableCell>
                      <TableCell>{item.company_phone || "-"}</TableCell>
                      <TableCell>{item.email || "-"}</TableCell>
                      <TableCell>{item.fb || "-"}</TableCell>
                      <TableCell>{item.mobile_phone || "-"}</TableCell>
                      <TableCell>{item.wechat || "-"}</TableCell>
                      <TableCell>{item.whatsup || "-"}</TableCell>
                      <TableCell>
                        {item.company_image_url ? (
                          <img
                            src={item.company_image_url}
                            alt="Company"
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{item.partners_images?.length ?? 0}</TableCell>
                      <TableCell>{item.riim_images?.length ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            aria-label="Edit company info"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            disabled={isDeleting}
                            aria-label="Delete company info"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (isSaving) return
          setIsDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Company Info" : "Create Company Info"}</DialogTitle>
            <DialogDescription>Fill in the company info fields and save.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                placeholder="Company address"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company_description">Company Description</Label>
              <textarea
                id="company_description"
                value={formData.company_description}
                onChange={(event) => setFormData({ ...formData, company_description: event.target.value })}
                placeholder="Company description"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="delivery_info">Хүргэлтийн мэдээлэл</Label>
              <textarea
                id="delivery_info"
                value={formData.delivery_info}
                onChange={(event) => setFormData({ ...formData, delivery_info: event.target.value })}
                placeholder="Хүргэлтийн мэдээлэл"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">Company Phone</Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(event) => setFormData({ ...formData, company_phone: event.target.value })}
                placeholder="Company phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_phone">Mobile Phone</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(event) => setFormData({ ...formData, mobile_phone: event.target.value })}
                placeholder="Mobile phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb">Facebook</Label>
              <Input
                id="fb"
                value={formData.fb}
                onChange={(event) => setFormData({ ...formData, fb: event.target.value })}
                placeholder="Facebook"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wechat">WeChat</Label>
              <Input
                id="wechat"
                value={formData.wechat}
                onChange={(event) => setFormData({ ...formData, wechat: event.target.value })}
                placeholder="WeChat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsup">WhatsApp</Label>
              <Input
                id="whatsup"
                value={formData.whatsup}
                onChange={(event) => setFormData({ ...formData, whatsup: event.target.value })}
                placeholder="WhatsApp"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Company Image</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    id="company-image-upload"
                    accept="image/*"
                    onChange={handleCompanyImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="company-image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-primary/50 bg-muted/30 hover:bg-muted/50"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {companyImagePreview ? "Зураг сонгогдсон" : "Зураг сонгох (Click to select image)"}
                    </p>
                  </label>
                </div>
                {companyImagePreview && (
                  <div className="relative mt-4 flex justify-center">
                    <div className="relative group">
                      <img
                        src={companyImagePreview}
                        alt="Company preview"
                        className="h-32 w-32 rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCompanyImage}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Partners (Images)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    id="partners-images-upload"
                    accept="image/*"
                    multiple
                    onChange={handlePartnerImagesSelect}
                    className="hidden"
                    ref={partnerInputRef}
                  />
                  <label
                    htmlFor="partners-images-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-primary/50 bg-muted/30 hover:bg-muted/50"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {partnerImages.length > 0
                        ? `${partnerImages.length} зураг сонгогдсон`
                        : "Зураг сонгох (Click to select images)"}
                    </p>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => partnerInputRef.current?.click()}
                  >
                    Add Partner Image
                  </Button>
                </div>
                {partnerImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {partnerImages.filter((item) => !!item.url).map((item, index) => (
                      <div key={`${item.url}-${index}`} className="relative group">
                        <img
                          src={item.url}
                          alt={`Partner ${index + 1}`}
                          className="h-24 w-full rounded-md object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePartnerImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Show room images (max 3)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    id="riim-images-upload"
                    accept="image/*"
                    multiple
                    onChange={handleRiimImagesSelect}
                    className="hidden"
                    ref={riimInputRef}
                    disabled={riimImages.length >= 3}
                  />
                  <label
                    htmlFor="riim-images-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      riimImages.length >= 3
                        ? "border-muted-foreground/25 bg-muted/50 cursor-not-allowed"
                        : "border-primary/50 bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {riimImages.length > 0
                        ? `${riimImages.length} зураг сонгогдсон`
                        : "Зураг сонгох (Click to select images)"}
                    </p>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => riimInputRef.current?.click()}
                    disabled={riimImages.length >= 3}
                  >
                    Add Show room images
                  </Button>
                </div>
                {riimImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {riimImages.filter((item) => !!item.url).map((item, index) => (
                      <div key={`${item.url}-${index}`} className="relative group">
                        <img
                          src={item.url}
                          alt={`Riim ${index + 1}`}
                          className="h-24 w-full rounded-md object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRiimImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
