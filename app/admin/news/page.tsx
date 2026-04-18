"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Plus, Pencil, Trash2 } from "lucide-react"

type NewsItem = {
  id: string
  title: string
  body: string
  category: string
  coverImageUrl?: string
  createdAt?: string
  updatedAt?: string
}

const emptyForm = {
  title: "",
  body: "",
  category: "",
  coverImageUrl: "",
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchNews = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/news")
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch news")
      }
      setNews(result.data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load news")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    setFormData({ ...emptyForm })
    setCoverFile(null)
    setIsDialogOpen(true)
  }

  const openEdit = (item: NewsItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title || "",
      body: item.body || "",
      category: item.category || "",
      coverImageUrl: item.coverImageUrl || "",
    })
    setCoverFile(null)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.body.trim() || !formData.category.trim()) {
      alert("News title, body, and category are required.")
      return
    }

    if (!editingItem && !coverFile) {
      alert("Cover image is required.")
      return
    }

    setIsSaving(true)
    try {
      const form = new FormData()
      form.append("title", formData.title)
      form.append("body", formData.body)
      form.append("category", formData.category)
      if (coverFile) {
        form.append("coverImage", coverFile)
      } else if (formData.coverImageUrl) {
        form.append("coverImageUrl", formData.coverImageUrl)
      }

      const url = editingItem ? `/api/news/${editingItem.id}` : "/api/news"
      const method = editingItem ? "PUT" : "POST"
      const response = await fetch(url, { method, body: form })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save news")
      }

      await fetchNews()
      setIsDialogOpen(false)
    } catch (err: any) {
      alert(err?.message || "Failed to save news")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: NewsItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/news/${item.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete news")
      }
      await fetchNews()
    } catch (err: any) {
      alert(err?.message || "Failed to delete news")
    } finally {
      setIsDeleting(false)
    }
  }

  const renderImage = useMemo(() => {
    if (coverFile) {
      return URL.createObjectURL(coverFile)
    }
    return formData.coverImageUrl || ""
  }, [coverFile, formData.coverImageUrl])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">News</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage news posts</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create News
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">News list</CardTitle>
          <CardDescription>Latest entries from Firestore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead className="min-w-[220px]">Title</TableHead>
                  <TableHead className="min-w-[140px]">Category</TableHead>
                  <TableHead className="min-w-[160px]">Created</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : news.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No news yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  news.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("mn-MN") : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            disabled={isDeleting}
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit News" : "Create News"}</DialogTitle>
            <DialogDescription>Provide title, body, category, and cover image.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>News title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Body</Label>
                <textarea
                  className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Enter news body"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Cover image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
                {renderImage && (
                  <img
                    src={renderImage}
                    alt="Cover preview"
                    className="mt-3 w-full max-h-64 object-cover rounded-md border"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
