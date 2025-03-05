import { getProducts, updateProductStock as updateSupabaseStock } from "@/lib/supabase"

export const products = [
  {
    id: 1,
    name: "Nueces Peladas",
    price: 3500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 50,
  },
  {
    id: 2,
    name: "Almendras",
    price: 4200,
    image: "/placeholder.svg?height=200&width=200",
    stock: 45,
  },
  {
    id: 3,
    name: "Castañas de Cajú",
    price: 3800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 30,
  },
  {
    id: 4,
    name: "Pistachos",
    price: 5000,
    image: "/placeholder.svg?height=200&width=200",
    stock: 25,
  },
  {
    id: 5,
    name: "Avellanas",
    price: 4500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 35,
  },
  {
    id: 6,
    name: "Maní Tostado",
    price: 2200,
    image: "/placeholder.svg?height=200&width=200",
    stock: 100,
  },
  {
    id: 7,
    name: "Mix Tropical",
    price: 3900,
    image: "/placeholder.svg?height=200&width=200",
    stock: 40,
  },
  {
    id: 8,
    name: "Pasas de Uva",
    price: 2800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 60,
  },
  {
    id: 9,
    name: "Arándanos Secos",
    price: 4100,
    image: "/placeholder.svg?height=200&width=200",
    stock: 20,
  },
  {
    id: 10,
    name: "Dátiles",
    price: 3600,
    image: "/placeholder.svg?height=200&width=200",
    stock: 30,
  },
  {
    id: 11,
    name: "Higos Secos",
    price: 3300,
    image: "/placeholder.svg?height=200&width=200",
    stock: 25,
  },
  {
    id: 12,
    name: "Ciruelas Pasas",
    price: 2900,
    image: "/placeholder.svg?height=200&width=200",
    stock: 40,
  },
  {
    id: 13,
    name: "Mix Energético",
    price: 4300,
    image: "/placeholder.svg?height=200&width=200",
    stock: 35,
  },
  {
    id: 14,
    name: "Semillas de Girasol",
    price: 2500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 70,
  },
  {
    id: 15,
    name: "Semillas de Calabaza",
    price: 2700,
    image: "/placeholder.svg?height=200&width=200",
    stock: 55,
  },
  {
    id: 16,
    name: "Semillas de Chía",
    price: 3100,
    image: "/placeholder.svg?height=200&width=200",
    stock: 45,
  },
  {
    id: 17,
    name: "Semillas de Lino",
    price: 2400,
    image: "/placeholder.svg?height=200&width=200",
    stock: 50,
  },
  {
    id: 18,
    name: "Mix Premium",
    price: 4800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 30,
  },
]

// Función para actualizar el stock de un producto
export function updateProductStock(productId: number, quantity: number): void {
  const productIndex = products.findIndex((p) => p.id === productId)
  if (productIndex !== -1) {
    products[productIndex].stock -= quantity
    // Ya no limitamos el stock a 0, permitimos valores negativos

    // Guardar en Supabase
    updateSupabaseStock(productId, products[productIndex].stock).catch((error) =>
      console.error("Error updating stock in Supabase:", error),
    )

    // Guardar el estado actual del stock en localStorage como respaldo
    localStorage.setItem("sabornuts-stock", JSON.stringify(products))
  }
}

// Mejorar la función loadSavedStock para mejor manejo de errores
export async function loadSavedStock(): Promise<void> {
  try {
    // Intentar cargar desde Supabase primero
    const supabaseProducts = await getProducts()

    if (supabaseProducts && supabaseProducts.length > 0) {
      // Actualizar el stock de los productos existentes
      supabaseProducts.forEach((savedProduct) => {
        const productIndex = products.findIndex((p) => p.id === savedProduct.id)
        if (productIndex !== -1) {
          products[productIndex].stock = savedProduct.stock
        }
      })

      // Guardar en localStorage como respaldo
      localStorage.setItem("sabornuts-stock", JSON.stringify(products))
      return
    }
  } catch (error) {
    console.error("Error loading stock from Supabase:", error)
  }

  // Fallback a localStorage si Supabase falla
  const savedStock = localStorage.getItem("sabornuts-stock")
  if (savedStock) {
    try {
      const savedProducts = JSON.parse(savedStock)
      // Actualizar solo el stock de los productos existentes
      savedProducts.forEach((savedProduct: any) => {
        const productIndex = products.findIndex((p) => p.id === savedProduct.id)
        if (productIndex !== -1) {
          products[productIndex].stock = savedProduct.stock
        }
      })
    } catch (e) {
      console.error("Error al cargar el stock guardado", e)
    }
  }
}

// Función para obtener el stock actual de un producto
export function getProductStock(productId: number): number {
  const product = products.find((p) => p.id === productId)
  return product ? product.stock : 0
}

// Función para verificar si hay suficiente stock
export function hasEnoughStock(productId: number, quantity: number): boolean {
  // Siempre retornamos true para permitir agregar productos sin importar el stock
  return true
}

// Función para restaurar el stock (por ejemplo, si se cancela un pedido)
export function restoreProductStock(productId: number, quantity: number): void {
  const productIndex = products.findIndex((p) => p.id === productId)
  if (productIndex !== -1) {
    products[productIndex].stock += quantity

    // Guardar en Supabase
    updateSupabaseStock(productId, products[productIndex].stock).catch((error) =>
      console.error("Error restoring stock in Supabase:", error),
    )

    localStorage.setItem("sabornuts-stock", JSON.stringify(products))
  }
}

// Inicializar cargando el stock guardado
if (typeof window !== "undefined") {
  loadSavedStock().catch((error) => {
    console.error("Error initializing stock:", error)
  })
}

