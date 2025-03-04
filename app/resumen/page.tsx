"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { v4 as uuidv4 } from "uuid"
import { useVendor } from "@/components/vendor-provider"
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { addOrder } from "@/lib/supabase"

export default function ResumenPage() {
  const {
    items,
    customerName,
    customerAddress,
    clearCart,
    getTotal,
    checkStockAvailability,
    updateQuantity,
    removeFromCart,
  } = useCart()
  const { vendorInfo } = useVendor()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stockShortage, setStockShortage] = useState<{
    hasShortage: boolean
    shortages: { productId: number; name: string; requested: number; available: number }[]
  }>({ hasShortage: false, shortages: [] })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (items.length === 0) {
        router.push("/productos")
      }

      if (!vendorInfo) {
        router.push("/")
      }

      // Verificar disponibilidad de stock
      setStockShortage(checkStockAvailability())
    }
  }, [mounted, items, router, vendorInfo, checkStockAvailability])

  const handleClearCart = () => {
    clearCart()
    router.push("/productos")
  }

  const calculateFinalTotal = () => {
    const subtotal = getTotal()
    const discountAmount = (subtotal * discount) / 100
    return subtotal - discountAmount
  }

  const handleQuantityChange = (productId: number, newQuantity: string) => {
    const quantity = Number.parseInt(newQuantity)
    if (!isNaN(quantity) && quantity > 0) {
      updateQuantity(productId, quantity)
    }
  }

  const saveOrderToDatabase = async () => {
    setIsSubmitting(true)

    // Crear objeto de pedido
    const orderId = uuidv4()
    const order = {
      id: orderId,
      date: new Date().toISOString(),
      customer_name: customerName,
      customer_address: customerAddress,
      vendor_name: vendorInfo?.name || "Vendedor Desconocido",
      total: getTotal(),
      discount: discount,
      final_total: calculateFinalTotal(),
      status: "pendiente" as const,
      notes: notes,
      items: items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
    }

    try {
      // Guardar en Supabase
      await addOrder(order)

      // Generar PDF después de guardar
      generatePDF()
    } catch (error) {
      console.error("Error saving order:", error)
      // Fallback a localStorage
      saveOrderToLocalStorage()
      generatePDF()
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveOrderToLocalStorage = () => {
    // Crear objeto de historial de pedido
    const orderHistoryItem = {
      id: uuidv4(),
      date: new Date().toISOString(),
      customerName,
      customerAddress,
      vendorName: vendorInfo?.name || "Vendedor Desconocido",
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      total: getTotal(),
      discount: discount,
      finalTotal: calculateFinalTotal(),
      status: "pendiente",
      notes: notes,
    }

    // Obtener historial existente
    const existingHistory = localStorage.getItem("sabornuts-order-history")
    let orderHistory = []

    if (existingHistory) {
      try {
        orderHistory = JSON.parse(existingHistory)
      } catch (e) {
        console.error("Error al parsear el historial de pedidos", e)
      }
    }

    // Agregar nuevo pedido al historial
    orderHistory.unshift(orderHistoryItem) // Agregar al principio

    // Guardar historial actualizado
    localStorage.setItem("sabornuts-order-history", JSON.stringify(orderHistory))

    // Guardar en pedidos en curso
    const existingPendingOrders = localStorage.getItem("sabornuts-pending-orders")
    let pendingOrders = []

    if (existingPendingOrders) {
      try {
        pendingOrders = JSON.parse(existingPendingOrders)
      } catch (e) {
        console.error("Error al parsear pedidos pendientes", e)
      }
    }

    pendingOrders.unshift(orderHistoryItem)
    localStorage.setItem("sabornuts-pending-orders", JSON.stringify(pendingOrders))
  }

  const generatePDF = () => {
    const doc = new jsPDF()

    // Add logo and header
    doc.setFontSize(22)
    doc.setTextColor(0, 192, 173) // #00c0ad
    doc.text("Sabornuts", 105, 20, { align: "center" })

    // Add date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const today = new Date()
    doc.text(`Fecha: ${today.toLocaleDateString()} - Hora: ${today.toLocaleTimeString()}`, 105, 30, { align: "center" })

    // Add customer and vendor info
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Cliente: ${customerName}`, 14, 40)
    doc.text(`Vendedor: ${vendorInfo?.name || ""}`, 14, 48)

    if (customerAddress) {
      doc.text(`Dirección: ${customerAddress}`, 14, 56)
    }

    // Create table
    const tableColumn = ["#", "Producto", "Precio Unit.", "Cantidad", "Total"]
    const tableRows = items.map((item, index) => [
      index + 1,
      item.product.name,
      formatCurrency(item.product.price),
      item.quantity,
      formatCurrency(item.product.price * item.quantity),
    ])

    // Add table using autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: customerAddress ? 65 : 56,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [80, 54, 42], textColor: [255, 255, 255] }, // #50362a
      footStyles: { fillColor: [80, 54, 42], textColor: [255, 255, 255] }, // #50362a
    })

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY || 150
    const finalTotal = calculateFinalTotal()

    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text(`TOTAL: ${formatCurrency(finalTotal)}`, 140, finalY + 10, { align: "right" })

    // Add notes if any
    if (notes) {
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.text("Notas:", 14, finalY + 20)
      doc.text(notes, 14, finalY + 28)
    }

    // Add footer
    doc.setFontSize(8)
    doc.setFont(undefined, "normal")
    doc.setTextColor(100, 100, 100)
    doc.text("Gracias por su compra", 105, 280, { align: "center" })

    // Formatear la fecha como DD-MM-YYYY
    const formattedDate = today
      .toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-")

    // Crear el nombre del archivo con el formato solicitado
    doc.save(`PedidoSabornuts (${customerName} ${formattedDate}).pdf`)

    // Limpiar carrito y volver a la página principal
    clearCart()
    router.push("/productos")
  }

  if (!mounted || items.length === 0 || !vendorInfo) {
    return null
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resumen del Pedido</h1>
        <Button variant="outline" onClick={() => router.push("/productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg overflow-hidden scale-in">
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold">Información del Cliente</h2>
              <p className="text-muted-foreground">{customerName}</p>
              {customerAddress && <p className="text-muted-foreground text-sm mt-1">{customerAddress}</p>}
            </div>
            <div>
              <h2 className="text-lg font-semibold">Información del Vendedor</h2>
              <p className="text-muted-foreground">{vendorInfo.name}</p>
            </div>
          </div>
        </div>

        {stockShortage.hasShortage && (
          <div className="p-4 bg-destructive/10 border-b">
            <h3 className="font-semibold text-destructive mb-2">Advertencia: Stock insuficiente</h3>
            <ul className="list-disc pl-5 text-sm">
              {stockShortage.shortages.map((shortage) => (
                <li key={shortage.productId} className="text-destructive">
                  {shortage.name}: Solicitado {shortage.requested}, Disponible {shortage.available}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">#</th>
                  <th className="py-2 px-4 text-left">Imagen</th>
                  <th className="py-2 px-4 text-left">Producto</th>
                  <th className="py-2 px-4 text-right">Precio Unit.</th>
                  <th className="py-2 px-4 text-right">Cantidad</th>
                  <th className="py-2 px-4 text-right">Total</th>
                  <th className="py-2 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.product.id} className="border-b">
                    <td className="py-4 px-4">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                        <img
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">{item.product.name}</td>
                    <td className="py-4 px-4 text-right">{formatCurrency(item.product.price)}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product.id, e.target.value)}
                          className="h-7 w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">{formatCurrency(item.product.price * item.quantity)}</td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold text-lg">
                  <td colSpan={6} className="py-4 px-4 text-right">
                    Total
                  </td>
                  <td className="py-4 px-4 text-right">{formatCurrency(calculateFinalTotal())}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notas adicionales
            </label>
            <Textarea
              id="notes"
              placeholder="Instrucciones especiales, comentarios, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="p-6 border-t flex flex-col sm:flex-row gap-4 justify-end">
          <Button variant="outline" onClick={handleClearCart} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={saveOrderToDatabase} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar PDF y Finalizar"}
          </Button>
        </div>
      </div>
    </main>
  )
}

