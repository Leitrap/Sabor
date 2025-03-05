"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUp, ShoppingBag, Users, Package } from "lucide-react"
import { useVendor } from "@/components/vendor-provider"
import { getOrders, getProducts, getCustomers, type Order } from "@/lib/supabase"
import { formatCurrency, generateChartColors, calculatePercentage } from "@/lib/utils"
import dynamic from "next/dynamic"

// Importar Chart.js dinámicamente para evitar errores de SSR
const Chart = dynamic(
  () =>
    import("chart.js/auto").then((mod) => {
      // Registrar los componentes necesarios
      mod.Chart.register(
        mod.CategoryScale,
        mod.LinearScale,
        mod.BarController,
        mod.BarElement,
        mod.PieController,
        mod.ArcElement,
        mod.LineController,
        mod.LineElement,
        mod.PointElement,
        mod.Tooltip,
        mod.Legend,
      )
      return mod.Chart
    }),
  { ssr: false },
)

// Componente para renderizar un gráfico de barras
const BarChart = ({ data, options }: { data: any; options: any }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const chartRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!canvasRef.current) return

    // Destruir el gráfico anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // Crear nuevo gráfico
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data,
      options,
    })

    // Limpiar al desmontar
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, options])

  return <canvas ref={canvasRef} />
}

// Componente para renderizar un gráfico de líneas
const LineChart = ({ data, options }: { data: any; options: any }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const chartRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!canvasRef.current) return

    // Destruir el gráfico anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // Crear nuevo gráfico
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data,
      options,
    })

    // Limpiar al desmontar
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, options])

  return <canvas ref={canvasRef} />
}

// Componente para renderizar un gráfico de pastel
const PieChart = ({ data, options }: { data: any; options: any }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const chartRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!canvasRef.current) return

    // Destruir el gráfico anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // Crear nuevo gráfico
    chartRef.current = new Chart(canvasRef.current, {
      type: "pie",
      data,
      options,
    })

    // Limpiar al desmontar
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, options])

  return <canvas ref={canvasRef} />
}

// Importar React para useRef
import React from "react"

export default function EstadisticasPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ventas")
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    topProducts: [] as { name: string; quantity: number; revenue: number }[],
    salesByDate: {} as Record<string, number>,
    salesByProduct: {} as Record<string, number>,
    salesByCategory: {} as Record<string, number>,
  })
  const router = useRouter()
  const { vendorInfo } = useVendor()

  // Verificar si hay un vendedor logueado
  useEffect(() => {
    if (!vendorInfo) {
      router.push("/")
    }
  }, [vendorInfo, router])

  // Cargar datos y calcular estadísticas
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Cargar pedidos
        const loadedOrders = await getOrders()
        setOrders(loadedOrders)

        // Cargar productos y clientes para estadísticas adicionales
        const products = await getProducts()
        const customers = await getCustomers()

        // Calcular estadísticas
        calculateStats(loadedOrders, products, customers)
      } catch (error) {
        console.error("Error loading data:", error)
        // Intentar cargar desde localStorage como fallback
        const savedOrders = localStorage.getItem("sabornuts-order-history")
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders)
            setOrders(parsedOrders)
            calculateStats(parsedOrders, [], [])
          } catch (e) {
            console.error("Error parsing local orders", e)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const calculateStats = (orders: Order[], products: any[], customers: any[]) => {
    // Inicializar estadísticas
    const totalSales = orders.reduce((sum, order) => sum + (order.final_total || order.total), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
    const totalCustomers = new Set(orders.map((order) => order.customer_name)).size

    // Productos más vendidos
    const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {}

    orders.forEach((order) => {
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

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Ventas por fecha
    const salesByDate: Record<string, number> = {}
    orders.forEach((order) => {
      const date = new Date(order.date).toLocaleDateString()
      if (!salesByDate[date]) {
        salesByDate[date] = 0
      }
      salesByDate[date] += order.final_total || order.total
    })

    // Ventas por producto
    const salesByProduct: Record<string, number> = {}
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!salesByProduct[item.product_name]) {
          salesByProduct[item.product_name] = 0
        }
        salesByProduct[item.product_name] += item.price * item.quantity
      })
    })

    // Ventas por categoría (usando productos cargados)
    const salesByCategory: Record<string, number> = {}
    const productCategories: Record<number, string> = {}

    // Crear mapeo de productos a categorías
    products.forEach((product) => {
      if (product.category_id) {
        productCategories[product.id] = product.category_id.toString()
      }
    })

    // Calcular ventas por categoría
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryId = productCategories[item.product_id]
        const categoryName = categoryId || "Sin categoría"

        if (!salesByCategory[categoryName]) {
          salesByCategory[categoryName] = 0
        }
        salesByCategory[categoryName] += item.price * item.quantity
      })
    })

    setStats({
      totalSales,
      totalOrders,
      averageOrderValue,
      totalCustomers,
      topProducts,
      salesByDate,
      salesByProduct,
      salesByCategory,
    })
  }

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

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-primary mr-2" />
                  <span className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 text-primary mr-2" />
                  <span className="text-2xl font-bold">{stats.totalOrders}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-primary mr-2" />
                  <span className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  <span className="text-2xl font-bold">{stats.totalCustomers}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
              <TabsTrigger value="categorias">Categorías</TabsTrigger>
            </TabsList>

            <TabsContent value="ventas">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Fecha</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {Object.keys(stats.salesByDate).length > 0 ? (
                    <LineChart
                      data={{
                        labels: Object.keys(stats.salesByDate).sort(),
                        datasets: [
                          {
                            label: "Ventas",
                            data: Object.keys(stats.salesByDate)
                              .sort()
                              .map((date) => stats.salesByDate[date]),
                            borderColor: "#00c0ad",
                            backgroundColor: "rgba(0, 192, 173, 0.1)",
                            tension: 0.3,
                            fill: true,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => formatCurrency(Number(value)),
                            },
                          },
                        },
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (context) => `Ventas: ${formatCurrency(context.parsed.y)}`,
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No hay datos de ventas disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="productos">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Productos Más Vendidos</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {stats.topProducts.length > 0 ? (
                      <BarChart
                        data={{
                          labels: stats.topProducts.map((p) => p.name),
                          datasets: [
                            {
                              label: "Ventas",
                              data: stats.topProducts.map((p) => p.revenue),
                              backgroundColor: generateChartColors(stats.topProducts.length),
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) => formatCurrency(Number(value)),
                              },
                            },
                            x: {
                              ticks: {
                                callback: function (value) {
                                  const label = this.getLabelForValue(Number(value))
                                  return label.length > 10 ? label.substring(0, 10) + "..." : label
                                },
                              },
                            },
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: (context) => `Ventas: ${formatCurrency(context.parsed.y)}`,
                              },
                            },
                            legend: {
                              display: false,
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No hay datos de productos disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Ventas por Producto</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {Object.keys(stats.salesByProduct).length > 0 ? (
                      <PieChart
                        data={{
                          labels: Object.keys(stats.salesByProduct),
                          datasets: [
                            {
                              data: Object.values(stats.salesByProduct),
                              backgroundColor: generateChartColors(Object.keys(stats.salesByProduct).length),
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const value = context.raw as number
                                  const total = (context.chart.data.datasets[0].data as number[]).reduce(
                                    (sum, val) => sum + (val as number),
                                    0,
                                  )
                                  const percentage = calculatePercentage(value, total)
                                  return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                                },
                              },
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No hay datos de productos disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categorias">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {Object.keys(stats.salesByCategory).length > 0 ? (
                    <PieChart
                      data={{
                        labels: Object.keys(stats.salesByCategory),
                        datasets: [
                          {
                            data: Object.values(stats.salesByCategory),
                            backgroundColor: generateChartColors(Object.keys(stats.salesByCategory).length),
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const value = context.raw as number
                                const total = (context.chart.data.datasets[0].data as number[]).reduce(
                                  (sum, val) => sum + (val as number),
                                  0,
                                )
                                const percentage = calculatePercentage(value, total)
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                              },
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No hay datos de categorías disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  )
}

