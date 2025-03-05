"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useVendor } from "@/components/vendor-provider"
import { v4 as uuidv4 } from "uuid"

export default function LoginPage() {
  const [vendorName, setVendorName] = useState("")
  const [storeLocation, setStoreLocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { vendorInfo, setVendorInfo } = useVendor()

  // Verificar si ya hay un vendedor logueado
  useEffect(() => {
    setMounted(true)
    if (vendorInfo) {
      router.push("/productos")
    }
  }, [vendorInfo, router])

  const handleLogin = () => {
    if (!vendorName.trim()) {
      return
    }

    setIsLoading(true)

    // Simular un pequeño retraso para mostrar el estado de carga
    setTimeout(() => {
      // Crear información del vendedor
      const newVendorInfo = {
        id: uuidv4(),
        name: vendorName.trim(),
        storeLocation: storeLocation.trim() || undefined,
      }

      // Guardar información del vendedor
      setVendorInfo(newVendorInfo)

      // Redirigir a la página de productos
      router.push("/productos")
    }, 1000)
  }

  // No renderizar nada hasta que el componente esté montado
  // Esto evita errores de hidratación
  if (!mounted) {
    return null
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sabornuts-logo text-primary">Sabornuts</CardTitle>
          <CardDescription>Ingresa tus datos para comenzar a tomar pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Nombre del Vendedor</Label>
              <Input
                id="vendor-name"
                placeholder="Ingresa tu nombre"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-location">Ubicación (opcional)</Label>
              <Input
                id="store-location"
                placeholder="Sucursal o ubicación"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={!vendorName.trim() || isLoading}>
            {isLoading ? "Iniciando..." : "Iniciar Sesión"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

