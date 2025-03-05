import { createClient } from "@supabase/supabase-js"

// Función para verificar si estamos en el navegador
const isBrowser = typeof window !== "undefined"

// Función para crear un cliente de Supabase con manejo de errores
function createSupabaseClient() {
  // Obtener las variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Verificar si las variables de entorno están definidas
  if (!supabaseUrl || !supabaseAnonKey) {
    // En el navegador, intentar usar un cliente simulado
    if (isBrowser) {
      console.warn("Supabase URL or Anon Key is missing. Using a mock client that will use localStorage only.")

      // Devolver un cliente simulado que solo usa localStorage
      return createMockClient()
    } else {
      // En el servidor, lanzar un error
      console.error(
        "Supabase URL or Anon Key is missing. Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
      )

      // Devolver un cliente simulado para evitar errores
      return createMockClient()
    }
  }

  // Crear el cliente de Supabase con las variables de entorno
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  } catch (error) {
    console.error("Error creating Supabase client:", error)

    // En caso de error, devolver un cliente simulado
    return createMockClient()
  }
}

// Función para crear un cliente simulado que solo usa localStorage
function createMockClient() {
  // Este cliente simulado implementa los métodos básicos de Supabase
  // pero solo usa localStorage para almacenar datos
  return {
    from: (table: string) => ({
      select: (columns = "*") => ({
        order: () => ({
          then: (callback: Function) => {
            try {
              const data = getLocalData(table)
              callback({ data, error: null })
            } catch (error) {
              callback({ data: null, error })
            }
          },
        }),
        eq: () => ({
          then: (callback: Function) => {
            callback({ data: [], error: null })
          },
        }),
      }),
      insert: (data: any) => ({
        select: () => ({
          then: (callback: Function) => {
            try {
              saveLocalData(table, data)
              callback({ data: [data], error: null })
            } catch (error) {
              callback({ data: null, error })
            }
          },
        }),
      }),
      update: (data: any) => ({
        eq: () => ({
          select: () => ({
            then: (callback: Function) => {
              callback({ data: [data], error: null })
            },
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          then: (callback: Function) => {
            callback({ error: null })
          },
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: "" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "/placeholder.svg" } }),
      }),
      listBuckets: () => Promise.resolve({ data: [], error: null }),
      createBucket: () => Promise.resolve({ error: null }),
    },
    channel: (name: string) => ({
      on: () => ({
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
    }),
    removeChannel: () => {},
  }
}

// Función para obtener datos de localStorage
function getLocalData(table: string) {
  if (!isBrowser) return []

  const key = `sabornuts-${table}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

// Función para guardar datos en localStorage
function saveLocalData(table: string, data: any) {
  if (!isBrowser) return

  const key = `sabornuts-${table}`
  const existingData = getLocalData(table)

  if (Array.isArray(data)) {
    localStorage.setItem(key, JSON.stringify([...existingData, ...data]))
  } else {
    localStorage.setItem(key, JSON.stringify([...existingData, data]))
  }
}

// Crear el cliente de Supabase
export const supabase = createSupabaseClient()

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
  address: string
  created_at?: string
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

    if (error) {
      console.error("Error fetching products from Supabase:", error)
      // Si hay un error, intentamos obtener los datos del localStorage
      return getProductsFromLocalStorage()
    }

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      if (isBrowser) {
        localStorage.setItem("sabornuts-stock", JSON.stringify(data))
      }
      return data
    } else {
      // Si no hay datos en Supabase, intentamos obtener del localStorage
      return getProductsFromLocalStorage()
    }
  } catch (e) {
    console.error("Exception fetching products:", e)
    return getProductsFromLocalStorage()
  }
}

// Función auxiliar para obtener productos del localStorage
function getProductsFromLocalStorage(): Product[] {
  if (isBrowser) {
    const savedStock = localStorage.getItem("sabornuts-stock")
    if (savedStock) {
      try {
        return JSON.parse(savedStock)
      } catch (e) {
        console.error("Error parsing local stock", e)
      }
    }

    // Si no hay datos en localStorage, usamos los productos predefinidos
    // Importamos los productos desde data/products
    const { products } = require("@/data/products")

    // Guardamos los productos predefinidos en localStorage para futuros usos
    localStorage.setItem("sabornuts-stock", JSON.stringify(products))

    return products
  }

  // Si no estamos en el navegador, devolvemos un array vacío
  return []
}

export async function updateProductStock(productId: number, newStock: number): Promise<void> {
  try {
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", productId)

    if (error) throw error

    // Actualizar localStorage como respaldo
    if (isBrowser) {
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
  } catch (e) {
    console.error("Error updating product stock:", e)
    // Actualizar solo localStorage si falla Supabase
    if (isBrowser) {
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
}

export async function addProduct(product: Omit<Product, "id">): Promise<Product | null> {
  try {
    // Obtener el último ID para asignar uno nuevo
    let newId = 1

    try {
      const { data: existingProducts } = await supabase
        .from("products")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)

      if (existingProducts && existingProducts.length > 0) {
        newId = existingProducts[0].id + 1
      } else {
        // Si no hay productos en Supabase, intentamos obtener el último ID del localStorage
        const localProducts = getProductsFromLocalStorage()
        if (localProducts.length > 0) {
          const maxId = Math.max(...localProducts.map((p) => p.id))
          newId = maxId + 1
        }
      }
    } catch (error) {
      console.error("Error getting last product ID:", error)
      // Si hay un error, intentamos obtener el último ID del localStorage
      const localProducts = getProductsFromLocalStorage()
      if (localProducts.length > 0) {
        const maxId = Math.max(...localProducts.map((p) => p.id))
        newId = maxId + 1
      }
    }

    const newProduct = {
      ...product,
      id: newId,
    }

    // Intentar insertar en Supabase
    const { data, error } = await supabase.from("products").insert(newProduct).select()

    if (error) {
      console.error("Error inserting product in Supabase:", error)
      // Si hay un error con Supabase, actualizamos solo el localStorage
      updateLocalProducts((prev) => [...prev, newProduct])
      return newProduct
    }

    // Si la inserción en Supabase fue exitosa, actualizamos el localStorage
    updateLocalProducts((prev) => [...prev, data?.[0] || newProduct])
    return data?.[0] || newProduct
  } catch (e) {
    console.error("Exception adding product:", e)
    // En caso de excepción, actualizamos solo el localStorage
    const newId = Math.max(...getProductsFromLocalStorage().map((p) => p.id), 0) + 1
    const newProduct = { ...product, id: newId }
    updateLocalProducts((prev) => [...prev, newProduct])
    return newProduct
  }
}

// Función auxiliar para actualizar productos en localStorage
function updateLocalProducts(updater: (prev: Product[]) => Product[]) {
  if (isBrowser) {
    try {
      const currentProducts = getProductsFromLocalStorage()
      const updatedProducts = updater(currentProducts)
      localStorage.setItem("sabornuts-stock", JSON.stringify(updatedProducts))
    } catch (e) {
      console.error("Error updating local products:", e)
    }
  }
}

export async function updateProduct(product: Product): Promise<Product | null> {
  try {
    // Intentar actualizar en Supabase
    const { data, error } = await supabase.from("products").update(product).eq("id", product.id).select()

    if (error) {
      console.error("Error updating product in Supabase:", error)
      // Si hay un error con Supabase, actualizamos solo el localStorage
      updateLocalProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
      return product
    }

    // Si la actualización en Supabase fue exitosa, actualizamos el localStorage
    updateLocalProducts((prev) => prev.map((p) => (p.id === product.id ? data?.[0] || product : p)))
    return data?.[0] || product
  } catch (e) {
    console.error("Exception updating product:", e)
    // En caso de excepción, actualizamos solo el localStorage
    updateLocalProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
    return product
  }
}

export async function deleteProduct(productId: number): Promise<void> {
  try {
    // Intentar eliminar en Supabase
    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      console.error("Error deleting product from Supabase:", error)
    }

    // Siempre actualizamos el localStorage, incluso si hay un error con Supabase
    updateLocalProducts((prev) => prev.filter((p) => p.id !== productId))
  } catch (e) {
    console.error("Exception deleting product:", e)
    // En caso de excepción, actualizamos solo el localStorage
    updateLocalProducts((prev) => prev.filter((p) => p.id !== productId))
  }
}

// Funciones para categorías
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("id")

    if (error) {
      console.error("Error fetching categories from Supabase:", error)
      return getCategoriesFromLocalStorage()
    }

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      if (isBrowser) {
        localStorage.setItem("sabornuts-categories", JSON.stringify(data))
      }
      return data
    } else {
      return getCategoriesFromLocalStorage()
    }
  } catch (e) {
    console.error("Exception fetching categories:", e)
    return getCategoriesFromLocalStorage()
  }
}

function getCategoriesFromLocalStorage(): Category[] {
  if (isBrowser) {
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
  const defaultCategories = [
    { id: 1, name: "Frutos Secos" },
    { id: 2, name: "Frutas Secas" },
    { id: 3, name: "Semillas" },
    { id: 4, name: "Mezclas" },
  ]

  // Guardar categorías por defecto en localStorage
  if (isBrowser) {
    localStorage.setItem("sabornuts-categories", JSON.stringify(defaultCategories))
  }

  return defaultCategories
}

function updateLocalCategories(updater: (prev: Category[]) => Category[]) {
  if (isBrowser) {
    try {
      const currentCategories = getCategoriesFromLocalStorage()
      const updatedCategories = updater(currentCategories)
      localStorage.setItem("sabornuts-categories", JSON.stringify(updatedCategories))
    } catch (e) {
      console.error("Error updating local categories:", e)
    }
  }
}

export async function addCategory(name: string): Promise<Category | null> {
  try {
    // Obtener el último ID para asignar uno nuevo
    let newId = 1

    try {
      const { data: existingCategories } = await supabase
        .from("categories")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)

      if (existingCategories && existingCategories.length > 0) {
        newId = existingCategories[0].id + 1
      } else {
        // Si no hay categorías en Supabase, intentamos obtener el último ID del localStorage
        const localCategories = getCategoriesFromLocalStorage()
        if (localCategories.length > 0) {
          const maxId = Math.max(...localCategories.map((c) => c.id))
          newId = maxId + 1
        }
      }
    } catch (error) {
      console.error("Error getting last category ID:", error)
      // Si hay un error, intentamos obtener el último ID del localStorage
      const localCategories = getCategoriesFromLocalStorage()
      if (localCategories.length > 0) {
        const maxId = Math.max(...localCategories.map((c) => c.id))
        newId = maxId + 1
      }
    }

    const newCategory = { id: newId, name }

    // Intentar insertar en Supabase
    const { data, error } = await supabase.from("categories").insert(newCategory).select()

    if (error) {
      console.error("Error inserting category in Supabase:", error)
      // Si hay un error con Supabase, actualizamos solo el localStorage
      updateLocalCategories((prev) => [...prev, newCategory])
      return newCategory
    }

    // Si la inserción en Supabase fue exitosa, actualizamos el localStorage
    updateLocalCategories((prev) => [...prev, data?.[0] || newCategory])
    return data?.[0] || newCategory
  } catch (e) {
    console.error("Exception adding category:", e)
    // En caso de excepción, actualizamos solo el localStorage
    const newId = Math.max(...getCategoriesFromLocalStorage().map((c) => c.id), 0) + 1
    const newCategory = { id: newId, name }
    updateLocalCategories((prev) => [...prev, newCategory])
    return newCategory
  }
}

export async function updateCategory(category: Category): Promise<Category | null> {
  try {
    // Intentar actualizar en Supabase
    const { data, error } = await supabase.from("categories").update(category).eq("id", category.id).select()

    if (error) {
      console.error("Error updating category in Supabase:", error)
      // Si hay un error con Supabase, actualizamos solo el localStorage
      updateLocalCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)))
      return category
    }

    // Si la actualización en Supabase fue exitosa, actualizamos el localStorage
    updateLocalCategories((prev) => prev.map((c) => (c.id === category.id ? data?.[0] || category : c)))
    return data?.[0] || category
  } catch (e) {
    console.error("Exception updating category:", e)
    // En caso de excepción, actualizamos solo el localStorage
    updateLocalCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)))
    return category
  }
}

export async function deleteCategory(categoryId: number): Promise<void> {
  try {
    // Intentar eliminar en Supabase
    const { error } = await supabase.from("categories").delete().eq("id", categoryId)

    if (error) {
      console.error("Error deleting category from Supabase:", error)
    }

    // Siempre actualizamos el localStorage, incluso si hay un error con Supabase
    updateLocalCategories((prev) => prev.filter((c) => c.id !== categoryId))
  } catch (e) {
    console.error("Exception deleting category:", e)
    // En caso de excepción, actualizamos solo el localStorage
    updateLocalCategories((prev) => prev.filter((c) => c.id !== categoryId))
  }
}

// Funciones para clientes
export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase.from("customers").select("*").order("name")

    if (error) throw error

    if (data && data.length > 0) {
      // Guardar en localStorage como respaldo
      if (isBrowser) {
        localStorage.setItem("sabornuts-customers", JSON.stringify(data))
      }
      return data
    }
  } catch (e) {
    console.error("Error fetching customers:", e)
  }

  // Fallback a localStorage
  if (isBrowser) {
    const savedCustomers = localStorage.getItem("sabornuts-customers")
    if (savedCustomers) {
      try {
        return JSON.parse(savedCustomers)
      } catch (e) {
        console.error("Error parsing local customers", e)
      }
    }
  }

  return []
}

export async function addCustomer(customer: Customer): Promise<Customer | null> {
  try {
    const { data, error } = await supabase.from("customers").insert(customer).select()

    if (error) throw error

    // Actualizar localStorage
    if (isBrowser) {
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
    }

    return data?.[0] || customer
  } catch (e) {
    console.error("Error adding customer:", e)

    // Fallback a localStorage
    if (isBrowser) {
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
    }

    return customer
  }
}

export async function updateCustomer(customer: Customer): Promise<Customer | null> {
  try {
    const { data, error } = await supabase.from("customers").update(customer).eq("id", customer.id).select()

    if (error) throw error

    // Actualizar localStorage
    if (isBrowser) {
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
    }

    return data?.[0] || customer
  } catch (e) {
    console.error("Error updating customer:", e)

    // Fallback a localStorage
    if (isBrowser) {
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
    }

    return customer
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    const { error } = await supabase.from("customers").delete().eq("id", customerId)

    if (error) throw error

    // Actualizar localStorage
    if (isBrowser) {
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
  } catch (e) {
    console.error("Error deleting customer:", e)

    // Fallback a localStorage
    if (isBrowser) {
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
      if (isBrowser) {
        localStorage.setItem("sabornuts-order-history", JSON.stringify(data))
      }
      return data
    }
  } catch (e) {
    console.error("Error fetching orders:", e)
  }

  // Fallback a localStorage
  if (isBrowser) {
    const savedOrders = localStorage.getItem("sabornuts-order-history")
    if (savedOrders) {
      try {
        return JSON.parse(savedOrders)
      } catch (e) {
        console.error("Error parsing local orders", e)
      }
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
      if (isBrowser) {
        localStorage.setItem("sabornuts-pending-orders", JSON.stringify(data))
      }
      return data
    }
  } catch (e) {
    console.error("Error fetching pending orders:", e)
  }

  // Fallback a localStorage
  if (isBrowser) {
    const savedPendingOrders = localStorage.getItem("sabornuts-pending-orders")
    if (savedPendingOrders) {
      try {
        return JSON.parse(savedPendingOrders)
      } catch (e) {
        console.error("Error parsing local pending orders", e)
      }
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
    if (isBrowser) {
      saveOrderToLocalStorage(order)
    }

    return orderData?.[0] || order
  } catch (e) {
    console.error("Error adding order:", e)

    // Fallback a localStorage
    if (isBrowser) {
      saveOrderToLocalStorage(order)
    }

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
    if (isBrowser) {
      updateOrderStatusInLocalStorage(orderId, status, notes, address)
    }
  } catch (e) {
    console.error("Error updating order status:", e)

    // Fallback a localStorage
    if (isBrowser) {
      updateOrderStatusInLocalStorage(orderId, status, notes, address)
    }
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
    if (isBrowser) {
      deleteOrderFromLocalStorage(orderId)
    }
  } catch (e) {
    console.error("Error deleting order:", e)

    // Fallback a localStorage
    if (isBrowser) {
      deleteOrderFromLocalStorage(orderId)
    }
  }
}

// Funciones auxiliares para localStorage (fallback)
function saveOrderToLocalStorage(order: Order): void {
  if (!isBrowser) return

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
  if (!isBrowser) return

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
  if (!isBrowser) return

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
if (isBrowser) {
  createStorageBucketIfNotExists()
}

