"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type Product,
  type Category,
} from "@/lib/supabase"
import { Plus, Pencil, Trash2, Tag, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProductManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para el formulario de producto
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false)
  const [productForm, setProductForm] = useState<{
    id?: number
    name: string
    price: number
    image: string
    stock: number
    category_id?: number
  }>({
    name: "",
    price: 0,
    image: "/placeholder.svg?height=200&width=200",
    stock: 0,
  })

  // Estado para el formulario de categoría
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState<{
    id?: number
    name: string
  }>({
    name: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Cargar productos y categorías
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  // Filtrar productos según búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = products.filter((product) => product.name.toLowerCase().includes(term))
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Cargar categorías primero
      const loadedCategories = await getCategories()
      setCategories(loadedCategories)

      // Luego cargar productos
      const loadedProducts = await getProducts()
      setProducts(loadedProducts)
      setFilteredProducts(loadedProducts)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones para gestionar productos
  const handleAddProduct = async () => {
    if (!productForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (productForm.price <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const newProduct = await addProduct({
        name: productForm.name.trim(),
        price: productForm.price,
        image: productForm.image || "/placeholder.svg?height=200&width=200",
        stock: productForm.stock,
        category_id: productForm.category_id,
      })

      if (newProduct) {
        setProducts((prev) => [...prev, newProduct])
        setFilteredProducts((prev) => [...prev, newProduct])
        setIsAddProductOpen(false)
        resetProductForm()

        toast({
          title: "Producto agregado",
          description: `${newProduct.name} ha sido agregado correctamente`,
        })
      }
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el producto. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!productForm.id) return

    if (!productForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (productForm.price <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const updatedProduct = await updateProduct({
        id: productForm.id,
        name: productForm.name.trim(),
        price: productForm.price,
        image: productForm.image || "/placeholder.svg?height=200&width=200",
        stock: productForm.stock,
        category_id: productForm.category_id,
      })

      if (updatedProduct) {
        setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
        setFilteredProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
        setIsEditProductOpen(false)
        resetProductForm()

        toast({
          title: "Producto actualizado",
          description: `${updatedProduct.name} ha sido actualizado correctamente`,
        })
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProductConfirm = async () => {
    if (!productForm.id) return

    setIsLoading(true)
    try {
      await deleteProduct(productForm.id)

      setProducts((prev) => prev.filter((p) => p.id !== productForm.id))
      setFilteredProducts((prev) => prev.filter((p) => p.id !== productForm.id))
      setIsDeleteProductOpen(false)
      resetProductForm()

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones para gestionar categorías
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const newCategory = await addCategory(categoryForm.name.trim())

      if (newCategory) {
        setCategories((prev) => [...prev, newCategory])
        setIsAddCategoryOpen(false)
        resetCategoryForm()

        toast({
          title: "Categoría agregada",
          description: `${newCategory.name} ha sido agregada correctamente`,
        })
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la categoría. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!categoryForm.id) return

    if (!categoryForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const updatedCategory = await updateCategory({
        id: categoryForm.id,
        name: categoryForm.name.trim(),
      })

      if (updatedCategory) {
        setCategories((prev) => prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)))
        setIsEditCategoryOpen(false)
        resetCategoryForm()

        toast({
          title: "Categoría actualizada",
          description: `${updatedCategory.name} ha sido actualizada correctamente`,
        })
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryForm.id) return

    setIsLoading(true)
    try {
      await deleteCategory(categoryForm.id)

      setCategories((prev) => prev.filter((c) => c.id !== categoryForm.id))
      setIsDeleteCategoryOpen(false)
      resetCategoryForm()

      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones auxiliares
  const resetProductForm = () => {
    setProductForm({
      name: "",
      price: 0,
      image: "/placeholder.svg?height=200&width=200",
      stock: 0,
    })
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
    })
  }

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Sin categoría"
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Sin categoría"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Productos y Categorías</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setIsAddProductOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">Cargando productos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron productos que coincidan con la búsqueda"
                      : "No hay productos registrados"}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProductForm({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                stock: product.stock,
                                category_id: product.category_id,
                              })
                              setIsEditProductOpen(true)
                            }}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProductForm({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                stock: product.stock,
                                category_id: product.category_id,
                              })
                              setIsDeleteProductOpen(true)
                            }}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                          <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                          <p className="text-xs text-muted-foreground">
                            Categoría: {getCategoryName(product.category_id)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Categorías</h2>
              <Button onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">Cargando categorías...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No hay categorías registradas</p>
                </div>
              ) : (
                categories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-primary" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCategoryForm({
                                id: category.id,
                                name: category.name,
                              })
                              setIsEditCategoryOpen(true)
                            }}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCategoryForm({
                                id: category.id,
                                name: category.name,
                              })
                              setIsDeleteCategoryOpen(true)
                            }}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Diálogo para agregar producto */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nombre del producto</Label>
              <Input
                id="product-name"
                placeholder="Nombre del producto"
                value={productForm.name}
                onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-price">Precio</Label>
              <Input
                id="product-price"
                type="number"
                placeholder="Precio"
                value={productForm.price}
                onChange={(e) => setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-image">URL de la imagen</Label>
              <Input
                id="product-image"
                placeholder="URL de la imagen"
                value={productForm.image}
                onChange={(e) => setProductForm((prev) => ({ ...prev, image: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-stock">Stock</Label>
              <Input
                id="product-stock"
                type="number"
                placeholder="Stock"
                value={productForm.stock}
                onChange={(e) => setProductForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Categoría</Label>
              <Select
                value={productForm.category_id?.toString() || ""}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, category_id: value ? Number(value) : undefined }))
                }
              >
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAddProduct} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar producto */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Nombre del producto</Label>
              <Input
                id="edit-product-name"
                placeholder="Nombre del producto"
                value={productForm.name}
                onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-price">Precio</Label>
              <Input
                id="edit-product-price"
                type="number"
                placeholder="Precio"
                value={productForm.price}
                onChange={(e) => setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-image">URL de la imagen</Label>
              <Input
                id="edit-product-image"
                placeholder="URL de la imagen"
                value={productForm.image}
                onChange={(e) => setProductForm((prev) => ({ ...prev, image: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-stock">Stock</Label>
              <Input
                id="edit-product-stock"
                type="number"
                placeholder="Stock"
                value={productForm.stock}
                onChange={(e) => setProductForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-category">Categoría</Label>
              <Select
                value={productForm.category_id?.toString() || ""}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, category_id: value ? Number(value) : undefined }))
                }
              >
                <SelectTrigger id="edit-product-category">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProductOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar producto */}
      <AlertDialog open={isDeleteProductOpen} onOpenChange={setIsDeleteProductOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el producto {productForm.name} y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProductConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para agregar categoría */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre de la categoría</Label>
              <Input
                id="category-name"
                placeholder="Nombre de la categoría"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar categoría */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nombre de la categoría</Label>
              <Input
                id="edit-category-name"
                placeholder="Nombre de la categoría"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar categoría */}
      <AlertDialog open={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la categoría {categoryForm.name} y no se puede deshacer. Los
              productos asociados a esta categoría quedarán sin categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategoryConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

