"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Save, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useVendor } from "@/components/vendor-provider"
import { getProducts, updateProductStock, type Product } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

export default function AjusteStockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [stockChanges, setStockChanges] = useState<Record<number, number>>({})
  const router = useRouter()
  const { toast } = useToast()
  const { vendorInfo } = useVendor()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const loadedProducts = await getProducts()
        setProducts(loadedProducts)
        setFilteredProducts(loadedProducts)
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [toast])

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

  const handleStockChange = (productId: number, newStock: string) => {
    const stock = Number.parseInt(newStock)
    if (!isNaN(stock) && stock >= 0) {
      setStockChanges((prev) => ({
        ...prev,
        [productId]: stock,
      }))
    }
  }

  const handleSaveChanges = async () => {
    if (Object.keys(stockChanges).length === 0) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios de stock para guardar",
      })
      return
    }

    setIsSaving(true)
    try {
      // Guardar cambios en Supabase
      const promises = Object.entries(stockChanges).map(([productId, newStock]) =>
        updateProductStock(Number.parseInt(productId), newStock),
      )

      await Promise.all(promises)

      // Actualizar productos locales
      const updatedProducts = products.map((product) => {
        if (stockChanges[product.id] !== undefined) {
          return {
            ...product,
            stock: stockChanges[product.id],
          }
        }
        return product
      })

      setProducts(updatedProducts)
      setFilteredProducts(
        updatedProducts.filter((product) => {
          if (!searchTerm.trim()) return true
          return product.name.toLowerCase().includes(searchTerm.toLowerCase())
        }),
      )

      setStockChanges({})

      toast({
        title: "Stock actualizado",
        description: "Los cambios de stock han sido guardados correctamente",
      })
    } catch (error) {
      console.error("Error saving stock changes:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios de stock",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetChanges = () => {
    setStockChanges({})
    toast({
      title: "Cambios descartados",
      description: "Los cambios de stock han sido descartados",
    })
  }

  if (!vendorInfo) {
    return null
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ajuste de Stock</h1>
        <Button variant="outline" onClick={() => router.push("/productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full md:w-80"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handleResetChanges}
            disabled={Object.keys(stockChanges).length === 0 || isSaving}
            className="w-full md:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Descartar cambios
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={Object.keys(stockChanges).length === 0 || isSaving}
            className="w-full md:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? "No se encontraron productos que coincidan con la búsqueda" : "No hay productos disponibles"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const currentStock = stockChanges[product.id] !== undefined ? stockChanges[product.id] : product.stock
            const hasChanged = stockChanges[product.id] !== undefined

            return (
              <Card key={product.id} className={hasChanged ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
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
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Precio: {formatCurrency(product.price)}</p>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`stock-${product.id}`} className="text-sm">
                          Stock:
                        </Label>
                        <Input
                          id={`stock-${product.id}`}
                          type="number"
                          min="0"
                          value={currentStock}
                          onChange={(e) => handleStockChange(product.id, e.target.value)}
                          className={hasChanged ? "border-primary" : ""}
                        />
                        {hasChanged && (
                          <p className="text-xs text-primary">
                            Cambio pendiente: {product.stock} → {currentStock}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}

