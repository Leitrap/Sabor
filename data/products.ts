import type { Product } from "@/lib/supabase"

// Productos predefinidos para usar como respaldo
export const products: Product[] = [
  {
    id: 1,
    name: "Almendras",
    price: 2500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 50,
    category_id: 1,
  },
  {
    id: 2,
    name: "Nueces",
    price: 2200,
    image: "/placeholder.svg?height=200&width=200",
    stock: 45,
    category_id: 1,
  },
  {
    id: 3,
    name: "Pasas de uva",
    price: 1800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 60,
    category_id: 2,
  },
  {
    id: 4,
    name: "Semillas de girasol",
    price: 1500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 70,
    category_id: 3,
  },
  {
    id: 5,
    name: "Mix energético",
    price: 2800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 40,
    category_id: 4,
  },
  {
    id: 6,
    name: "Pistachos",
    price: 3200,
    image: "/placeholder.svg?height=200&width=200",
    stock: 35,
    category_id: 1,
  },
  {
    id: 7,
    name: "Dátiles",
    price: 2100,
    image: "/placeholder.svg?height=200&width=200",
    stock: 55,
    category_id: 2,
  },
  {
    id: 8,
    name: "Semillas de chía",
    price: 1700,
    image: "/placeholder.svg?height=200&width=200",
    stock: 65,
    category_id: 3,
  },
]

// Función para cargar el stock guardado desde localStorage
export function loadSavedStock() {
  if (typeof window === "undefined") return

  try {
    const savedStock = localStorage.getItem("sabornuts-stock")
    if (!savedStock) {
      // Si no hay stock guardado, guardar los productos predefinidos
      localStorage.setItem("sabornuts-stock", JSON.stringify(products))
      console.log("Initialized default products in localStorage")
    } else {
      console.log("Found existing products in localStorage")
    }
  } catch (error) {
    console.error("Error loading saved stock:", error)
    // En caso de error, intentar guardar los productos predefinidos
    try {
      localStorage.setItem("sabornuts-stock", JSON.stringify(products))
    } catch (e) {
      console.error("Error saving default products to localStorage:", e)
    }
  }
}

