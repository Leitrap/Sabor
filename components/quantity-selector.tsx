"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import type { Product } from "@/lib/supabase"

interface QuantitySelectorProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export function QuantitySelector({ product, isOpen, onClose }: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  const handleQuantityChange = (value: string) => {
    const newQuantity = Number.parseInt(value)
    if (!isNaN(newQuantity) && newQuantity > 0) {
      setQuantity(newQuantity)
    }
  }

  const handleQuickSelect = (value: number) => {
    setQuantity(value)
  }

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1)
  }

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    onClose()
    setQuantity(1) // Reset quantity for next time
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar al carrito</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 py-4">
          <div className="w-20 h-20 rounded-md overflow-hidden bg-muted">
            <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
            <p className="text-xs text-muted-foreground">Stock disponible: {product.stock}</p>
          </div>
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

        <div className="flex items-center gap-2 py-2">
          <Button variant="outline" size="icon" onClick={handleDecrement} disabled={quantity <= 1}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button variant="outline" size="icon" onClick={handleIncrement}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium">Total:</span>
          <span className="font-bold">{formatCurrency(product.price * quantity)}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAddToCart}>Agregar al carrito</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

