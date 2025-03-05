"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/utils"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { getProducts } from "@/lib/supabase"
import type { Product } from "@/lib/supabase"

interface ProductCarouselProps {
  isOpen: boolean
  onClose: () => void
}

export function ProductCarousel({ isOpen, onClose }: ProductCarouselProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const loadedProducts = await getProducts()
        setProducts(loadedProducts)
      } catch (error) {
        console.error("Error loading products for carousel:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadProducts()
      setQuantity(1) // Reset quantity when opening
    }
  }, [isOpen])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : products.length - 1))
    setQuantity(1) // Reset quantity when changing product
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < products.length - 1 ? prev + 1 : 0))
    setQuantity(1) // Reset quantity when changing product
  }

  const handleAddToCart = () => {
    if (products.length > 0) {
      addToCart(products[currentIndex], quantity)
      onClose()
    }
  }

  const handleQuickSelect = (value: number) => {
    setQuantity(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Carrusel de productos</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="relative">
            <div className="text-center mb-4">
              <h3 className="text-xl font-medium">{products[currentIndex]?.name}</h3>
              <p className="text-lg text-muted-foreground">{formatCurrency(products[currentIndex]?.price)}</p>
              <p className="text-sm text-muted-foreground">Stock: {products[currentIndex]?.stock}</p>
            </div>

            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button variant="outline" onClick={handleNext}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Botones de acceso rápido */}
            <div className="grid grid-cols-4 gap-2 py-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <Button
                  key={num}
                  variant={quantity === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickSelect(num)}
                  className="h-10"
                >
                  {num}
                </Button>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="font-medium">Cantidad: {quantity}</p>
              <p className="font-bold">{formatCurrency(products[currentIndex]?.price * quantity)}</p>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleAddToCart}>Agregar al carrito</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

