"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type Product, useCart } from "@/components/cart-provider"

export function QuantitySelector({
  product,
  isOpen,
  onClose,
}: {
  product: Product
  isOpen: boolean
  onClose: () => void
}) {
  const [quantity, setQuantity] = useState("1")
  const { addToCart } = useCart()

  const handleQuantityChange = (value: string) => {
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setQuantity(value)
    }
  }

  const handleQuickSelect = (num: number) => {
    setQuantity(num.toString())
  }

  const handleAddToCart = () => {
    const parsedQuantity = Number.parseInt(quantity) || 1
    addToCart(product, parsedQuantity)
    setQuantity("1") // Reset quantity
    onClose()
  }

  const quickSelectButtons = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md scale-in">
        <DialogHeader>
          <DialogTitle>Seleccionar cantidad</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">{product.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="text-center text-lg"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickSelectButtons.map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => handleQuickSelect(num)}
                className={quantity === num.toString() ? "bg-primary text-primary-foreground" : ""}
              >
                {num}
              </Button>
            ))}
          </div>

          <Button onClick={handleAddToCart} className="mt-2">
            Agregar al carrito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

