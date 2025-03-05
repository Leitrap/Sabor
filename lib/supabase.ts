import { createClient } from "@supabase/supabase-js"

// Creamos el cliente de Supabase con las variables de entorno
// Estas variables se configurarán en Vercel
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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
// Modificar la función getProducts para manejar mejor los errores y el estado offline
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

// Modificar la función updateProductStock para mejor manejo de errores
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

// Funciones para clientes
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("*").order("name")

  if (error) {
    console.error("Error fetching customers:", error)
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

  return data || []
}

export async function addCustomer(customer: Customer): Promise<Customer | null> {
  const { data, error } = await supabase.from("customers").insert(customer).select()

  if (error) {
    console.error("Error adding customer:", error)
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

  return data?.[0] || null
}

// Funciones para pedidos
// Mejorar las funciones de pedidos para mejor manejo de errores
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

  if (orderError) {
    console.error("Error adding order:", orderError)
    // Fallback a localStorage
    saveOrderToLocalStorage(order)
    return order
  }

  // Luego insertamos los items del pedido
  const orderItems = order.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    price: item.price,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

  if (itemsError) {
    console.error("Error adding order items:", itemsError)
    // Fallback a localStorage
    saveOrderToLocalStorage(order)
  }

  return orderData?.[0] || null
}

export async function updateOrderStatus(
  orderId: string,
  status: "pendiente" | "preparando" | "listo" | "entregado",
  notes?: string,
  address?: string,
): Promise<void> {
  const updateData: any = { status }
  if (notes !== undefined) updateData.notes = notes
  if (address !== undefined) updateData.customer_address = address

  const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

  if (error) {
    console.error("Error updating order status:", error)
    // Fallback a localStorage
    updateOrderStatusInLocalStorage(orderId, status, notes, address)
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  // Primero eliminamos los items del pedido
  const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId)

  if (itemsError) {
    console.error("Error deleting order items:", itemsError)
  }

  // Luego eliminamos el pedido
  const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId)

  if (orderError) {
    console.error("Error deleting order:", orderError)
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

  orderHistory.unshift(order)
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

    pendingOrders.unshift(order)
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

