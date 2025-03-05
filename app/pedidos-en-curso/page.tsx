"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Trash2, Search, CheckCircle, Clock, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useVendor } from "@/components/vendor-provider"
import { getPendingOrders, updateOrderStatus, deleteOrder, type Order } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PedidosEnCursoPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderStatus, setOrderStatus] = useState<"pendiente" | "preparando" | "listo" | "entregado">("pendiente")
  const [orderNotes, setOrderNotes] = useState("")
  const [orderAddress, setOrderAddress] = useState("")
  const router = useRouter()
  const { vendorInfo } = useVendor()
  const { toast } = useToast()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  // Cargar pedidos pendientes
  useEffect(() => {
    const loadPendingOrders = async () => {
      setIsLoading(true)
      try {
        const orders = await getPendingOrders()
        setPendingOrders(orders)
        setFilteredOrders(orders)
      } catch (error) {
        console.error("Error loading pending orders:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos en curso",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPendingOrders()
  }, [toast])

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

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
  }

  const handleUpdateOrder = (order: Order) => {
    setSelectedOrder(order)
    setOrderStatus(order.status)
    setOrderNotes(order.notes || "")
    setOrderAddress(order.customer_address || "")
    setIsUpdateDialogOpen(true)
  }

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateOrderConfirm = async () => {
    if (!selectedOrder) return

    setIsLoading(true)
    try {
      await updateOrderStatus(selectedOrder.id, orderStatus, orderNotes, orderAddress)

      // Actualizar la lista de pedidos
      if (orderStatus === "entregado") {
        // Si el pedido se marca como entregado, eliminarlo de la lista
        setPendingOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id))
        setFilteredOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id))
      } else {
        // Si el pedido se actualiza a otro estado, actualizar su información
        const updatedOrder = {
          ...selectedOrder,
          status: orderStatus,
          notes: orderNotes,
          customer_address: orderAddress,
        }

        setPendingOrders((prev) => prev.map((order) => (order.id === selectedOrder.id ? updatedOrder : order)))
        setFilteredOrders((prev) => prev.map((order) => (order.id === selectedOrder.id ? updatedOrder : order)))
      }

      setIsUpdateDialogOpen(false)
      toast({
        title: "Pedido actualizado",
        description: "El estado del pedido ha sido actualizado correctamente",
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el pedido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOrderConfirm = async () => {
    if (!selectedOrder) return

    setIsLoading(true)
    try {
      await deleteOrder(selectedOrder.id)

      // Eliminar el pedido de la lista
      setPendingOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id))
      setFilteredOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id))

      setIsDeleteDialogOpen(false)
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>
      case "preparando":
        return <Badge variant="secondary">Preparando</Badge>
      case "listo":
        return <Badge variant="default">Listo</Badge>
      case "entregado":
        return <Badge variant="success">Entregado</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Clock className="h-5 w-5 text-muted-foreground" />
      case "preparando":
        return <Package className="h-5 w-5 text-secondary-foreground" />
      case "listo":
        return <CheckCircle className="h-5 w-5 text-primary" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
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
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Cargando pedidos en curso...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "No se encontraron pedidos que coincidan con la búsqueda" : "No hay pedidos en curso"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                    <div className="text-sm text-muted-foreground">{new Date(order.date).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <div className="ml-2">{getStatusBadge(order.status)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  {order.customer_address && (
                    <p className="text-sm text-muted-foreground mb-1">Dirección: {order.customer_address}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Productos: {order.items.length}</p>
                  <p className="font-medium mt-1">Total: {formatCurrency(order.final_total || order.total)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleViewOrder(order)}>
                    Ver detalles
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateOrder(order)}>
                    Actualizar estado
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo de detalles del pedido */}
      <Dialog
        open={!!selectedOrder && !isUpdateDialogOpen && !isDeleteDialogOpen}
        onOpenChange={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido</DialogTitle>
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-muted-foreground">Cliente: {selectedOrder.customer_name}</div>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Fecha: {new Date(selectedOrder.date).toLocaleString()}
              </div>
              {selectedOrder.customer_address && (
                <div className="text-sm text-muted-foreground">Dirección: {selectedOrder.customer_address}</div>
              )}
            </DialogHeader>

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
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-right">
                      Subtotal
                    </td>
                    <td className="py-4 px-4 text-right">{formatCurrency(selectedOrder.total)}</td>
                  </tr>
                  {selectedOrder.discount > 0 && (
                    <tr>
                      <td colSpan={4} className="py-2 px-4 text-right">
                        Descuento ({selectedOrder.discount}%)
                      </td>
                      <td className="py-2 px-4 text-right">
                        {formatCurrency((selectedOrder.total * selectedOrder.discount) / 100)}
                      </td>
                    </tr>
                  )}
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

            {selectedOrder.notes && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Notas:</h3>
                <p className="text-sm">{selectedOrder.notes}</p>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Cerrar
              </Button>
              <Button onClick={() => handleUpdateOrder(selectedOrder)}>Actualizar estado</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Diálogo de actualización de estado */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Estado del Pedido</DialogTitle>
            <DialogDescription>
              Actualiza el estado del pedido y agrega notas adicionales si es necesario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="order-status" className="text-sm font-medium">
                Estado del pedido
              </label>
              <Select value={orderStatus} onValueChange={(value) => setOrderStatus(value as any)}>
                <SelectTrigger id="order-status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="preparando">Preparando</SelectItem>
                  <SelectItem value="listo">Listo para entrega</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="order-address" className="text-sm font-medium">
                Dirección de entrega
              </label>
              <Input
                id="order-address"
                placeholder="Dirección de entrega"
                value={orderAddress}
                onChange={(e) => setOrderAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="order-notes" className="text-sm font-medium">
                Notas adicionales
              </label>
              <Textarea
                id="order-notes"
                placeholder="Notas adicionales sobre el pedido"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateOrderConfirm} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Pedido</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrderConfirm} disabled={isLoading}>
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

