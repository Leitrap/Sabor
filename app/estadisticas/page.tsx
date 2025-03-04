"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, FileText } from "lucide-react"
import { useVendor } from "@/components/vendor-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type OrderHistoryItem = {
  id: string
  date: string
  customerName: string
  customerAddress?: string
  vendorName: string
  storeLocation?: string
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

export default function EstadisticasPage() {
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [timeFilter, setTimeFilter] = useState("all")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [vendors, setVendors] = useState<string[]>([])
  const [topProducts, setTopProducts] = useState<{ id: number; name: string; quantity: number; total: number }[]>([])
  const [salesByDate, setSalesByDate] = useState<{ date: string; orders: number; total: number }[]>([])
  const router = useRouter()
  const { vendorInfo } = useVendor()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  useEffect(() => {
    // Cargar historial de pedidos desde localStorage
    const savedHistory = localStorage.getItem("sabornuts-order-history")
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory) as OrderHistoryItem[]
        setOrderHistory(history)

        // Extraer lista de vendedores únicos
        const uniqueVendors = Array.from(new Set(history.map((order) => order.vendorName)))
        setVendors(uniqueVendors)

        // Procesar datos iniciales
        processData(history)
      } catch (e) {
        console.error("Error al cargar el historial de pedidos", e)
      }
    }
  }, [])

  // Filtrar datos según los filtros seleccionados
  useEffect(() => {
    let filteredHistory = [...orderHistory]

    // Filtrar por tiempo
    if (timeFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (timeFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filteredHistory = filteredHistory.filter((order) => new Date(order.date) >= filterDate)
    }

    // Filtrar por vendedor
    if (vendorFilter !== "all") {
      filteredHistory = filteredHistory.filter((order) => order.vendorName === vendorFilter)
    }

    // Procesar datos filtrados
    processData(filteredHistory)
  }, [timeFilter, vendorFilter, orderHistory])

  const processData = (data: OrderHistoryItem[]) => {
    // Calcular productos más vendidos
    const productSales: Record<number, { name: string; quantity: number; total: number }> = {}

    data.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            total: 0,
          }
        }

        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].total += item.price * item.quantity
      })
    })

    const topProductsArray = Object.entries(productSales)
      .map(([id, data]) => ({
        id: Number.parseInt(id),
        name: data.name,
        quantity: data.quantity,
        total: data.total,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    setTopProducts(topProductsArray)

    // Calcular ventas por fecha
    const salesByDateMap: Record<string, { orders: number; total: number }> = {}

    data.forEach((order) => {
      const date = new Date(order.date).toLocaleDateString()

      if (!salesByDateMap[date]) {
        salesByDateMap[date] = {
          orders: 0,
          total: 0,
        }
      }

      salesByDateMap[date].orders += 1
      salesByDateMap[date].total += order.finalTotal || order.total
    })

    const salesByDateArray = Object.entries(salesByDateMap)
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        total: data.total,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setSalesByDate(salesByDateArray)
  }

  const exportToCSV = () => {
    // Crear encabezados CSV
    let csv = "Fecha,Cliente,Vendedor,Productos,Cantidad,Subtotal,Descuento,Total\n"

    // Agregar filas
    orderHistory.forEach((order) => {
      const date = new Date(order.date).toLocaleDateString()
      const discount = order.discount ? `${order.discount}%` : "0%"
      const total = order.finalTotal || order.total

      // Crear una fila por cada producto en el pedido
      order.items.forEach((item) => {
        const row = [
          date,
          order.customerName,
          order.vendorName,
          item.productName,
          item.quantity,
          formatCurrency(item.price * item.quantity).replace(",", ""),
          discount,
          formatCurrency(total).replace(",", ""),
        ]

        csv += row.join(",") + "\n"
      })
    })

    // Crear y descargar el archivo
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `ventas_sabornuts_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!vendorInfo) {
    return null
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Estadísticas de Ventas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => router.push("/productos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="time-filter" className="block text-sm font-medium mb-1">
            Período
          </label>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger id="time-filter">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="vendor-filter" className="block text-sm font-medium mb-1">
            Vendedor
          </label>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger id="vendor-filter">
              <SelectValue placeholder="Seleccionar vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vendedores</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-6">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="dates">Ventas por Fecha</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total de Ventas</CardTitle>
                <CardDescription>Monto total de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(orderHistory.reduce((sum, order) => sum + (order.finalTotal || order.total), 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pedidos</CardTitle>
                <CardDescription>Número total de pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{orderHistory.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Promedio</CardTitle>
                <CardDescription>Valor promedio por pedido</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {orderHistory.length > 0
                    ? formatCurrency(
                        orderHistory.reduce((sum, order) => sum + (order.finalTotal || order.total), 0) /
                          orderHistory.length,
                      )
                    : formatCurrency(0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>Los 10 productos con mayor cantidad de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">Producto</th>
                      <th className="py-2 px-4 text-right">Cantidad</th>
                      <th className="py-2 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 px-4 text-center text-muted-foreground">
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((product) => (
                        <tr key={product.id} className="border-b">
                          <td className="py-3 px-4">{product.name}</td>
                          <td className="py-3 px-4 text-right">{product.quantity}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(product.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dates">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Fecha</CardTitle>
              <CardDescription>Resumen de ventas agrupadas por fecha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">Fecha</th>
                      <th className="py-2 px-4 text-right">Pedidos</th>
                      <th className="py-2 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByDate.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 px-4 text-center text-muted-foreground">
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      salesByDate.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">{item.date}</td>
                          <td className="py-3 px-4 text-right">{item.orders}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

