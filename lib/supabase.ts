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

// Funciones para productos
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from("products").select("*").order("id")

    if (error) throw error

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      localStorage.setItem("sabornuts-stock", JSON.stringify(data))
      return data
    }
  } catch (e) {
    console.error("Error fetching products:", e)
  }

  // Fallback a localStorage si hay error o no hay datos
  const savedStock = localStorage.getItem("sabornuts-stock")
  if (savedStock) {
    try {
      return JSON.parse(savedStock)
    } catch (e) {
      console.error("Error parsing local stock", e)
    }
  }

  // Si todo falla, devolver los productos predefinidos
  return []
}

export async function updateProductStock(productId: number, newStock: number): Promise<void> {
  try {
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", productId)

    if (error) throw error

    // Actualizar localStorage como respaldo
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
  } catch (e) {
    console.error("Error updating product stock:", e)
    // Actualizar solo localStorage si falla Supabase
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
}

export async function addProduct(product: Omit<Product, "id">): Promise<Product | null> {
  try {
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

    if (error) throw error

    // Actualizar localStorage
    const savedStock = localStorage.getItem("sabornuts-stock")
    let products = []
    if (savedStock) {
      try {
        products = JSON.parse(savedStock)
      } catch (e) {
        console.error("Error parsing local stock", e)
      }
    }
    products.push(newProduct)
    localStorage.setItem("sabornuts-stock", JSON.stringify(products))

    return data?.[0] || newProduct
  } catch (e) {
    console.error("Error adding product:", e)
    return null
  }
}

export async function updateProduct(product: Product): Promise<Product | null> {
  try {
    const { data, error } = await supabase.from("products").update(product).eq("id", product.id).select()

    if (error) throw error

    // Actualizar localStorage
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

    return data?.[0] || product
  } catch (e) {
    console.error("Error updating product:", e)
    return null
  }
}

export async function deleteProduct(productId: number): Promise<void> {
  try {
    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) throw error

    // Actualizar localStorage
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
  } catch (e) {
    console.error("Error deleting product:", e)
  }
}

// Funciones para categorías
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("id")

    if (error) throw error

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      localStorage.setItem("sabornuts-categories", JSON.stringify(data))
      return data
    }
  } catch (e) {
    console.error("Error fetching categories:", e)
  }

  // Fallback a localStorage
  const savedCategories = localStorage.getItem("sabornuts-categories")
  if (savedCategories) {
    try {
      return JSON.parse(savedCategories)
    } catch (e) {
      console.error("Error parsing local categories", e)
    }
  }

  // Categorías por defecto
  return [
    { id: 1, name: "Frutos Secos" },
    { id: 2, name: "Frutas Secas" },
    { id: 3, name: "Semillas" },
    { id: 4, name: "Mezclas" },
  ]
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

