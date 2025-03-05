"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Calendar, Package, Users } from "lucide-react"
import { useVendor } from "@/components/vendor-provider"
import { getOrders, getProducts, getCustomers, type Order, type Product } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EstadisticasPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("general")
  const [customerCount, setCustomerCount] = useState(0)
  const router = useRouter()
  const { vendorInfo } = useVendor()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Cargar pedidos
        const loadedOrders = await getOrders()
        setOrders(loadedOrders)

        // Cargar productos
        const loadedProducts = await getProducts()
        setProducts(loadedProducts)

        // Cargar clientes
        const customers = await getCustomers()
        setCustomerCount(customers.length)
      } catch (error) {
        console.error("Error loading data for statistics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar pedidos según el filtro de tiempo
  const getFilteredOrders = () => {
    if (timeFilter === "all") {
      return orders
    }

    const now = new Date()
    let startDate: Date

    switch (timeFilter) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        return orders
    }

    return orders.filter((order) => new Date(order.date) >= startDate)
  }

  // Calcular estadísticas generales
  const calculateGeneralStats = () => {
    const filteredOrders = getFilteredOrders()

    // Total de ventas
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.final_total || order.total), 0)

    // Número de pedidos
    const orderCount = filteredOrders.length

    // Promedio de venta por pedido
    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0

    // Productos vendidos
    const productsSold = filteredOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    return {
      totalSales,
      orderCount,
      averageOrderValue,
      productsSold,
    }
  }

  // Calcular estadísticas de productos
  const calculateProductStats = () => {
    const filteredOrders = getFilteredOrders()

    // Productos más vendidos
    const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {}

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            name: item.product_name,
            quantity: 0,
            revenue: 0,
          }
        }

        productSales[item.product_id].quantity += item.quantity
        productSales[item.product_id].revenue += item.price * item.quantity
      })
    })

    // Convertir a array y ordenar por cantidad
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Productos con bajo stock
    const lowStockProducts = products
      .filter((product) => product.stock < 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)

    return {
      topProducts,
      lowStockProducts,
    }
  }

  const { totalSales, orderCount, averageOrderValue, productsSold } = calculateGeneralStats()
  const { topProducts, lowStockProducts } = calculateProductStats()

  if (!vendorInfo) {
    return null
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <Button variant="outline" onClick={() => router.push("/productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full md:w-auto">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Periodo" />
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
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      ) : (
        <>
          <TabsContent value="general" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{formatCurrency(totalSales)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{orderCount}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Valor Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Productos Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{productsSold}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Has realizado {orderCount} pedidos por un total de {formatCurrency(totalSales)}.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    El valor promedio por pedido es de {formatCurrency(averageOrderValue)}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay datos de ventas disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topProducts.map((product, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">Cantidad: {product.quantity}</p>
                          </div>
                          <p className="font-bold">{formatCurrency(product.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos con Bajo Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay productos con bajo stock</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lowStockProducts.map((product) => (
                        <div key={product.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p
                              className={`text-sm ${product.stock <= 5 ? "text-destructive" : "text-muted-foreground"}`}
                            >
                              Stock: {product.stock}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => router.push("/ajuste-stock")}>
                            Ajustar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Información de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{customerCount}</p>
                    <p className="text-sm text-muted-foreground">Clientes Registrados</p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <BarChart3 className="h-8 w-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{orderCount}</p>
                    <p className="text-sm text-muted-foreground">Pedidos Totales</p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
                    <p className="text-sm text-muted-foreground">Valor Promedio</p>
                  </div>
                </div>

                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Tienes {customerCount} clientes registrados que han realizado {orderCount} pedidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </>
      )}
    </main>
  )
}

