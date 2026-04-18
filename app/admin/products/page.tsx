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
import { Plus, Pencil, Trash2, X, Upload, XCircle, Search, Check, ArrowLeft, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Product {
  id: string
  name: string
  name_en?: string
  youtube_url?: string
  price: number
  sale_price?: number
  stock: number
  brand: string
  color: string[] | string // Can be array or string
  size: string[] | string // Can be array or string
  material?: string
  description?: string
  feature?: string
  manufacture_country?: string
  mainCategory?: string
  category: string // Ангилал (Category)
  subcategory: string // Дэд ангилал (Subcategory)
  product_sector?: string[] | string // Product sector
  "model number"?: string // Модел дугаар (Model number)
  product_code?: string // Product code (auto-generated)
  brand_image?: string // Brand image URL
  productTypes?: string[] // Product types array (BEST SELLER, NEW, etc.)
  images?: string[] // Product images URLs
  createdAt?: string // Creation date
}

interface MainCategoryItem {
  id: string
  name: string
  nameEn?: string
}

interface ProductSectorItem {
  id: string
  name: string
  order?: number
}

interface CategoryItem {
  id: string
  name: string
  mainCategoryId?: string
}

interface SubcategoryItem {
  id: string
  name: string
  categoryId?: string
  mainCategoryId?: string
}

const buildCategoryId = (mainCategoryId: string, name: string) => `${mainCategoryId}::${name}`
const parseCategoryName = (categoryId: string) => categoryId.split("::").slice(1).join("::") || categoryId

const PRICE_DECIMALS = 0
const roundToThousandth = (value: number): number => {
  const factor = 10 ** PRICE_DECIMALS
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const formatPriceInput = (value: string | number): string => {
  const parsed = typeof value === "number" ? value : parseFloat(String(value))
  if (!Number.isFinite(parsed)) return ""
  return roundToThousandth(parsed).toFixed(PRICE_DECIMALS)
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: PRICE_DECIMALS,
  maximumFractionDigits: PRICE_DECIMALS,
})
const priceFormatterNoDecimals = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formatPriceDisplay = (value: string | number): string => {
  const parsed = typeof value === "number" ? value : parseFloat(String(value))
  if (!Number.isFinite(parsed)) return ""
  const rounded = roundToThousandth(parsed)
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-9
  return (isWhole ? priceFormatterNoDecimals : priceFormatter).format(rounded)
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("all")
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    youtubeUrl: "",
    price: "",
    salePrice: "",
    stock: "",
    brand: "",
    color: "",
    size: "", // Will be stored as comma-separated string, converted to array
    material: "", // Материал
    description: "", // Тодорхойлолт
    feature: "", // Онцлог
    manufactureCountry: "", // Manufacture country
    mainCategory: "", // Main category ID
    category: "", // Ангилал (subcategory)
    subcategory: "", // Дэд ангилал (sub-subcategory if exists)
    productSector: [] as string[], // Product sector (ids or names)
    modelNumber: "", // Модел дугаар
    productCode: "", // Product code (auto-generated)
    productTypes: [] as string[], // Product types array
  })
  
  // Product types options
  const productTypeOptions = [
    { value: "BEST SELLER", label: "BEST SELLER" },
    { value: "NEW", label: "ШИНЭ (NEW)" },
    { value: "DISCOUNTED", label: "ХЯМДРАЛТАЙ (DISCOUNTED)" },
    { value: "PROMOTION", label: "ПРОМОУШН (PROMOTION)" },
    { value: "RECOMMEND", label: "САНАЛ БОЛГОХ (RECOMMEND)" },
  ]
  
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("")
  const [availableSubcategories, setAvailableSubcategories] = useState<CategoryItem[]>([])
  const [availableSubSubcategories, setAvailableSubSubcategories] = useState<SubcategoryItem[]>([])
  const [mainCategoriesList, setMainCategoriesList] = useState<MainCategoryItem[]>([])
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([])
  const [subcategoriesList, setSubcategoriesList] = useState<SubcategoryItem[]>([])
  const [productSectors, setProductSectors] = useState<ProductSectorItem[]>([])
  const [productImages, setProductImages] = useState<string[]>([]) // Array of image URLs
  const [imageFiles, setImageFiles] = useState<File[]>([]) // Array of File objects for new uploads
  const [imagePreviews, setImagePreviews] = useState<string[]>([]) // Array of preview URLs
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [imagePreviewFileMap, setImagePreviewFileMap] = useState<Record<string, File>>({})
  const [imageZoomOrigin, setImageZoomOrigin] = useState<Record<number, { x: number; y: number }>>({})
  
  // Brand image state
  const [brandImage, setBrandImage] = useState<string>("") // Brand image URL
  const [brandImageFile, setBrandImageFile] = useState<File | null>(null) // Brand image file
  const [brandImagePreview, setBrandImagePreview] = useState<string>("") // Brand image preview URL
  
  // Separate state for colors and sizes arrays
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [colorInput, setColorInput] = useState("")
  const [sizeInput, setSizeInput] = useState("")

  const normalizeProductSectors = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean)
    }
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) return []
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter(Boolean)
          }
        } catch (error) {
          console.warn("Failed to parse product sector JSON:", error)
        }
      }
      if (trimmed.includes(",")) {
        return trimmed.split(",").map((item) => item.trim()).filter(Boolean)
      }
      return [trimmed]
    }
    return []
  }

  const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean)
    }
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed ? [trimmed] : []
    }
    return []
  }

  const addSizesFromInput = (rawValue: string) => {
    const tokens = rawValue
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
    if (tokens.length === 0) return
    setSizes((prev) => {
      const next = [...prev]
      tokens.forEach((token) => {
        if (!next.includes(token)) {
          next.push(token)
        }
      })
      return next
    })
    setSizeInput("")
  }

  const rebuildImageCollections = (
    previews: string[],
    previewFileMap: Record<string, File>
  ) => {
    const newFiles = previews.filter((preview) => previewFileMap[preview]).map((preview) => previewFileMap[preview])
    const existingImages = previews.filter((preview) => !previewFileMap[preview])
    setImageFiles(newFiles)
    setProductImages(existingImages)
    setImagePreviews(previews)
  }

  const getSubSubcategoriesForCategory = (categoryIdOrName: string) => {
    if (!categoryIdOrName) return []
    const categoryName = getCategoryNameById(categoryIdOrName)
    return subcategoriesList.filter((sub) =>
      sub.categoryId === categoryIdOrName || sub.categoryId === categoryName
    )
  }

  // Function to generate product code based on main category
  const getMainCategoryCode = (mainCategoryId: string): string => {
    const mainCategory = mainCategoriesList.find(cat => cat.id === mainCategoryId)
    const baseName = (mainCategory?.nameEn || mainCategory?.name || "").trim()
    const rawCode = baseName || mainCategoryId
    const normalized = rawCode
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 6)
    if (normalized) {
      return normalized
    }

    const fallback = mainCategoryId
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 6)
    return fallback || "CAT"
  }
  const generateProductCode = async (mainCategoryId: string): Promise<string> => {
    if (!mainCategoryId) return ""
    
    // Get category name from ID
    const mainCategoryName = getCategoryNameById(mainCategoryId)
    if (!mainCategoryName) return ""
    
    // Use readable code based on name instead of long IDs
    const categoryCode = getMainCategoryCode(mainCategoryId)
    const categoryPrefix = `CAT-${categoryCode}`
    
    // Fetch existing products to check for duplicates
    try {
      const response = await fetch("/api/products")
      const result = await response.json()
      
      if (result.success) {
        // Filter products with the same mainCategory (by name or ID) or same prefix
        const sameCategoryProducts = result.data.filter((p: any) => 
          p.mainCategory === mainCategoryName || 
          p.mainCategory === mainCategoryId ||
          (p.product_code && p.product_code.startsWith(categoryPrefix))
        )
        
        // Find the highest number for this category
        let maxNumber = 0
        sameCategoryProducts.forEach((p: any) => {
          if (p.product_code) {
            const match = p.product_code.match(new RegExp(`^${categoryPrefix}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })
        
        // Generate next number (padded to 3 digits)
        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        return `${categoryPrefix}-${nextNumber}`
      }
    } catch (error) {
      console.error("Error generating product code:", error)
    }
    
    // Fallback: return with 001 if no products found
    return `${categoryPrefix}-001`
  }

  // Fetch products and categories from Firestore
  useEffect(() => {
    fetchProducts()
    fetchAllCategories()
    fetchProductSectors()
  }, [])

  const fetchAllCategories = async () => {
    try {
      const mainResponse = await fetch("/api/categories/main")
      const mainResult = await mainResponse.json()

      if (mainResult.success) {
        setMainCategoriesList(mainResult.data)
        const derivedCategories: CategoryItem[] = []
        const derivedSubcategories: SubcategoryItem[] = []
        mainResult.data.forEach((main: any) => {
          const children = Array.isArray(main.children) ? main.children : []
          children.forEach((childName: string) => {
            const categoryId = buildCategoryId(main.id, childName)
            derivedCategories.push({
              id: categoryId,
              name: childName,
              mainCategoryId: main.id,
            })
            const subchildrenMap = main.subchildren || {}
            const subchildren = Array.isArray(subchildrenMap?.[childName]) ? subchildrenMap[childName] : []
            subchildren.forEach((subName: string) => {
              derivedSubcategories.push({
                id: buildCategoryId(main.id, `${childName}::${subName}`),
                name: subName,
                categoryId,
                mainCategoryId: main.id,
              })
            })
          })
        })
        setCategoriesList(derivedCategories)
        setSubcategoriesList(derivedSubcategories)
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  const fetchProductSectors = async () => {
    try {
      const response = await fetch("/api/product-sectors")
      const result = await response.json()
      if (result.success) {
        setProductSectors(result.data)
      }
    } catch (err) {
      console.error("Error fetching product sectors:", err)
    }
  }

  useEffect(() => {
    if (selectedMainCategory) {
      setAvailableSubcategories(
        categoriesList.filter(cat => cat.mainCategoryId === selectedMainCategory)
      )
    }
  }, [selectedMainCategory, categoriesList])

  useEffect(() => {
    if (formData.category) {
      setAvailableSubSubcategories(getSubSubcategoriesForCategory(formData.category))
    }
  }, [formData.category, subcategoriesList])

  useEffect(() => {
    if (selectedMainCategory && mainCategoriesList.length > 0) {
      const hasId = mainCategoriesList.some(cat => cat.id === selectedMainCategory)
      if (!hasId) {
        const resolved = getCategoryIdByName(selectedMainCategory)
        if (resolved && resolved !== selectedMainCategory) {
          setSelectedMainCategory(resolved)
        }
      }
    }
  }, [selectedMainCategory, mainCategoriesList])

  useEffect(() => {
    if (formData.category && categoriesList.length > 0) {
      const hasId = categoriesList.some(cat => cat.id === formData.category)
      if (!hasId) {
        const resolved = getCategoryIdByName(formData.category)
        if (resolved && resolved !== formData.category) {
          setFormData(prev => ({ ...prev, category: resolved }))
        }
      }
    }
  }, [formData.category, categoriesList])

  useEffect(() => {
    if (formData.subcategory && subcategoriesList.length > 0) {
      const hasId = subcategoriesList.some(sub => sub.id === formData.subcategory)
      if (!hasId) {
        const resolved = getCategoryIdByName(formData.subcategory)
        if (resolved && resolved !== formData.subcategory) {
          setFormData(prev => ({ ...prev, subcategory: resolved }))
        }
      }
    }
  }, [formData.subcategory, subcategoriesList])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/products")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success) {
        // Map Firestore data to Product interface
        const mappedProducts = result.data.map((product: any) => ({
          id: product.id,
          name: product.name || "",
          name_en: product.name_en || product.nameEn || "",
          youtube_url: product.youtube_url || product.youtubeUrl || "",
          price: product.price || 0,
          sale_price: product.sale_price ?? product.salePrice ?? undefined,
          stock: product.stock || 0,
          brand: product.brand || "",
          color: Array.isArray(product.color)
            ? product.color
            : typeof product.color === "string"
              ? product.color.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0)
              : [],
          size: Array.isArray(product.size)
            ? product.size
            : typeof product.size === "string"
              ? product.size.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0)
              : [],
          material: product.material || "",
          description: product.description || "",
          feature: product.feature || "",
          manufacture_country: product.manufacture_country || product.manufactureCountry || "",
          mainCategory: product.mainCategory || "",
          category: product.category || "",
          subcategory: product.subcategory || "",
          product_sector: normalizeProductSectors(product.product_sector || product.productSector),
          "model number": product["model number"] || product.model_number || product.modelNumber || "",
          product_code: product.product_code || product.productCode || "",
          brand_image: product.brand_image || product.brandImage || "",
          productTypes: Array.isArray(product.productTypes) ? product.productTypes : [],
          images: normalizeStringArray(product.images),
          createdAt: product.createdAt || product.created_at || "",
        }))
        
        // Sort by createdAt descending (newest first)
        mappedProducts.sort((a: Product, b: Product) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA // Descending order (newest first)
        })
        
        setProducts(mappedProducts)
      } else {
        const errorMsg = result.error || "Failed to fetch products"
        // Provide more helpful error message for production issues
        if (errorMsg.includes("Firebase") || errorMsg.includes("environment") || errorMsg.includes("configuration")) {
          setError(`${errorMsg}. Please check that Firebase environment variables are configured in production.`)
        } else {
          setError(errorMsg)
        }
      }
    } catch (err: any) {
      console.error("Error fetching products:", err)
      let errorMsg = err?.message || "Failed to load products. Please try again."
      // Check if it's a network/API error
      if (err?.message?.includes("HTTP error") || err?.message?.includes("fetch")) {
        errorMsg = "Unable to connect to the server. Please check your network connection and try again."
      }
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      // Convert size and color to arrays for the UI
      const sizeArray = Array.isArray(product.size)
        ? product.size
        : (product.size ? product.size.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [])
      const colorArray = Array.isArray(product.color)
        ? product.color
        : (product.color ? product.color.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0) : [])
      
      setColors(colorArray)
      setSizes(sizeArray)
      setColorInput("")
      setSizeInput("")
      
      // Set all existing product data
      setFormData({
        name: product.name || "",
        nameEn: product.name_en || (product as any).nameEn || "",
        youtubeUrl: product.youtube_url || (product as any).youtubeUrl || "",
        price: formatPriceInput(product.price),
        salePrice: product.sale_price !== undefined ? formatPriceInput(product.sale_price) : "",
        stock: product.stock.toString(),
        brand: product.brand || "",
        color: "", // Will be managed by colors array
        size: "", // Will be managed by sizes array
        material: product.material || "",
        description: product.description || "",
        feature: product.feature || "",
        manufactureCountry: product.manufacture_country || (product as any).manufactureCountry || "",
        mainCategory: product.mainCategory || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        productSector: normalizeProductSectors(product.product_sector || (product as any).productSector),
        modelNumber: product["model number"] || "",
        productCode: product.product_code || "",
        productTypes: Array.isArray(product.productTypes) ? product.productTypes : [],
      })
      
      // Set existing images
      const normalizedImages = normalizeStringArray(product.images)
      setImagePreviewFileMap({})
      rebuildImageCollections(normalizedImages, {})
      
      // Set brand image
      setBrandImage(product.brand_image || "")
      setBrandImagePreview(product.brand_image || "")
      setBrandImageFile(null)
      
      // Set main category and load subcategories if mainCategory exists
      // Handle both names (new format) and IDs (old format) for backward compatibility
      if (product.mainCategory) {
        const mainCategoryId = getCategoryIdByName(product.mainCategory)
        setSelectedMainCategory(mainCategoryId)
        setAvailableSubcategories(
          categoriesList.filter(cat => cat.mainCategoryId === mainCategoryId)
        )
        
        if (product.category) {
          const categoryId = getCategoryIdByName(product.category)
          setFormData(prev => ({ ...prev, category: categoryId }))
          setAvailableSubSubcategories(
            subcategoriesList.filter(sub => sub.categoryId === categoryId)
          )
          
          if (product.subcategory) {
            const subcategoryId = getCategoryIdByName(product.subcategory)
            setFormData(prev => ({ ...prev, subcategory: subcategoryId }))
          }
        } else {
          setAvailableSubSubcategories([])
        }
      } else {
        setSelectedMainCategory("")
        setAvailableSubcategories([])
        setAvailableSubSubcategories([])
      }
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        nameEn: "",
        youtubeUrl: "",
        price: "",
        salePrice: "",
        stock: "",
        brand: "",
        color: "",
        size: "",
        material: "",
        description: "",
        feature: "",
        manufactureCountry: "",
        mainCategory: "",
        category: "",
        subcategory: "",
        productSector: [] as string[],
        modelNumber: "",
        productCode: "",
        productTypes: [],
      })
      setSelectedMainCategory("")
      setAvailableSubcategories([])
      setAvailableSubSubcategories([])
      setColors([])
      setSizes([])
      setColorInput("")
      setSizeInput("")
      setBrandImage("")
      setBrandImageFile(null)
      setBrandImagePreview("")
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setColors([])
    setSizes([])
    setColorInput("")
    setSizeInput("")
    setFormData({
      name: "",
      nameEn: "",
      youtubeUrl: "",
      price: "",
      salePrice: "",
      stock: "",
      brand: "",
      color: "",
      size: "",
      material: "",
      description: "",
      feature: "",
      manufactureCountry: "",
      mainCategory: "",
      category: "",
      subcategory: "",
      productSector: [] as string[],
      modelNumber: "",
      productCode: "",
      productTypes: [],
    })
    setSelectedMainCategory("")
    setAvailableSubcategories([])
    setAvailableSubSubcategories([])
    imagePreviews.forEach((preview) => {
      if (typeof preview === "string" && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview)
      }
    })
    setProductImages([])
    setImageFiles([])
    setImagePreviews([])
    setImagePreviewFileMap({})
    setBrandImage("")
    setBrandImageFile(null)
    setBrandImagePreview("")
  }
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newFiles = Array.from(files)
    const totalImages = imagePreviews.length + newFiles.length
    
    if (totalImages > 5) {
      alert("Та хамгийн ихдээ 5 зураг нэмж болно (You can add maximum 5 images)")
      return
    }
    
    const newPreviews: string[] = []
    const newMap = { ...imagePreviewFileMap }
    
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file)
        newPreviews.push(preview)
        newMap[preview] = file
      }
    })
    const mergedPreviews = [...imagePreviews, ...newPreviews]
    setImagePreviewFileMap(newMap)
    rebuildImageCollections(mergedPreviews, newMap)
    
    // Reset input
    e.target.value = ''
  }
  
  const handleRemoveImage = (index: number) => {
    // Remove from previews
    const newPreviews = [...imagePreviews]
    const previewToRemove = newPreviews[index]
    
    // Revoke object URL if it's a preview
    if (typeof previewToRemove === "string" && previewToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRemove)
    }
    
    newPreviews.splice(index, 1)
    const newMap = { ...imagePreviewFileMap }
    if (previewToRemove && newMap[previewToRemove]) {
      delete newMap[previewToRemove]
    }
    setImagePreviewFileMap(newMap)
    rebuildImageCollections(newPreviews, newMap)
  }

  const handlePreviewMouseMove = (index: number, event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setImageZoomOrigin((prev) => ({ ...prev, [index]: { x, y } }))
  }

  const handlePreviewMouseLeave = (index: number) => {
    setImageZoomOrigin((prev) => ({ ...prev, [index]: { x: 50, y: 50 } }))
  }

  const moveImagePreview = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= imagePreviews.length) return
    const reordered = [...imagePreviews]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    rebuildImageCollections(reordered, imagePreviewFileMap)
  }
  
  const handleBrandImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.type.startsWith('image/')) {
      setBrandImageFile(file)
      const preview = URL.createObjectURL(file)
      setBrandImagePreview(preview)
    }
    
    // Reset input
    e.target.value = ''
  }
  
  const handleRemoveBrandImage = () => {
    if (brandImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(brandImagePreview)
    }
    setBrandImage("")
    setBrandImageFile(null)
    setBrandImagePreview("")
  }
  
  const handleMainCategoryChange = async (mainCategoryId: string) => {
    setSelectedMainCategory(mainCategoryId)
    setFormData({ ...formData, mainCategory: mainCategoryId, category: "", subcategory: "" })
    
    // Generate product code based on main category
    if (mainCategoryId && !editingProduct) {
      const productCode = await generateProductCode(mainCategoryId)
      setFormData(prev => ({ ...prev, productCode }))
    }
    
    // Find categories for the selected main category
    const filteredCategories = categoriesList.filter(cat => cat.mainCategoryId === mainCategoryId)
    setAvailableSubcategories(filteredCategories)
    setAvailableSubSubcategories([])
  }
  
  const handleSubcategoryChange = (subcategoryId: string) => {
    setFormData({ ...formData, category: subcategoryId, subcategory: "" })
    
    const filteredSubcategories = getSubSubcategoriesForCategory(subcategoryId)
    setAvailableSubSubcategories(filteredSubcategories)
  }
  
  const handleSubSubcategoryChange = (subSubcategoryId: string) => {
    setFormData({ ...formData, subcategory: subSubcategoryId })
  }
  
  // Helper function to get category name by ID
  const getCategoryNameById = (categoryId: string): string => {
    if (!categoryId) return ""

    const mainCat = mainCategoriesList.find(cat => cat.id === categoryId)
    if (mainCat) return mainCat.name

    const category = categoriesList.find(cat => cat.id === categoryId)
    if (category) return category.name

    const subcategory = subcategoriesList.find(sub => sub.id === categoryId)
    if (subcategory) return subcategory.name

    // If not found, attempt to parse name from composite ID
    return parseCategoryName(categoryId)
  }
  
  // Helper function to find category ID by name (for loading existing products)
  const getCategoryIdByName = (categoryName: string): string => {
    if (!categoryName) return ""
    
    const mainCat = mainCategoriesList.find(cat => cat.name === categoryName)
    if (mainCat) return mainCat.id
    
    const category = categoriesList.find(cat => cat.name === categoryName)
    if (category) return category.id
    
    const subcategory = subcategoriesList.find(sub => sub.name === categoryName)
    if (subcategory) return subcategory.id
    
    return categoryName // Fallback to name if not found (might be an ID from old data)
  }
  
  // Check if fields should be shown based on main category selection or if editing
  const shouldShowFields = () => {
    // If editing, always show fields (main category is already set)
    if (editingProduct) {
      return true
    }
    // For new products, require main category selection
    return selectedMainCategory !== ""
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productSector.length) {
      alert("Салбарын ангилал сонгоно уу (Please select product sector)")
      return
    }
    
    if (!selectedMainCategory) {
      alert("Үндсэн ангилал сонгоно уу (Please select main category)")
      return
    }
    
    if (!formData.category) {
      alert("Ангилал сонгоно уу (Please select category)")
      return
    }
    
    if (!shouldShowFields()) {
      alert("Үндсэн ангилал сонгоно уу (Please select main category first)")
      return
    }
    
    setIsSubmitting(true)
    setIsUploadingImages(true)
    
    try {
      // Use the arrays from state instead of parsing strings
      const sizeArray = sizes.filter(s => s.length > 0)
      const colorArray = colors.filter(c => c.length > 0)
      
      // Validate required fields including colors and sizes
      if (colorArray.length === 0 || sizeArray.length === 0) {
        alert("Өнгө болон хэмжээ нэмнэ үү (Please add at least one color and size)")
        setIsSubmitting(false)
        setIsUploadingImages(false)
        return
      }
      
      // Get category names from IDs - always convert IDs to names
      // The function will return the name if ID is found, or return the value as-is if it's already a name
      const mainCategoryName = getCategoryNameById(selectedMainCategory)
      const categoryName = getCategoryNameById(formData.category)
      const subcategoryName = formData.subcategory ? getCategoryNameById(formData.subcategory) : ""
      
      // Debug logging to verify conversion
      console.log("Category conversion:", {
        selectedMainCategory,
        mainCategoryName,
        categoryId: formData.category,
        categoryName,
        subcategoryId: formData.subcategory,
        subcategoryName
      })
      
      // Create FormData with product data and images
      const formDataToSend = new FormData()
      
      // Append product fields
      formDataToSend.append('name', formData.name)
      formDataToSend.append('name_en', formData.nameEn)
      formDataToSend.append('youtube_url', formData.youtubeUrl)
      formDataToSend.append('price', formData.price)
      if (formData.salePrice) {
        formDataToSend.append('sale_price', formData.salePrice)
      }
      formDataToSend.append('stock', formData.stock)
      formDataToSend.append('brand', formData.brand)
      formDataToSend.append('color', colorArray.join(','))
      formDataToSend.append('size', sizeArray.join(','))
      formDataToSend.append('material', formData.material)
      formDataToSend.append('manufacture_country', formData.manufactureCountry)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('feature', formData.feature)
      formDataToSend.append('mainCategory', mainCategoryName) // Send name instead of ID
      formDataToSend.append('category', categoryName) // Send name instead of ID
      formDataToSend.append('subcategory', subcategoryName) // Send name instead of ID
      formDataToSend.append('product_sector', JSON.stringify(formData.productSector))
      formDataToSend.append('model_number', formData.modelNumber)
      formDataToSend.append('product_code', formData.productCode)
      formDataToSend.append('productTypes', JSON.stringify(formData.productTypes))
      
      // Append brand image if selected
      if (brandImageFile) {
        formDataToSend.append('brand_image', brandImageFile)
      } else if (editingProduct && brandImage) {
        // For updates, include existing brand image URL if no new file is selected
        formDataToSend.append('brand_image_url', brandImage)
      }
      
      // Append new image files
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file)
      })
      
      // For updates, include existing images
      if (editingProduct && productImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(productImages))
      }

      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          body: formDataToSend,
        })

        const result = await response.json()
        if (result.success) {
          await fetchProducts() // Refresh the list
          handleCloseDialog()
        } else {
          alert(result.error || "Failed to update product")
        }
      } else {
        // Create new product
        const response = await fetch("/api/products", {
          method: "POST",
          body: formDataToSend,
        })

        const result = await response.json()
        if (result.success) {
          await fetchProducts() // Refresh the list
          handleCloseDialog()
        } else {
          alert(result.error || "Failed to create product")
        }
      }
    } catch (err) {
      console.error("Error saving product:", err)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
      setIsUploadingImages(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        await fetchProducts() // Refresh the list
      } else {
        alert(result.error || "Failed to delete product")
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      alert("An error occurred. Please try again.")
    }
  }

  const handleResetProductCodeCounter = async () => {
    if (!confirm("Барааны кодын тоолуурыг 0000001-ээс эхлүүлэх үү?")) return
    try {
      const response = await fetch("/api/products/reset-code-counter", { method: "POST" })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to reset product code counter")
      }
      alert("Барааны кодын тоолуур шинэчлэгдлээ. Дараагийн бараа BK-0000001 болно.")
    } catch (err: any) {
      alert(err?.message || "Failed to reset product code counter")
    }
  }

  // Get unique categories from products
  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort()

  // Get unique brands from products
  const uniqueBrands = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean))
  ).sort()

  // Filter products based on selected filters and search query
  const filteredProducts = products.filter((product) => {
    // Search filter - search by product name, brand, or product code (case-insensitive)
    const searchLower = searchQuery.toLowerCase()
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchLower) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
      (product.product_code && product.product_code.toLowerCase().includes(searchLower))
    
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory
    const brandMatch = selectedBrand === "all" || product.brand === selectedBrand
    const stockMatch = 
      selectedStockStatus === "all" 
        ? true 
        : selectedStockStatus === "inStock" 
          ? product.stock > 0 
          : product.stock === 0
    
    return searchMatch && categoryMatch && brandMatch && stockMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Бүтээгдэхүүн удирдах цэс
          </p>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              Нийт: <span className="font-semibold text-foreground">{products.length}</span> бүтээгдэхүүн
              {filteredProducts.length !== products.length && (
                <span className="ml-2">
                  (Харуулж байна: <span className="font-semibold text-foreground">{filteredProducts.length}</span>)
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetProductCodeCounter}>
            Код тоолуур тэглэх
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Бараа нэмэх
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Бүтээгдэхүүний нийт жагсаалт</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && products.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Шүүлт</h3>
                {(selectedCategory !== "all" || selectedStockStatus !== "all" || selectedBrand !== "all" || searchQuery !== "") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all")
                      setSelectedStockStatus("all")
                      setSelectedBrand("all")
                      setSearchQuery("")
                    }}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Цэвэрлэх
                  </Button>
                )}
              </div>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Барааны нэр/код... (Search by name or code...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ангилалаар шүүх</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Бүх ангилал" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх ангилал</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Брэндээр шүүх</Label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Бүх брэнд" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх брэнд</SelectItem>
                      {uniqueBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Нөөцөөр шүүх</Label>
                  <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Бүх нөөц" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх нөөц</SelectItem>
                      <SelectItem value="inStock">Нөөцтэй (In Stock)</SelectItem>
                      <SelectItem value="outOfStock">Нөөцгүй (Out of Stock)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading products...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchProducts}
              >
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead>Барааны код</TableHead>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Брэнд</TableHead>
                  <TableHead>Үндсэн ангилал</TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>Дэд ангилал</TableHead>
                  <TableHead>Модел дугаар</TableHead>
                  <TableHead>Өнгө</TableHead>
                  <TableHead>Хэмжээ</TableHead>
                  <TableHead>Үнэ</TableHead>
                  <TableHead>Нөөц</TableHead>
                  <TableHead className="text-right">Өөрчлөх</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground">
                      {products.length === 0 
                        ? "No products found. Add your first product to get started."
                        : "No products match the selected filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product, index) => {
                    const sizeDisplay = Array.isArray(product.size) 
                      ? product.size.join(", ") 
                      : product.size || ""
                    const colorDisplay = Array.isArray(product.color) 
                      ? product.color.join(", ") 
                      : product.color || ""
                    // Convert category IDs to names for display
                    const mainCategoryDisplay = product.mainCategory 
                      ? getCategoryNameById(product.mainCategory)
                      : ""
                    const categoryDisplay = product.category 
                      ? getCategoryNameById(product.category)
                      : ""
                    const subcategoryDisplay = product.subcategory 
                      ? getCategoryNameById(product.subcategory)
                      : ""
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{product.product_code || "-"}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>{mainCategoryDisplay}</TableCell>
                        <TableCell>{categoryDisplay}</TableCell>
                        <TableCell>{subcategoryDisplay}</TableCell>
                        <TableCell>{product["model number"] || "-"}</TableCell>
                        <TableCell>{colorDisplay}</TableCell>
                        <TableCell>{sizeDisplay}</TableCell>
                        <TableCell>{formatPriceDisplay(product.price)}₮</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Make changes to the product details below."
                  : "Fill in the details to add a new product to your inventory."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Product Sector Selection */}
              <div className="grid gap-2">
                <Label htmlFor="productSector">Салбарын ангилал (Product Sector) *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="productSector"
                    >
                      {formData.productSector.length > 0
                        ? `${formData.productSector.length} салбар сонгогдсон`
                        : "Салбарын ангилал сонгох"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2 space-y-2">
                      {productSectors.length === 0 ? (
                        <div className="text-sm text-muted-foreground px-2 py-1">
                          Салбарын ангилал олдсонгүй
                        </div>
                      ) : (
                        productSectors.map((sector) => {
                          const isSelected = formData.productSector.includes(sector.name)
                          return (
                            <div
                              key={sector.id}
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    productSector: formData.productSector.filter(
                                      (value) => value !== sector.name
                                    ),
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    productSector: [...formData.productSector, sector.name],
                                  })
                                }
                              }}
                            >
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                  isSelected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-input"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <Label className="cursor-pointer flex-1">
                                {sector.name}
                              </Label>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Main Category Selection - Always show as dropdown (editable) */}
              <div className="grid gap-2">
                <Label htmlFor="mainCategory">Үндсэн ангилал (Main Category) *</Label>
                <Select
                  value={selectedMainCategory}
                  onValueChange={handleMainCategoryChange}
                  required
                >
                  <SelectTrigger id="mainCategory">
                    <SelectValue placeholder="Үндсэн ангилал сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategoriesList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory Selection - Show after main category is selected or when editing */}
              {((selectedMainCategory && availableSubcategories.length > 0) || (editingProduct && formData.category)) && (
                <div className="grid gap-2">
                  <Label htmlFor="category">Ангилал (Category) *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSubcategoryChange}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Ангилал сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subCat) => (
                        <SelectItem key={subCat.id} value={subCat.id}>
                          {subCat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sub-subcategory Selection - Show if subcategory has children or when editing with subcategory */}
              {((formData.category && availableSubSubcategories.length > 0) || (editingProduct && formData.subcategory)) && (
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Дэд ангилал (Subcategory)</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={handleSubSubcategoryChange}
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Дэд ангилал сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubSubcategories.map((subSubCat) => (
                        <SelectItem key={subSubCat.id} value={subSubCat.id}>
                          {subSubCat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dynamic Fields - Show only after main category is selected */}
              {shouldShowFields() && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Барааны нэр (Product Name) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nameEn">Барааны нэр (English) *</Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) =>
                        setFormData({ ...formData, nameEn: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="youtubeUrl">YouTube Link</Label>
                    <Input
                      id="youtubeUrl"
                      type="url"
                      value={formData.youtubeUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, youtubeUrl: e.target.value })
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  {/* Product Code Field - Auto-generated */}
                  {formData.productCode && (
                    <div className="grid gap-2">
                      <Label htmlFor="productCode">Барааны код (Product Code)</Label>
                      <Input
                        id="productCode"
                        value={formData.productCode}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        placeholder="Auto-generated"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brand">Брэнд (Brand) *</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="color">Өнгө (Color) *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="Enter color (e.g., Red)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (colorInput.trim() && !colors.includes(colorInput.trim())) {
                                setColors([...colors, colorInput.trim()])
                                setColorInput("")
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (colorInput.trim() && !colors.includes(colorInput.trim())) {
                              setColors([...colors, colorInput.trim()])
                              setColorInput("")
                            }
                          }}
                          variant="outline"
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {colors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {colors.map((color, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                            >
                              <span>{color}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setColors(colors.filter((_, i) => i !== index))
                                }}
                                className="hover:text-blue-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {colors.length === 0 && (
                        <p className="text-xs text-muted-foreground">Add at least one color</p>
                      )}
                    </div>
                  </div>

                  {/* Brand Image Upload */}
                  <div className="grid gap-2">
                    <Label>Брэндийн зураг (Brand Image)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <input
                          type="file"
                          id="brand-image-upload"
                          accept="image/*"
                          onChange={handleBrandImageSelect}
                          className="hidden"
                          disabled={isUploadingImages}
                        />
                        <label
                          htmlFor="brand-image-upload"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            isUploadingImages
                              ? "border-muted-foreground/25 bg-muted/50 cursor-not-allowed"
                              : "border-primary/50 bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            {brandImagePreview
                              ? "Брэндийн зураг сонгогдсон (Brand image selected)"
                              : "Брэндийн зураг сонгох (Click to select brand image)"}
                          </p>
                        </label>
                      </div>

                      {/* Brand Image Preview */}
                      {brandImagePreview && (
                        <div className="relative mt-4 flex justify-center">
                          <div className="relative group">
                            <img
                              src={brandImagePreview}
                              alt="Brand preview"
                              className="w-32 h-32 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveBrandImage}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isUploadingImages}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="size">Хэмжээ (Size) *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="size"
                          value={sizeInput}
                          onChange={(e) => setSizeInput(e.target.value)}
                          placeholder="Enter size (e.g., M)"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addSizesFromInput(sizeInput)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            addSizesFromInput(sizeInput)
                          }}
                          variant="outline"
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sizes.map((size, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                            >
                              <span>{size}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSizes(sizes.filter((_, i) => i !== index))
                                }}
                                className="hover:text-green-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {sizes.length === 0 && (
                        <p className="text-xs text-muted-foreground">Add at least one size</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="material">Материал (Material) *</Label>
                      <Input
                        id="material"
                        value={formData.material}
                        onChange={(e) =>
                          setFormData({ ...formData, material: e.target.value })
                        }
                        required
                      />
                    </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manufactureCountry">Үйлдвэрлэсэн улс (Manufacture Country)</Label>
                    <Input
                      id="manufactureCountry"
                      value={formData.manufactureCountry}
                      onChange={(e) =>
                        setFormData({ ...formData, manufactureCountry: e.target.value })
                      }
                      placeholder="e.g., Mongolia"
                    />
                  </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Тодорхойлолт (Description) *</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="feature">Онцлог (Feature) *</Label>
                    <textarea
                      id="feature"
                      value={formData.feature}
                      onChange={(e) =>
                        setFormData({ ...formData, feature: e.target.value })
                      }
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="modelNumber">Модел дугаар (Model Number)</Label>
                      <Input
                        id="modelNumber"
                        value={formData.modelNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, modelNumber: e.target.value })
                        }
                        placeholder="MC375xx/A"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Үнэ (Price) (₮) *</Label>
      <Input
                        id="price"
                        type="number"
        step="1"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        onBlur={(e) =>
                          setFormData({ ...formData, price: formatPriceInput(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="salePrice">Хямдралтай үнэ (Sale Price) (₮)</Label>
      <Input
                        id="salePrice"
                        type="number"
        step="1"
                        min="0"
                        value={formData.salePrice}
                        onChange={(e) =>
                          setFormData({ ...formData, salePrice: e.target.value })
                        }
                        onBlur={(e) =>
                          setFormData({ ...formData, salePrice: formatPriceInput(e.target.value) })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stock">Нөөц (Stock Quantity) *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Product Types Multiselect */}
                  <div className="grid gap-2">
                    <Label>Бүтээгдэхүүний төрөл (Product Type)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {formData.productTypes.length > 0
                            ? `${formData.productTypes.length} төрөл сонгогдсон (${formData.productTypes.length} selected)`
                            : "Төрөл сонгох (Select types)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <div className="p-2 space-y-2">
                          {productTypeOptions.map((option) => {
                            const isSelected = formData.productTypes.includes(option.value);
                            return (
                              <div
                                key={option.value}
                                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormData({
                                      ...formData,
                                      productTypes: formData.productTypes.filter(
                                        (type) => type !== option.value
                                      ),
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      productTypes: [...formData.productTypes, option.value],
                                    });
                                  }
                                }}
                              >
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                    isSelected
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-input"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <Label className="cursor-pointer flex-1">
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {formData.productTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.productTypes.map((type) => {
                          const option = productTypeOptions.find((opt) => opt.value === type);
                          return (
                            <div
                              key={type}
                              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                            >
                              <span>{option?.label || type}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    productTypes: formData.productTypes.filter((t) => t !== type),
                                  });
                                }}
                                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Image Upload Section */}
                  <div className="grid gap-2">
                    <Label>Зураг (Images) - Хамгийн ихдээ 5 (Maximum 5)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={imagePreviews.length >= 5 || isUploadingImages}
                        />
                        <label
                          htmlFor="image-upload"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            imagePreviews.length >= 5 || isUploadingImages
                              ? "border-muted-foreground/25 bg-muted/50 cursor-not-allowed"
                              : "border-primary/50 bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            {imagePreviews.length >= 5
                              ? "Хамгийн ихдээ 5 зураг нэмж болно (Maximum 5 images)"
                              : "Зураг сонгох эсвэл энд чирнэ үү (Click or drag images here)"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {imagePreviews.length}/5 зураг (images)
                          </p>
                        </label>
                      </div>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group overflow-hidden rounded-md border">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover transition-transform duration-200 group-hover:scale-150"
                                style={{
                                  transformOrigin: `${(imageZoomOrigin[index]?.x ?? 50)}% ${(imageZoomOrigin[index]?.y ?? 50)}%`,
                                }}
                                onMouseMove={(event) => handlePreviewMouseMove(index, event)}
                                onMouseLeave={() => handlePreviewMouseLeave(index)}
                              />
                              <div className="absolute left-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => moveImagePreview(index, index - 1)}
                                  className="rounded-full bg-background/80 p-1 shadow"
                                  disabled={index === 0}
                                  title="Move left"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveImagePreview(index, index + 1)}
                                  className="rounded-full bg-background/80 p-1 shadow"
                                  disabled={index === imagePreviews.length - 1}
                                  title="Move right"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={isUploadingImages}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Хаах
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Saving..." 
                  : editingProduct 
                    ? "Save Changes" 
                    : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

