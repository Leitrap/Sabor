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
    }
  }, [isOpen])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : products.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < products.length - 1 ? prev + 1 : 0))
  }

  const handleAddToCart = () => {
    if (products.length > 0) {
      addToCart(products[currentIndex], 1)
    }
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
            <div className="aspect-square overflow-hidden bg-muted rounded-md">
              <img
                src={products[currentIndex]?.image || "/placeholder.svg"}
                alt={products[currentIndex]?.name}
                className="w-full h-full object-cover"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="mt-4 text-center">
              <h3 className="font-medium">{products[currentIndex]?.name}</h3>
              <p className="text-muted-foreground">{formatCurrency(products[currentIndex]?.price)}</p>
              <p className="text-sm text-muted-foreground">Stock: {products[currentIndex]?.stock}</p>

              <Button onClick={handleAddToCart} className="mt-4" disabled={products[currentIndex]?.stock <= 0}>
                Agregar al carrito
              </Button>
            </div>

            <div className="flex justify-center mt-4">
              <div className="flex gap-1">
                {products.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-primary" : "bg-muted"}`}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

