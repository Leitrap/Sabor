"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { hasEnoughStock, updateProductStock, restoreProductStock } from "@/data/products"

export type Product = {
  id: number
  name: string
  price: number
  image: string
  stock: number
}

export type CartItem = {
  product: Product
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  customerName: string
  customerAddress: string
  setCustomerName: (name: string) => void
  setCustomerAddress: (address: string) => void
  addToCart: (product: Product, quantity: number) => boolean
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
  checkStockAvailability: () => {
    hasShortage: boolean
    shortages: { productId: number; name: string; requested: number; available: number }[]
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { toast } = useToast()

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("sabornuts-cart")
    const savedCustomerName = localStorage.getItem("sabornuts-customer")
    const savedCustomerAddress = localStorage.getItem("sabornuts-customer-address")

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error("Failed to parse saved cart", e)
      }
    }

    if (savedCustomerName) {
      setCustomerName(savedCustomerName)
    }

    if (savedCustomerAddress) {
      setCustomerAddress(savedCustomerAddress)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sabornuts-cart", JSON.stringify(items))
  }, [items])

  // Save customer name to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sabornuts-customer", customerName)
  }, [customerName])

  // Save customer address to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sabornuts-customer-address", customerAddress)
  }, [customerAddress])

  const addToCart = (product: Product, quantity: number) => {
    // Verificar si hay suficiente stock - AHORA SOLO ADVIERTE PERO PERMITE AGREGAR
    if (!hasEnoughStock(product.id, quantity)) {
      toast({
        title: "Stock insuficiente",
        description: `Solo quedan ${product.stock} unidades de ${product.name}. Se agregará al carrito de todas formas.`,
        variant: "warning",
      })
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id)

      // Actualizar el stock
      updateProductStock(product.id, quantity)

      // Actualizar el carrito
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        return [...prevItems, { product, quantity }]
      }
    })

    toast({
      title: "Producto agregado",
      description: `${quantity} x ${product.name} agregado al carrito`,
    })

    return true
  }

  const removeFromCart = (productId: number) => {
    // Restaurar el stock antes de eliminar del carrito
    const itemToRemove = items.find((item) => item.product.id === productId)
    if (itemToRemove) {
      restoreProductStock(productId, itemToRemove.quantity)
    }

    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === productId)

      if (!existingItem) return prevItems

      // Restaurar el stock anterior
      restoreProductStock(productId, existingItem.quantity)

      // Actualizar el stock con la nueva cantidad
      updateProductStock(productId, newQuantity)

      // Actualizar el carrito
      return prevItems.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item))
    })
  }

  const clearCart = () => {
    // Restaurar todo el stock antes de limpiar el carrito
    items.forEach((item) => {
      restoreProductStock(item.product.id, item.quantity)
    })

    setItems([])
  }

  const getTotal = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const checkStockAvailability = () => {
    const shortages = items
      .filter((item) => !hasEnoughStock(item.product.id, item.quantity))
      .map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        requested: item.quantity,
        available: item.product.stock,
      }))

    return {
      hasShortage: shortages.length > 0,
      shortages,
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        customerName,
        customerAddress,
        setCustomerName,
        setCustomerAddress,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        isCartOpen,
        setIsCartOpen,
        checkStockAvailability,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

