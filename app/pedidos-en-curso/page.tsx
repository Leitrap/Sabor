"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Trash2, Search, CheckCircle, Clock, Package, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useVendor } from "@/components/vendor-provider"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getProductStock } from "@/data/products"
import { getPendingOrders, updateOrderStatus, deleteOrder, type Order } from "@/lib/supabase"

export default function PedidosEnCursoPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [orderStatus, setOrderStatus] = useState<"pendiente" | "preparando" | "listo" | "entregado">("pendiente")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { vendorInfo } = useVendor()
  const { toast } = useToast()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  useEffect(() => {
    // Cargar pedidos pendientes
    const loadPendingOrders = async () => {
      setIsLoading(true)
      try {
        const orders = await getPendingOrders()
        setPendingOrders(orders)
        setFilteredOrders(orders)
      } catch (error) {
        console.error("Error loading pending orders:", error)
        // Fallback a localStorage
        const savedPendingOrders = localStorage.getItem("sabornuts-pending-orders")
        if (savedPendingOrders) {
          try {
            const orders = JSON.parse(savedPendingOrders)
            setPendingOrders(orders)
            setFilteredOrders(orders)
          } catch (e) {
            console.error("Error al cargar pedidos pendientes", e)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadPendingOrders()
  }, [])

  // Filtrar pedidos según término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(pendingOrders)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = pendingOrders.filter(
      (order) =>
        order.customer_name.toLowerCase().includes(term) ||
        order.items.some((item) => item.product_name.toLowerCase().includes(term)),
    )

    setFilteredOrders(filtered)
  }, [searchTerm, pendingOrders])

  const handleDeleteOrder = async (orderId: string) => {
    setIsLoading(true)
    try {
      await deleteOrder(orderId)

      const updatedOrders = pendingOrders.filter((order) => order.id !== orderId)
      setPendingOrders(updatedOrders)
      setFilteredOrders(
        updatedOrders.filter((order) => {
          if (!searchTerm.trim()) return true

          const term = searchTerm.toLowerCase()
          return (
            order.customer_name.toLowerCase().includes(term) ||
            order.items.some((item) => item.product_name.toLowerCase().includes(term))
          )
        }),
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
      }

      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado de la lista de pendientes",
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setOrderStatus(order.status)
    setDeliveryNotes(order.notes || "")
    setDeliveryAddress(order.customer_address || "")
  }

  const handleBackToList = () => {
    setSelectedOrder(null)
  }

  const updateOrder = async () => {
    if (!selectedOrder) return

    setIsLoading(true)
    try {
      await updateOrderStatus(selectedOrder.id, orderStatus, deliveryNotes, deliveryAddress)

      // Actualizar el estado del pedido seleccionado
      const updatedOrder = {
        ...selectedOrder,
        status: orderStatus,
        notes: deliveryNotes,
        customer_address: deliveryAddress,
      }

      // Actualizar la lista de pedidos pendientes
      const updatedOrders = pendingOrders.map((order) => (order.id === selectedOrder.id ? updatedOrder : order))

      setPendingOrders(updatedOrders)
      setFilteredOrders(
        updatedOrders.filter((order) => {
          if (!searchTerm.trim()) return true

          const term = searchTerm.toLowerCase()
          return (
            order.customer_name.toLowerCase().includes(term) ||
            order.items.some((item) => item.product_name.toLowerCase().includes(term))
          )
        }),
      )

      // Si el pedido está entregado, eliminarlo de pendientes
      if (orderStatus === "entregado") {
        handleDeleteOrder(selectedOrder.id)
      } else {
        setSelectedOrder(updatedOrder)

        toast({
          title: "Estado actualizado",
          description: `El pedido ahora está ${getStatusText(orderStatus)}`,
        })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendiente":
        return "pendiente"
      case "preparando":
        return "en preparación"
      case "listo":
        return "listo para enviar"
      case "entregado":
        return "entregado"
      default:
        return status
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Pendiente
          </Badge>
        )
      case "preparando":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Preparando
          </Badge>
        )
      case "listo":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Listo para enviar
          </Badge>
        )
      case "entregado":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Entregado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "preparando":
        return <Package className="h-4 w-4 text-blue-500" />
      case "listo":
        return <Truck className="h-4 w-4 text-green-500" />
      case "entregado":
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const checkStockShortages = (order: Order) => {
    const shortages = order.items
      .filter((item) => {
        const currentStock = getProductStock(item.product_id)
        return currentStock < item.quantity
      })
      .map((item) => ({
        productId: item.product_id,
        name: item.product_name,
        requested: item.quantity,
        available: getProductStock(item.product_id),
      }))

    return {
      hasShortage: shortages.length > 0,
      shortages,
    }
  }

  if (!vendorInfo) {
    return null
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedidos en Curso</h1>
        <Button variant="outline" onClick={() => router.push("/productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      {isLoading && !selectedOrder ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      ) : selectedOrder ? (
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={handleBackToList} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Pedido de {selectedOrder.customer_name}</CardTitle>
                <div className="text-sm text-muted-foreground">{new Date(selectedOrder.date).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(selectedOrder.status)}
                <span className="text-sm text-muted-foreground">
                  Vendedor: {selectedOrder.vendor_name || "No registrado"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Información de Entrega</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="customer-name" className="block text-xs text-muted-foreground mb-1">
                        Cliente
                      </label>
                      <div className="p-2 bg-muted rounded-md">
                        <p className="font-medium">{selectedOrder.customer_name}</p>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="delivery-address" className="block text-xs text-muted-foreground mb-1">
                        Dirección de entrega
                      </label>
                      <Input
                        id="delivery-address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ingrese la dirección de entrega"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Estado del Pedido</h3>
                  <Select value={orderStatus} onValueChange={(value: any) => setOrderStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="preparando">Preparando</SelectItem>
                      <SelectItem value="listo">Listo para enviar</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Verificación de stock */}
              {selectedOrder.status !== "entregado" && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Verificación de Stock</h3>
                  {(() => {
                    const stockCheck = checkStockShortages(selectedOrder)
                    if (stockCheck.hasShortage) {
                      return (
                        <div className="p-4 bg-destructive/10 rounded-md">
                          <p className="font-medium text-destructive mb-2">Productos con stock insuficiente:</p>
                          <ul className="list-disc pl-5 text-sm">
                            {stockCheck.shortages.map((shortage) => (
                              <li key={shortage.productId} className="text-destructive">
                                {shortage.name}: Solicitado {shortage.requested}, Disponible {shortage.available}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    } else {
                      return (
                        <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-md">
                          <p className="font-medium text-green-800 dark:text-green-300">
                            Stock disponible para todos los productos
                          </p>
                        </div>
                      )
                    }
                  })()}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Notas de Entrega</h3>
                <Textarea
                  placeholder="Instrucciones especiales, comentarios, etc."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">#</th>
                      <th className="py-2 px-4 text-left">Producto</th>
                      <th className="py-2 px-4 text-right">Precio Unit.</th>
                      <th className="py-2 px-4 text-right">Cantidad</th>
                      <th className="py-2 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-4 px-4">{index + 1}</td>
                        <td className="py-4 px-4">{item.product_name}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-4 px-4 text-right">{item.quantity}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={4} className="py-4 px-4 text-right">
                        Total
                      </td>
                      <td className="py-4 px-4 text-right">
                        {formatCurrency(selectedOrder.final_total || selectedOrder.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
                <Button onClick={updateOrder} disabled={isLoading}>
                  {orderStatus === "entregado" ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como entregado
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Actualizar estado
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? "No se encontraron pedidos que coincidan con la búsqueda" : "No hay pedidos en curso"}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="h-8 w-8"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(order.date).toLocaleString()}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(order.status)}
                      {getStatusIcon(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      {order.customer_address ? (
                        <p className="text-sm text-muted-foreground truncate">Dirección: {order.customer_address}</p>
                      ) : (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Sin dirección de entrega</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">{order.items.length} productos</p>
                        <p className="font-medium mt-1">Total: {formatCurrency(order.final_total || order.total)}</p>
                      </div>
                      <Button onClick={() => handleViewOrder(order)} disabled={isLoading}>
                        Ver detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </main>
  )
}

