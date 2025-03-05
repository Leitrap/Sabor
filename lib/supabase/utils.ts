import { supabase, type Order } from "@/lib/supabase"

export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

