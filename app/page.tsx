"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/components/ui/use-toast"
import { useVendor } from "@/components/vendor-provider"
import { ShieldCheck, BarChart3, Settings, ShoppingBag } from "lucide-react"

export default function LoginPage() {
  const [vendorName, setVendorName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { setVendorInfo } = useVendor()

  // Verificar si ya hay un vendedor logueado
  useEffect(() => {
    const savedVendor = localStorage.getItem("sabornuts-vendor")
    if (savedVendor) {
      try {
        const vendorData = JSON.parse(savedVendor)
        if (vendorData.name) {
          router.push("/productos")
        }
      } catch (e) {
        console.error("Error al cargar datos del vendedor", e)
      }
    }
  }, [router])

  const handleLogin = () => {
    if (!vendorName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre para continuar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simular un pequeño retraso para mostrar el estado de carga
    setTimeout(() => {
      // Guardar información del vendedor
      const vendorInfo = {
        name: vendorName.trim(),
        loginTime: new Date().toISOString(),
      }

      localStorage.setItem("sabornuts-vendor", JSON.stringify(vendorInfo))
      setVendorInfo(vendorInfo)

      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${vendorName}`,
      })

      router.push("/productos")
    }, 800)
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl sabornuts-logo text-primary">Sabornuts</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Bienvenido a Sabornuts</CardTitle>
            <CardDescription className="text-center">Ingresa tu nombre para comenzar a tomar pedidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="vendor-name" className="block text-sm font-medium">
                Nombre del Vendedor
              </label>
              <Input
                id="vendor-name"
                placeholder="Ingresa tu nombre"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                autoComplete="name"
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? "Iniciando..." : "Comenzar a Vender"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck className="h-6 w-6 mb-2 text-primary" />
              <h3 className="text-sm font-medium">Seguro</h3>
              <p className="text-xs text-muted-foreground">Datos protegidos</p>
            </div>
            <div className="flex flex-col items-center">
              <ShoppingBag className="h-6 w-6 mb-2 text-primary" />
              <h3 className="text-sm font-medium">Control de Stock</h3>
              <p className="text-xs text-muted-foreground">Gestión de inventario</p>
            </div>
            <div className="flex flex-col items-center">
              <BarChart3 className="h-6 w-6 mb-2 text-primary" />
              <h3 className="text-sm font-medium">Estadísticas</h3>
              <p className="text-xs text-muted-foreground">Análisis de ventas</p>
            </div>
            <div className="flex flex-col items-center">
              <Settings className="h-6 w-6 mb-2 text-primary" />
              <h3 className="text-sm font-medium">Personalizable</h3>
              <p className="text-xs text-muted-foreground">Adaptable a tu negocio</p>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sabornuts. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </main>
  )
}

