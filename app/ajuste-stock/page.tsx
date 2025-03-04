"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"
import { useVendor } from "@/components/vendor-provider"
import { products, loadSavedStock } from "@/data/products"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

export default function AjusteStockPage() {
  const [productStock, setProductStock] = useState<{ id: number; stock: number }[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { vendorInfo } = useVendor()
  const { toast } = useToast()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  // Cargar el stock actual
  useEffect(() => {
    loadSavedStock()
    setProductStock(
      products.map((product) => ({
        id: product.id,
        stock: product.stock,
      })),
    )
  }, [])

  // Filtrar productos según búsqueda
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true
    return product.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleStockChange = (productId: number, newStock: string) => {
    const stockValue = Number.parseInt(newStock) >= 0 ? Number.parseInt(newStock) : 0

    setProductStock((prev) => prev.map((item) => (item.id === productId ? { ...item, stock: stockValue } : item)))
  }

  const saveStockChanges = () => {
    // Actualizar el stock en los productos
    productStock.forEach((item) => {
      const productIndex = products.findIndex((p) => p.id === item.id)
      if (productIndex !== -1) {
        products[productIndex].stock = item.stock
      }
    })

    // Guardar en localStorage
    localStorage.setItem("sabornuts-stock", JSON.stringify(products))

    toast({
      title: "Stock actualizado",
      description: "Los cambios en el inventario han sido guardados",
    })
  }

  const resetStock = () => {
    // Restablecer todos los productos a un stock de 100
    const resetValues = products.map((product) => ({
      id: product.id,
      stock: 100,
    }))

    setProductStock(resetValues)

    toast({
      title: "Stock restablecido",
      description: "Todos los productos tienen ahora 100 unidades de stock",
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

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          <Button onClick={saveStockChanges} className="flex-1 sm:flex-none">
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </Button>
          <Button variant="outline" onClick={resetStock} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            Restablecer (100)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const stockItem = productStock.find((item) => item.id === product.id)
          const currentStock = stockItem ? stockItem.stock : product.stock

          return (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="text-sm text-muted-foreground">{formatCurrency(product.price)}</div>
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
                    <label htmlFor={`stock-${product.id}`} className="block text-sm font-medium mb-1">
                      Stock actual
                    </label>
                    <Input
                      id={`stock-${product.id}`}
                      type="number"
                      min="0"
                      value={currentStock}
                      onChange={(e) => handleStockChange(product.id, e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}

