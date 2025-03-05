import { createClient } from "@supabase/supabase-js"

// Creamos el cliente de Supabase con las variables de entorno
// Estas variables se configurarán en Vercel
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
)

// Tipos para nuestras tablas en Supabase
export type Product = {
  id: number
  name: string
  price: number
  image: string
  stock: number
  category_id?: number
}

export type Category = {
  id: number
  name: string
}

export type Customer = {
  id: string
  name: string
  address: string
  created_at?: string
}

export type OrderItem = {
  id?: string
  order_id?: string
  product_id: number
  product_name: string
  price: number
  quantity: number
}

export type Order = {
  id: string
  date: string
  customer_name: string
  customer_address: string
  vendor_name: string
  store_location?: string
  total: number
  discount: number
  final_total: number
  status: "pendiente" | "preparando" | "listo" | "entregado"
  notes?: string
  items: OrderItem[]
}

// Datos de productos predefinidos para usar como fallback
const defaultProducts: Product[] = [
  {
    id: 1,
    name: "Almendras",
    price: 3500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 50,
    category_id: 1,
  },
  {
    id: 2,
    name: "Nueces",
    price: 3200,
    image: "/placeholder.svg?height=200&width=200",
    stock: 45,
    category_id: 1,
  },
  {
    id: 3,
    name: "Castañas de Cajú",
    price: 2800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 30,
    category_id: 1,
  },
  {
    id: 4,
    name: "Pasas de Uva",
    price: 1800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 60,
    category_id: 2,
  },
  {
    id: 5,
    name: "Dátiles",
    price: 2200,
    image: "/placeholder.svg?height=200&width=200",
    stock: 40,
    category_id: 2,
  },
  {
    id: 6,
    name: "Semillas de Girasol",
    price: 1500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 70,
    category_id: 3,
  },
  {
    id: 7,
    name: "Semillas de Chía",
    price: 1900,
    image: "/placeholder.svg?height=200&width=200",
    stock: 55,
    category_id: 3,
  },
  {
    id: 8,
    name: "Mix Energético",
    price: 2500,
    image: "/placeholder.svg?height=200&width=200",
    stock: 35,
    category_id: 4,
  },
  {
    id: 9,
    name: "Mix Tropical",
    price: 2700,
    image: "/placeholder.svg?height=200&width=200",
    stock: 25,
    category_id: 4,
  },
  {
    id: 10,
    name: "Pistachos",
    price: 4000,
    image: "/placeholder.svg?height=200&width=200",
    stock: 20,
    category_id: 1,
  },
  {
    id: 11,
    name: "Avellanas",
    price: 3800,
    image: "/placeholder.svg?height=200&width=200",
    stock: 15,
    category_id: 1,
  },
  {
    id: 12,
    name: "Ciruelas Pasas",
    price: 2000,
    image: "/placeholder.svg?height=200&width=200",
    stock: 45,
    category_id: 2,
  },
]

// Categorías predefinidas para usar como fallback
const defaultCategories: Category[] = [
  { id: 1, name: "Frutos Secos" },
  { id: 2, name: "Frutas Secas" },
  { id: 3, name: "Semillas" },
  { id: 4, name: "Mezclas" },
]

// Funciones para productos
export async function getProducts(): Promise<Product[]> {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are not set, using default products")
      return defaultProducts
    }

    const { data, error } = await supabase.from("products").select("*").order("id")

    if (error) {
      console.error("Error fetching products from Supabase:", error)
      throw error
    }

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      if (typeof window !== "undefined") {
        localStorage.setItem("sabornuts-stock", JSON.stringify(data))
      }
      return data
    } else {
      console.warn("No products found in Supabase, using default products")
      return defaultProducts
    }
  } catch (e) {
    console.error("Error in getProducts:", e)
  }

  // Fallback a localStorage si hay error
  if (typeof window !== "undefined") {
    const savedStock = localStorage.getItem("sabornuts-stock")
    if (savedStock) {
      try {
        return JSON.parse(savedStock)
      } catch (e) {
        console.error("Error parsing local stock", e)
      }
    }
  }

  // Si todo falla, devolver los productos predefinidos
  console.warn("Using default products as fallback")
  return defaultProducts
}

export async function updateProductStock(productId: number, newStock: number): Promise<void> {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are not set, updating only local storage")
      updateLocalStock(productId, newStock)
      return
    }

    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", productId)

    if (error) {
      console.error("Error updating product stock in Supabase:", error)
      throw error
    }

    // Actualizar localStorage como respaldo
    updateLocalStock(productId, newStock)
  } catch (e) {
    console.error("Error in updateProductStock:", e)
    // Actualizar solo localStorage si falla Supabase
    updateLocalStock(productId, newStock)
  }
}

function updateLocalStock(productId: number, newStock: number): void {
  if (typeof window === "undefined") return

  const savedStock = localStorage.getItem("sabornuts-stock")
  if (savedStock) {
    try {
      const products = JSON.parse(savedStock)
      const productIndex = products.findIndex((p: Product) => p.id === productId)
      if (productIndex !== -1) {
        products[productIndex].stock = newStock
        localStorage.setItem("sabornuts-stock", JSON.stringify(products))
      }
    } catch (e) {
      console.error("Error updating local stock", e)
    }
  }
}

export async function addProduct(product: Omit<Product, "id">): Promise<Product | null> {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are not set, adding product only to local storage")
      return addProductToLocalStorage(product)
    }

    // Obtener el último ID para asignar uno nuevo
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)

    const newId = existingProducts && existingProducts.length > 0 ? existingProducts[0].id + 1 : 1

    const newProduct = {
      ...product,
      id: newId,
    }

    const { data, error } = await supabase.from("products").insert(newProduct).select()

    if (error) {
      console.error("Error adding product to Supabase:", error)
      throw error
    }

    // Actualizar localStorage
    addProductToLocalStorage(newProduct)

    return data?.[0] || newProduct
  } catch (e) {
    console.error("Error in addProduct:", e)
    return addProductToLocalStorage(product)
  }
}

function addProductToLocalStorage(product: Omit<Product, "id"> | Product): Product {
  if (typeof window === "undefined") {
    return product as Product
  }

  const savedStock = localStorage.getItem("sabornuts-stock")
  let products: Product[] = []

  if (savedStock) {
    try {
      products = JSON.parse(savedStock)
    } catch (e) {
      console.error("Error parsing local stock", e)
    }
  }

  // Si el producto ya tiene ID, usarlo, de lo contrario generar uno nuevo
  const newProduct =
    "id" in product
      ? (product as Product)
      : {
          ...product,
          id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
        }

  products.push(newProduct)
  localStorage.setItem("sabornuts-stock", JSON.stringify(products))

  return newProduct
}

export async function updateProduct(product: Product): Promise<Product | null> {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are not set, updating product only in local storage")
      return updateProductInLocalStorage(product)
    }

    const { data, error } = await supabase.from("products").update(product).eq("id", product.id).select()

    if (error) {
      console.error("Error updating product in Supabase:", error)
      throw error
    }

    // Actualizar localStorage
    updateProductInLocalStorage(product)

    return data?.[0] || product
  } catch (e) {
    console.error("Error in updateProduct:", e)
    return updateProductInLocalStorage(product)
  }
}

function updateProductInLocalStorage(product: Product): Product {
  if (typeof window === "undefined") {
    return product
  }

  const savedStock = localStorage.getItem("sabornuts-stock")
  if (savedStock) {
    try {
      const products = JSON.parse(savedStock)
      const productIndex = products.findIndex((p: Product) => p.id === product.id)
      if (productIndex !== -1) {
        products[productIndex] = product
        localStorage.setItem("sabornuts-stock", JSON.stringify(products))
      }
    } catch (e) {
      console.error("Error updating local product", e)
    }
  }

  return product
}

export async function deleteProduct(productId: number): Promise<void> {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are not set, deleting product only from local storage")
      deleteProductFromLocalStorage(productId)
      return
    }

    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      console.error("Error deleting product from Supabase:", error)
      throw error
    }

    // Actualizar localStorage
    deleteProductFromLocalStorage(productId)
  } catch (e) {
    console.error("Error in deleteProduct:", e)
    deleteProductFromLocalStorage(productId)
  }
}

function deleteProductFromLocalStorage(productId: number): void {
  if (typeof window === "undefined") return

  const savedStock = localStorage.getItem("sabornuts-stock")
  if (savedStock) {
    try {
      const products = JSON.parse(savedStock)
      const updatedProducts = products.filter((p: Product) => p.id !== productId)
      localStorage.setItem("sabornuts-stock", JSON.stringify(updatedProducts))
    } catch (e) {
      console.error("Error deleting local product", e)
    }
  }
}

// Funciones para categorías
export async function getCategories(): Promise<Category[]> {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are not set, using default categories")
      return defaultCategories
    }

    const { data, error } = await supabase.from("categories").select("*").order("id")

    if (error) {
      console.error("Error fetching categories from Supabase:", error)
      throw error
    }

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      if (typeof window !== "undefined") {
        localStorage.setItem("sabornuts-categories", JSON.stringify(data))
      }
      return data
    } else {
      console.warn("No categories found in Supabase, using default categories")
      return defaultCategories
    }
  } catch (e) {
    console.error("Error in getCategories:", e)
  }

  // Fallback a localStorage
  if (typeof window !== "undefined") {
    const savedCategories = localStorage.getItem("sabornuts-categories")
    if (savedCategories) {
      try {
        return JSON.parse(savedCategories)
      } catch (e) {
        console.error("Error parsing local categories", e)
      }
    }
  }

  // Categorías por defecto
  console.warn("Using default categories as fallback")
  return defaultCategories
}

export async function addCategory(name: string): Promise<Category | null> {
  try {
    // Obtener el último ID para asignar uno nuevo
    const { data: existingCategories } = await supabase
      .from("categories")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)

    const newId = existingCategories && existingCategories.length > 0 ? existingCategories[0].id + 1 : 1

    const newCategory = { id: newId, name }

    const { data, error } = await supabase.from("categories").insert(newCategory).select()

    if (error) throw error

    // Actualizar localStorage
    const savedCategories = localStorage.getItem("sabornuts-categories")
    let categories = []
    if (savedCategories) {
      try {
        categories = JSON.parse(savedCategories)
      } catch (e) {
        console.error("Error parsing local categories", e)
      }
    }
    categories.push(newCategory)
    localStorage.setItem("sabornuts-categories", JSON.stringify(categories))

    return data?.[0] || newCategory
  } catch (e) {
    console.error("Error adding category:", e)
    return null
  }
}

export async function updateCategory(category: Category): Promise<Category | null> {
  try {
    const { data, error } = await supabase.from("categories").update(category).eq("id", category.id).select()

    if (error) throw error

    // Actualizar localStorage
    const savedCategories = localStorage.getItem("sabornuts-categories")
    if (savedCategories) {
      try {
        const categories = JSON.parse(savedCategories)
        const categoryIndex = categories.findIndex((c: Category) => c.id === category.id)
        if (categoryIndex !== -1) {
          categories[categoryIndex] = category
          localStorage.setItem("sabornuts-categories", JSON.stringify(categories))
        }
      } catch (e) {
        console.error("Error updating local category", e)
      }
    }

    return data?.[0] || category
  } catch (e) {
    console.error("Error updating category:", e)
    return null
  }
}

export async function deleteCategory(categoryId: number): Promise<void> {
  try {
    const { error } = await supabase.from("categories").delete().eq("id", categoryId)

    if (error) throw error

    // Actualizar localStorage
    const savedCategories = localStorage.getItem("sabornuts-categories")
    if (savedCategories) {
      try {
        const categories = JSON.parse(savedCategories)
        const updatedCategories = categories.filter((c: Category) => c.id !== categoryId)
        localStorage.setItem("sabornuts-categories", JSON.stringify(updatedCategories))
      } catch (e) {
        console.error("Error deleting local category", e)
      }
    }
  } catch (e) {
    console.error("Error deleting category:", e)
  }
}

// Funciones para clientes
export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase.from("customers").select("*").order("name")

    if (error) throw error

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      localStorage.setItem("sabornuts-customers", JSON.stringify(data))
      return data
    }
  } catch (e) {
    console.error("Error fetching customers:", e)
  }

  // Fallback a localStorage
  const savedCustomers = localStorage.getItem("sabornuts-customers")
  if (savedCustomers) {
    try {
      return JSON.parse(savedCustomers)
    } catch (e) {
      console.error("Error parsing local customers", e)
    }
  }

  return []
}

export async function addCustomer(customer: Customer): Promise<Customer | null> {
  try {
    const { data, error } = await supabase.from("customers").insert(customer).select()

    if (error) throw error

    // Actualizar localStorage
    const savedCustomers = localStorage.getItem("sabornuts-customers")
    let customers = []
    if (savedCustomers) {
      try {
        customers = JSON.parse(savedCustomers)
      } catch (e) {
        console.error("Error parsing local customers", e)
      }
    }
    customers.push(customer)
    localStorage.setItem("sabornuts-customers", JSON.stringify(customers))

    return data?.[0] || customer
  } catch (e) {
    console.error("Error adding customer:", e)

    // Fallback a localStorage
    const savedCustomers = localStorage.getItem("sabornuts-customers")
    let customers = []
    if (savedCustomers) {
      try {
        customers = JSON.parse(savedCustomers)
      } catch (e) {
        console.error("Error parsing local customers", e)
      }
    }
    customers.push(customer)
    localStorage.setItem("sabornuts-customers", JSON.stringify(customers))

    return customer
  }
}

export async function updateCustomer(customer: Customer): Promise<Customer | null> {
  try {
    const { data, error } = await supabase.from("customers").update(customer).eq("id", customer.id).select()

    if (error) throw error

    // Actualizar localStorage
    const savedCustomers = localStorage.getItem("sabornuts-customers")
    if (savedCustomers) {
      try {
        const customers = JSON.parse(savedCustomers)
        const customerIndex = customers.findIndex((c: Customer) => c.id === customer.id)
        if (customerIndex !== -1) {
          customers[customerIndex] = customer
          localStorage.setItem("sabornuts-customers", JSON.stringify(customers))
        }
      } catch (e) {
        console.error("Error updating local customer", e)
      }
    }

    return data?.[0] || customer
  } catch (e) {
    console.error("Error updating customer:", e)

    // Fallback a localStorage
    const savedCustomers = localStorage.getItem("sabornuts-customers")
    if (savedCustomers) {
      try {
        const customers = JSON.parse(savedCustomers)
        const customerIndex = customers.findIndex((c: Customer) => c.id === customer.id)
        if (customerIndex !== -1) {
          customers[customerIndex] = customer
          localStorage.setItem("sabornuts-customers", JSON.stringify(customers))
        }
      } catch (e) {
        console.error("Error updating local customer", e)
      }
    }

    return customer
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    const { error } = await supabase.from("customers").delete().eq("id", customerId)

    if (error) throw error

    // Actualizar localStorage
    const savedCustomers = localStorage.getItem("sabornuts-customers")
    if (savedCustomers) {
      try {
        const customers = JSON.parse(savedCustomers)
        const updatedCustomers = customers.filter((c: Customer) => c.id !== customerId)
        localStorage.setItem("sabornuts-customers", JSON.stringify(updatedCustomers))
      } catch (e) {
        console.error("Error deleting local customer", e)
      }
    }
  } catch (e) {
    console.error("Error deleting customer:", e)

    // Fallback a localStorage
    const savedCustomers = localStorage.getItem("sabornuts-customers")
    if (savedCustomers) {
      try {
        const customers = JSON.parse(savedCustomers)
        const updatedCustomers = customers.filter((c: Customer) => c.id !== customerId)
        localStorage.setItem("sabornuts-customers", JSON.stringify(updatedCustomers))
      } catch (e) {
        console.error("Error deleting local customer", e)
      }
    }
  }
}

// Funciones para pedidos
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .order("date", { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      localStorage.setItem("sabornuts-order-history", JSON.stringify(data))
      return data
    }
  } catch (e) {
    console.error("Error fetching orders:", e)
  }

  // Fallback a localStorage
  const savedOrders = localStorage.getItem("sabornuts-order-history")
  if (savedOrders) {
    try {
      return JSON.parse(savedOrders)
    } catch (e) {
      console.error("Error parsing local orders", e)
    }
  }

  return []
}

export async function getPendingOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .not("status", "eq", "entregado")
      .order("date", { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      localStorage.setItem("sabornuts-pending-orders", JSON.stringify(data))
      return data
    }
  } catch (e) {
    console.error("Error fetching pending orders:", e)
  }

  // Fallback a localStorage
  const savedPendingOrders = localStorage.getItem("sabornuts-pending-orders")
  if (savedPendingOrders) {
    try {
      return JSON.parse(savedPendingOrders)
    } catch (e) {
      console.error("Error parsing local pending orders", e)
    }
  }

  return []
}

export async function addOrder(order: Order): Promise<Order | null> {
  try {
    // Primero insertamos el pedido
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        id: order.id,
        date: order.date,
        customer_name: order.customer_name,
        customer_address: order.customer_address,
        vendor_name: order.vendor_name,
        store_location: order.store_location,
        total: order.total,
        discount: order.discount,
        final_total: order.final_total,
        status: order.status,
        notes: order.notes,
      })
      .select()

    if (orderError) throw orderError

    // Luego insertamos los items del pedido
    const orderItems = order.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) throw itemsError

    // Guardar en localStorage como respaldo
    saveOrderToLocalStorage(order)

    return orderData?.[0] || order
  } catch (e) {
    console.error("Error adding order:", e)

    // Fallback a localStorage
    saveOrderToLocalStorage(order)

    return order
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: "pendiente" | "preparando" | "listo" | "entregado",
  notes?: string,
  address?: string,
): Promise<void> {
  try {
    const updateData: any = { status }
    if (notes !== undefined) updateData.notes = notes
    if (address !== undefined) updateData.customer_address = address

    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

    if (error) throw error

    // Actualizar localStorage
    updateOrderStatusInLocalStorage(orderId, status, notes, address)
  } catch (e) {
    console.error("Error updating order status:", e)

    // Fallback a localStorage
    updateOrderStatusInLocalStorage(orderId, status, notes, address)
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  try {
    // Primero eliminamos los items del pedido
    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId)

    if (itemsError) throw itemsError

    // Luego eliminamos el pedido
    const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId)

    if (orderError) throw orderError

    // Actualizar localStorage
    deleteOrderFromLocalStorage(orderId)
  } catch (e) {
    console.error("Error deleting order:", e)

    // Fallback a localStorage
    deleteOrderFromLocalStorage(orderId)
  }
}

// Funciones auxiliares para localStorage (fallback)
function saveOrderToLocalStorage(order: Order): void {
  // Guardar en historial
  const savedHistory = localStorage.getItem("sabornuts-order-history")
  let orderHistory: Order[] = []

  if (savedHistory) {
    try {
      orderHistory = JSON.parse(savedHistory)
    } catch (e) {
      console.error("Error parsing order history", e)
    }
  }

  // Verificar si el pedido ya existe
  const existingOrderIndex = orderHistory.findIndex((o) => o.id === order.id)
  if (existingOrderIndex !== -1) {
    orderHistory[existingOrderIndex] = order
  } else {
    orderHistory.unshift(order)
  }

  localStorage.setItem("sabornuts-order-history", JSON.stringify(orderHistory))

  // Guardar en pedidos pendientes si no está entregado
  if (order.status !== "entregado") {
    const savedPendingOrders = localStorage.getItem("sabornuts-pending-orders")
    let pendingOrders: Order[] = []

    if (savedPendingOrders) {
      try {
        pendingOrders = JSON.parse(savedPendingOrders)
      } catch (e) {
        console.error("Error parsing pending orders", e)
      }
    }

    // Verificar si el pedido ya existe
    const existingPendingIndex = pendingOrders.findIndex((o) => o.id === order.id)
    if (existingPendingIndex !== -1) {
      pendingOrders[existingPendingIndex] = order
    } else {
      pendingOrders.unshift(order)
    }

    localStorage.setItem("sabornuts-pending-orders", JSON.stringify(pendingOrders))
  }
}

function updateOrderStatusInLocalStorage(
  orderId: string,
  status: "pendiente" | "preparando" | "listo" | "entregado",
  notes?: string,
  address?: string,
): void {
  // Actualizar en historial
  const savedHistory = localStorage.getItem("sabornuts-order-history")
  if (savedHistory) {
    try {
      const orderHistory = JSON.parse(savedHistory)
      const updatedHistory = orderHistory.map((order: Order) => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, status }
          if (notes !== undefined) updatedOrder.notes = notes
          if (address !== undefined) updatedOrder.customer_address = address
          return updatedOrder
        }
        return order
      })
      localStorage.setItem("sabornuts-order-history", JSON.stringify(updatedHistory))
    } catch (e) {
      console.error("Error updating order in history", e)
    }
  }

  // Actualizar en pedidos pendientes
  const savedPendingOrders = localStorage.getItem("sabornuts-pending-orders")
  if (savedPendingOrders) {
    try {
      const pendingOrders = JSON.parse(savedPendingOrders)

      if (status === "entregado") {
        // Si está entregado, eliminar de pendientes
        const updatedPendingOrders = pendingOrders.filter((order: Order) => order.id !== orderId)
        localStorage.setItem("sabornuts-pending-orders", JSON.stringify(updatedPendingOrders))
      } else {
        // Si no está entregado, actualizar
        const updatedPendingOrders = pendingOrders.map((order: Order) => {
          if (order.id === orderId) {
            const updatedOrder = { ...order, status }
            if (notes !== undefined) updatedOrder.notes = notes
            if (address !== undefined) updatedOrder.customer_address = address
            return updatedOrder
          }
          return order
        })
        localStorage.setItem("sabornuts-pending-orders", JSON.stringify(updatedPendingOrders))
      }
    } catch (e) {
      console.error("Error updating order in pending orders", e)
    }
  }
}

function deleteOrderFromLocalStorage(orderId: string): void {
  // Eliminar del historial
  const savedHistory = localStorage.getItem("sabornuts-order-history")
  if (savedHistory) {
    try {
      const orderHistory = JSON.parse(savedHistory)
      const updatedHistory = orderHistory.filter((order: Order) => order.id !== orderId)
      localStorage.setItem("sabornuts-order-history", JSON.stringify(updatedHistory))
    } catch (e) {
      console.error("Error deleting order from history", e)
    }
  }

  // Eliminar de pedidos pendientes
  const savedPendingOrders = localStorage.getItem("sabornuts-pending-orders")
  if (savedPendingOrders) {
    try {
      const pendingOrders = JSON.parse(savedPendingOrders)
      const updatedPendingOrders = pendingOrders.filter((order: Order) => order.id !== orderId)
      localStorage.setItem("sabornuts-pending-orders", JSON.stringify(updatedPendingOrders))
    } catch (e) {
      console.error("Error deleting order from pending orders", e)
    }
  }
}

// Crear un bucket para almacenar imágenes si no existe
export async function createStorageBucketIfNotExists(): Promise<void> {
  try {
    // Verificar si el bucket existe
    const { data: buckets } = await supabase.storage.listBuckets()

    if (!buckets?.find((bucket) => bucket.name === "sabornuts")) {
      // Crear el bucket si no existe
      const { error } = await supabase.storage.createBucket("sabornuts", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (error) {
        console.error("Error creating storage bucket:", error)
      } else {
        console.log("Storage bucket created successfully")
      }
    }
  } catch (error) {
    console.error("Error checking/creating storage bucket:", error)
  }
}

// Llamar a esta función al iniciar la aplicación
if (typeof window !== "undefined") {
  createStorageBucketIfNotExists()
}

