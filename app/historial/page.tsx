"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, FileText, Trash2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useVendor } from "@/components/vendor-provider"
import dynamic from "next/dynamic"

// Importar dinámicamente jsPDF y autoTable
const jsPDF = dynamic(() => import("jspdf").then((mod) => mod.default), { ssr: false })
const autoTable = dynamic(() => import("jspdf-autotable").then((mod) => mod.default), { ssr: false })

type OrderHistoryItem = {
  id: string
  date: string
  customerName: string
  vendorName: string
  storeLocation: string
  items: {
    productId: number
    productName: string
    price: number
    quantity: number
  }[]
  total: number
  discount: number
  finalTotal: number
}

async function getOrders(): Promise<OrderHistoryItem[]> {
  // Simula una llamada a una API
  return new Promise((resolve) => {
    const savedHistory = localStorage.getItem("sabornuts-order-history")
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        resolve(history)
      } catch (e) {
        console.error("Error al cargar el historial de pedidos", e)
        resolve([])
      }
    } else {
      resolve([])
    }
  })
}

export default function HistorialPage() {
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<OrderHistoryItem[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { vendorInfo } = useVendor()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  // Mejorar la carga de datos del historial
  useEffect(() => {
    // Cargar historial de pedidos
    const loadOrderHistory = async () => {
      try {
        const orders = await getOrders()
        setOrderHistory(orders)
        setFilteredHistory(orders)
      } catch (error) {
        console.error("Error loading order history:", error)
        // Fallback a localStorage
        const savedHistory = localStorage.getItem("sabornuts-order-history")
        if (savedHistory) {
          try {
            const history = JSON.parse(savedHistory)
            setOrderHistory(history)
            setFilteredHistory(history)
          } catch (e) {
            console.error("Error al cargar el historial de pedidos", e)
          }
        }
      }
    }

    loadOrderHistory()
  }, [])

  // Filtrar historial según término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHistory(orderHistory)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = orderHistory.filter(
      (order) =>
        order.customerName.toLowerCase().includes(term) ||
        order.items.some((item) => item.productName.toLowerCase().includes(term)),
    )

    setFilteredHistory(filtered)
  }, [searchTerm, orderHistory])

  const handleDeleteOrder = (orderId: string) => {
    const updatedHistory = orderHistory.filter((order) => order.id !== orderId)
    setOrderHistory(updatedHistory)
    setFilteredHistory(
      updatedHistory.filter((order) => {
        if (!searchTerm.trim()) return true

        const term = searchTerm.toLowerCase()
        return (
          order.customerName.toLowerCase().includes(term) ||
          order.items.some((item) => item.productName.toLowerCase().includes(term))
        )
      }),
    )

    localStorage.setItem("sabornuts-order-history", JSON.stringify(updatedHistory))

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null)
    }
  }

  const handleViewOrder = (order: OrderHistoryItem) => {
    setSelectedOrder(order)
  }

  const handleBackToList = () => {
    setSelectedOrder(null)
  }

  const regeneratePDF = (order: OrderHistoryItem) => {
    if (typeof window === "undefined") return

    // Importar jsPDF y autoTable dinámicamente
    import("jspdf").then((jsPDFModule) => {
      import("jspdf-autotable").then((autoTableModule) => {
        const JsPDF = jsPDFModule.default
        const autoTable = autoTableModule.default

        const doc = new JsPDF()

        // Add logo and header
        doc.setFontSize(22)
        doc.setTextColor(0, 192, 173) // #00c0ad
        doc.text("Sabornuts", 105, 20, { align: "center" })

        // Add date
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        const orderDate = new Date(order.date)
        doc.text(`Fecha: ${orderDate.toLocaleDateString()} - Hora: ${orderDate.toLocaleTimeString()}`, 105, 30, {
          align: "center",
        })

        // Add customer and vendor info
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.text(`Cliente: ${order.customerName}`, 14, 40)
        doc.text(`Vendedor: ${order.vendorName || ""}`, 14, 48)
        doc.text(`Sucursal: ${order.storeLocation || ""}`, 14, 56)

        // Create table
        const tableColumn = ["#", "Producto", "Precio Unit.", "Cantidad", "Total"]
        const tableRows = order.items.map((item, index) => [
          index + 1,
          item.productName,
          formatCurrency(item.price),
          item.quantity,
          formatCurrency(item.price * item.quantity),
        ])

        // Add table
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 65,
          theme: "grid",
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [80, 54, 42], textColor: [255, 255, 255] }, // #50362a
          footStyles: { fillColor: [80, 54, 42], textColor: [255, 255, 255] }, // #50362a
        })

        // Add totals
        const finalY = (doc as any).lastAutoTable.finalY || 150
        const subtotal = order.total
        const discountAmount = (subtotal * (order.discount || 0)) / 100
        const finalTotal = order.finalTotal || subtotal

        doc.setFontSize(10)
        doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 140, finalY + 10, { align: "right" })

        if (order.discount > 0) {
          doc.text(`Descuento (${order.discount}%): ${formatCurrency(discountAmount)}`, 140, finalY + 18, {
            align: "right",
          })
        }

        doc.setFontSize(12)
        doc.setFont(undefined, "bold")
        doc.text(`TOTAL: ${formatCurrency(finalTotal)}`, 140, finalY + (order.discount > 0 ? 28 : 20), {
          align: "right",
        })

        // Add footer
        doc.setFontSize(8)
        doc.setFont(undefined, "normal")
        doc.setTextColor(100, 100, 100)
        doc.text("Gracias por su compra", 105, 280, { align: "center" })

        // Formatear la fecha como DD-MM-YYYY
        const formattedDate = orderDate
          .toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-")

        // Crear el nombre del archivo con el formato solicitado
        doc.save(`PedidoSabornuts (${order.customerName} ${formattedDate}).pdf`)
      })
    })
  }

  if (!vendorInfo) {
    return null
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Historial de Pedidos</h1>
        <Button variant="outline" onClick={() => router.push("/productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      {selectedOrder ? (
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={handleBackToList} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Pedido de {selectedOrder.customerName}</CardTitle>
                <div className="text-sm text-muted-foreground">{new Date(selectedOrder.date).toLocaleString()}</div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Vendedor: {selectedOrder.vendorName || "No registrado"} | Sucursal:{" "}
                {selectedOrder.storeLocation || "No registrada"}
              </div>
            </CardHeader>
            <CardContent>
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
                        <td className="py-4 px-4">{item.productName}</td>
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
                        {formatCurrency(selectedOrder.finalTotal || selectedOrder.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" className="mr-2" onClick={() => regeneratePDF(selectedOrder)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Regenerar PDF
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteOrder(selectedOrder.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
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
            {filteredHistory.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No se encontraron pedidos que coincidan con la búsqueda"
                    : "No hay pedidos en el historial"}
                </p>
              </div>
            ) : (
              filteredHistory.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{order.customerName}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(order.date).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Vendedor: {order.vendorName || "No registrado"}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">{order.items.length} productos</p>
                        <p className="font-medium mt-1">Total: {formatCurrency(order.finalTotal || order.total)}</p>
                      </div>
                      <Button onClick={() => handleViewOrder(order)}>Ver detalles</Button>
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

