"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { updateProductStock } from "@/lib/supabase"

// Definir la interfaz para un producto
export interface Product {
  id: number
  name: string
  price: number
  image: string
  stock: number
  category_id?: number
}

// Definir la interfaz para un item del carrito
export interface CartItem {
  product: Product
  quantity: number
}

// Definir la interfaz para el contexto del carrito
interface CartContextType {
  items: CartItem[]
  customerName: string
  customerAddress: string
  isCartOpen: boolean
  addToCart: (product: Product, quantity: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  setCustomerName: (name: string) => void
  setCustomerAddress: (address: string) => void
  setIsCartOpen: (isOpen: boolean) => void
  checkStockAvailability: () => {
    hasShortage: boolean
    shortages: { productId: number; name: string; requested: number; available: number }[]
  }
}

// Crear el contexto
const CartContext = createContext<CartContextType | undefined>(undefined)

// Proveedor del contexto
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Cargar carrito desde localStorage al montar el componente
  useEffect(() => {
    setIsClient(true)
    const savedCart = localStorage.getItem("sabornuts-cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error("Error parsing cart from localStorage", e)
        localStorage.removeItem("sabornuts-cart")
      }
    }

    const savedCustomerName = localStorage.getItem("sabornuts-customer-name")
    if (savedCustomerName) {
      setCustomerName(savedCustomerName)
    }

    const savedCustomerAddress = localStorage.getItem("sabornuts-customer-address")
    if (savedCustomerAddress) {
      setCustomerAddress(savedCustomerAddress)
    }
  }, [])

  // Guardar carrito en localStorage cuando cambia
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("sabornuts-cart", JSON.stringify(items))
    }
  }, [items, isClient])

  // Guardar nombre del cliente en localStorage cuando cambia
  useEffect(() => {
    if (isClient && customerName) {
      localStorage.setItem("sabornuts-customer-name", customerName)
    }
  }, [customerName, isClient])

  // Guardar dirección del cliente en localStorage cuando cambia
  useEffect(() => {
    if (isClient && customerAddress) {
      localStorage.setItem("sabornuts-customer-address", customerAddress)
    }
  }, [customerAddress, isClient])

  // Función para agregar un producto al carrito
  const addToCart = (product: Product, quantity: number) => {
    setItems((prevItems) => {
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = prevItems.findIndex((item) => item.product.id === product.id)

      if (existingItemIndex !== -1) {
        // Si el producto ya está en el carrito, actualizar la cantidad
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        }
        return updatedItems
      } else {
        // Si el producto no está en el carrito, agregarlo
        return [...prevItems, { product, quantity }]
      }
    })
  }

  // Función para eliminar un producto del carrito
  const removeFromCart = (productId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  // Función para actualizar la cantidad de un producto en el carrito
  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item)),
    )
  }

  // Función para limpiar el carrito
  const clearCart = () => {
    // Actualizar el stock en la base de datos
    items.forEach((item) => {
      const newStock = Math.max(0, item.product.stock - item.quantity)
      updateProductStock(item.product.id, newStock).catch((error) => {
        console.error(`Error updating stock for product ${item.product.id}:`, error)
      })
    })

    // Limpiar el carrito
    setItems([])
  }

  // Función para calcular el total del carrito
  const getTotal = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  // Función para verificar disponibilidad de stock
  const checkStockAvailability = () => {
    const shortages = items
      .filter((item) => item.quantity > item.product.stock)
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

  // Solo renderizar los hijos cuando estamos en el cliente
  // Esto evita errores de hidratación
  return (
    <CartContext.Provider
      value={{
        items,
        customerName,
        customerAddress,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        setCustomerName,
        setCustomerAddress,
        setIsCartOpen,
        checkStockAvailability,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart debe ser usado dentro de un CartProvider")
  }
  return context
}

