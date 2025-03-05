"use client"

import { Label } from "@/components/ui/label"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect, useCallback } from "react"
import {
  ShoppingCart,
  Layers,
  History,
  BarChart3,
  LogOut,
  Search,
  Tag,
  Filter,
  ClipboardList,
  PackageOpen,
  Moon,
  Sun,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { QuantitySelector } from "@/components/quantity-selector"
import { Cart } from "@/components/cart"
import { ProductCarousel } from "@/components/product-carousel"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/components/cart-provider"
import { useRouter } from "next/navigation"
import { useVendor } from "@/components/vendor-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { CustomerSelector } from "@/components/customer-selector"
import { ProductManager } from "@/components/product-manager"
import { useTheme } from "next-themes"
import { getProducts, getCategories, supabase } from "@/lib/supabase"
import { clearVendorInfo } from "@/lib/auth"

export default function ProductsPage() {
  const { setCustomerName, customerName, setCustomerAddress, customerAddress, setIsCartOpen, isCartOpen, items } =
    useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isQuantitySelectorOpen, setIsQuantitySelectorOpen] = useState(false)
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; products: number[] }[]>([
    { id: "all", name: "Todos", products: [] },
  ])
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { vendorInfo } = useVendor()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  // Marcar como montado para evitar errores de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cargar productos y categorías
  const loadProductsAndCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log("Loading products and categories...")

      // Cargar productos desde Supabase o fallback
      const loadedProducts = await getProducts()
      console.log(`Loaded ${loadedProducts.length} products`)
      setAllProducts(loadedProducts)

      // Cargar categorías desde Supabase o fallback
      const loadedCategories = await getCategories()
      console.log(`Loaded ${loadedCategories.length} categories`)

      // Crear categorías para la UI
      const uiCategories = [{ id: "all", name: "Todos", products: [] }]

      // Agrupar productos por categoría
      const productsByCategory: Record<string, number[]> = {}

      loadedCategories.forEach((category) => {
        productsByCategory[category.id] = []
      })

      loadedProducts.forEach((product) => {
        if (product.category_id) {
          if (!productsByCategory[product.category_id]) {
            productsByCategory[product.category_id] = []
          }
          productsByCategory[product.category_id].push(product.id)
        }
      })

      // Crear las categorías para la UI
      loadedCategories.forEach((category) => {
        uiCategories.push({
          id: category.id.toString(),
          name: category.name,
          products: productsByCategory[category.id] || [],
        })
      })

      setCategories(uiCategories)

      // Filtrar productos según la categoría activa
      filterProducts(loadedProducts, activeCategory, searchTerm, uiCategories)
    } catch (error) {
      console.error("Error loading products and categories:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos. Usando datos locales.",
        variant: "destructive",
      })

      // Intentar cargar desde localStorage como respaldo
      const savedStock = localStorage.getItem("sabornuts-stock")
      if (savedStock) {
        try {
          const products = JSON.parse(savedStock)
          setAllProducts(products)
          filterProducts(products, activeCategory, searchTerm, categories)
        } catch (e) {
          console.error("Error parsing local stock", e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, activeCategory, categories, searchTerm])

  // Filtrar productos según búsqueda y categoría
  const filterProducts = useCallback(
    (
      productsToFilter: Product[],
      category: string,
      search: string,
      cats: { id: string; name: string; products: number[] }[],
    ) => {
      let result = [...productsToFilter]

      // Filtrar por categoría
      if (category !== "all") {
        const categoryProducts = cats.find((c) => c.id === category)?.products || []
        if (categoryProducts.length > 0) {
          result = result.filter((product) => categoryProducts.includes(product.id))
        }
      }

      // Filtrar por término de búsqueda
      if (search) {
        const term = search.toLowerCase()
        result = result.filter((product) => product.name.toLowerCase().includes(term))
      }

      setFilteredProducts(result)
    },
    [],
  )

  // Cargar productos y configurar suscripción a cambios
  useEffect(() => {
    if (!mounted) return

    console.log("Setting up data loading and subscriptions...")
    loadProductsAndCategories()

    // Configurar suscripción a cambios en productos
    const productsSubscription = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          console.log("Products changed, reloading...")
          loadProductsAndCategories()
        },
      )
      .subscribe()

    // Configurar suscripción a cambios en categorías
    const categoriesSubscription = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        () => {
          console.log("Categories changed, reloading...")
          loadProductsAndCategories()
        },
      )
      .subscribe()

    // Configurar suscripción a cambios en pedidos
    const ordersSubscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          // Notificar al usuario sobre nuevos pedidos
          toast({
            title: "Actualización de pedidos",
            description: "Se han actualizado los pedidos en curso.",
          })
        },
      )
      .subscribe()

    return () => {
      // Limpiar suscripciones al desmontar
      console.log("Cleaning up subscriptions...")
      supabase.removeChannel(productsSubscription)
      supabase.removeChannel(categoriesSubscription)
      supabase.removeChannel(ordersSubscription)
    }
  }, [mounted, toast, loadProductsAndCategories])

  // Filtrar productos cuando cambie la categoría o el término de búsqueda
  useEffect(() => {
    if (!mounted) return
    filterProducts(allProducts, activeCategory, searchTerm, categories)
  }, [searchTerm, activeCategory, allProducts, categories, filterProducts, mounted])

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (mounted && !vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router, mounted])

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(product)
    setIsQuantitySelectorOpen(true)
  }

  const handleLogout = () => {
    clearVendorInfo()
    router.push("/")
  }

  const applyDiscount = () => {
    if (discountPercent <= 0 || discountPercent > 100) {
      toast({
        title: "Error",
        description: "El descuento debe ser entre 1% y 100%",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Descuento aplicado",
      description: `Se ha aplicado un descuento del ${discountPercent}% al total`,
    })

    setIsDiscountDialogOpen(false)
  }

  const saveAddress = () => {
    toast({
      title: "Dirección guardada",
      description: "La dirección del cliente ha sido guardada",
    })
    setIsAddressDialogOpen(false)
  }

  const handleSelectCustomer = (name: string, address: string) => {
    setCustomerName(name)
    setCustomerAddress(address)

    toast({
      title: "Cliente seleccionado",
      description: `${name} ha sido seleccionado`,
    })
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleProductsUpdated = () => {
    // Recargar productos y categorías cuando se actualicen desde el gestor
    loadProductsAndCategories()
  }

  // No renderizar nada hasta que el componente esté montado
  if (!mounted) {
    return null
  }

  // No renderizar si no hay vendedor (redirigirá a login)
  if (!vendorInfo) {
    return null
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl sabornuts-logo">Sabornuts</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCarouselOpen(true)}
                title="Carrusel de productos"
              >
                <Layers className="h-5 w-5" />
                <span className="sr-only">Carrusel de productos</span>
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsCartOpen(!isCartOpen)} className="relative">
                <ShoppingCart className="h-5 w-5" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
                <span className="sr-only">Abrir carrito</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2">
                    {vendorInfo.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/pedidos-en-curso")}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    <span>Pedidos en curso</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/historial")}>
                    <History className="mr-2 h-4 w-4" />
                    <span>Historial de pedidos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/ajuste-stock")}>
                    <PackageOpen className="mr-2 h-4 w-4" />
                    <span>Ajuste de Stock</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/estadisticas")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Estadísticas</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsProductManagerOpen(true)}>
                    <Database className="mr-2 h-4 w-4" />
                    <span>Gestionar Productos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDiscountDialogOpen(true)}>
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Aplicar descuento</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAddressDialogOpen(true)}>
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Dirección de entrega</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Cambiar a modo claro</span>
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Cambiar a modo oscuro</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <CustomerSelector onSelectCustomer={handleSelectCustomer} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-6 w-full justify-start overflow-auto">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          ) : (
            <TabsContent value={activeCategory} className="mt-0">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No se encontraron productos</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden transition-all hover:shadow-md">
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={product.image || "/placeholder.svg?height=200&width=200"}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium line-clamp-1 text-sm">{product.name}</h3>
                          {activeCategory === "all" && product.category_id && (
                            <Badge variant="outline" className="text-xs">
                              {categories.find((c) => c.id === product.category_id?.toString())?.name || ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                          <p className={`text-xs ${product.stock < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                            Stock: {product.stock}
                          </p>
                        </div>
                        <Button onClick={() => handleAddToCart(product)} className="w-full" size="sm">
                          Agregar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {selectedProduct && (
        <QuantitySelector
          product={selectedProduct}
          isOpen={isQuantitySelectorOpen}
          onClose={() => {
            setIsQuantitySelectorOpen(false)
            setSelectedProduct(null)
          }}
        />
      )}

      <Cart />

      <ProductCarousel isOpen={isCarouselOpen} onClose={() => setIsCarouselOpen(false)} />

      {/* Gestor de productos */}
      <ProductManager
        isOpen={isProductManagerOpen}
        onClose={() => setIsProductManagerOpen(false)}
        onProductsUpdated={handleProductsUpdated}
      />

      {/* Diálogo de descuento */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Descuento</DialogTitle>
            <DialogDescription>Ingresa el porcentaje de descuento a aplicar al total del pedido.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Porcentaje"
                min="0"
                max="100"
                value={discountPercent || ""}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
              />
              <span>%</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={applyDiscount}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de dirección */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dirección de Entrega</DialogTitle>
            <DialogDescription>Ingresa la dirección de entrega para este pedido.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-address" className="text-sm font-medium">
                Dirección
              </Label>
              <Input
                id="customer-address"
                placeholder="Calle, número, ciudad, etc."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveAddress}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cierre de sesión */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Sesión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cerrar sesión? Cualquier pedido no finalizado se perderá.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

