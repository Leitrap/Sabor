"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react"

export function Cart() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getTotal, customerName } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    if (items.length === 0) return

    if (!customerName) {
      alert("Por favor, ingrese el nombre del cliente antes de continuar.")
      return
    }

    setIsCartOpen(false)
    router.push("/resumen")
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Carrito de compra
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">El carrito está vacío</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-4 border-b pb-4">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatCurrency(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-7 w-7 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">{formatCurrency(getTotal())}</span>
            </div>
            <Button onClick={handleCheckout} disabled={items.length === 0} className="w-full">
              Finalizar compra
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

