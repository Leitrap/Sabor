"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { QuantitySelector } from "@/components/quantity-selector"
import { Cart } from "@/components/cart"
import { ProductCarousel } from "@/components/product-carousel"
import { useCart } from "@/components/cart-provider"
import { products, loadSavedStock } from "@/data/products"
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

// Categorías de productos
const categories = [
  { id: "all", name: "Todos" },
  { id: "nuts", name: "Frutos Secos", products: [1, 2, 3, 4, 5, 6] },
  { id: "dried", name: "Frutas Secas", products: [8, 9, 10, 11, 12] },
  { id: "seeds", name: "Semillas", products: [14, 15, 16, 17] },
  { id: "mixes", name: "Mezclas", products: [7, 13, 18] },
]

export default function ProductsPage() {
  const { setCustomerName, customerName, setCustomerAddress, customerAddress, setIsCartOpen, isCartOpen, items } =
    useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isQuantitySelectorOpen, setIsQuantitySelectorOpen] = useState(false)
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const router = useRouter()
  const { vendorInfo, clearVendorInfo } = useVendor()
  const { toast } = useToast()

  // Cargar el stock guardado
  useEffect(() => {
    loadSavedStock()
  }, [])

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  // Filtrar productos según búsqueda y categoría
  useEffect(() => {
    let result = [...products]

    // Filtrar por categoría
    if (activeCategory !== "all") {
      const categoryProducts = categories.find((c) => c.id === activeCategory)?.products || []
      if (categoryProducts.length > 0) {
        result = result.filter((product) => categoryProducts.includes(product.id))
      }
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((product) => product.name.toLowerCase().includes(term))
    }

    setFilteredProducts(result)
  }, [searchTerm, activeCategory])

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

  if (!vendorInfo) {
    return null // No renderizar nada si no hay vendedor (redirigirá a login)
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl sabornuts-logo text-primary">Sabornuts</h1>
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
                  <DropdownMenuItem onClick={() => setIsDiscountDialogOpen(true)}>
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Aplicar descuento</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAddressDialogOpen(true)}>
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Dirección de entrega</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      document.documentElement.classList.toggle("dark")
                    }}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Cambiar a modo oscuro</span>
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
        <Tabs defaultValue="all" onValueChange={setActiveCategory}>
          <TabsList className="mb-6 w-full justify-start overflow-auto">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
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
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium line-clamp-1 text-sm">{product.name}</h3>
                          {category.id !== "all" && (
                            <Badge variant="outline" className="text-xs">
                              {categories.find((c) => c.products?.includes(product.id))?.name || ""}
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
          ))}
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
              <label htmlFor="customer-address" className="text-sm font-medium">
                Dirección
              </label>
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

