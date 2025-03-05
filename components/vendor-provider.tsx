"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir la interfaz para la información del vendedor
export interface VendorInfo {
  id: string
  name: string
  storeLocation?: string
}

// Definir la interfaz para el contexto
interface VendorContextType {
  vendorInfo: VendorInfo | null
  setVendorInfo: (info: VendorInfo) => void
  clearVendorInfo: () => void
}

// Crear el contexto
const VendorContext = createContext<VendorContextType | undefined>(undefined)

// Proveedor del contexto
export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendorInfo, setVendorInfoState] = useState<VendorInfo | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Cargar información del vendedor desde localStorage al montar el componente
  useEffect(() => {
    setIsClient(true)
    const savedVendorInfo = localStorage.getItem("sabornuts-vendor-info")
    if (savedVendorInfo) {
      try {
        const parsedInfo = JSON.parse(savedVendorInfo)
        setVendorInfoState(parsedInfo)
      } catch (e) {
        console.error("Error parsing vendor info from localStorage", e)
        localStorage.removeItem("sabornuts-vendor-info")
      }
    }
  }, [])

  // Función para establecer la información del vendedor
  const setVendorInfo = (info: VendorInfo) => {
    setVendorInfoState(info)
    localStorage.setItem("sabornuts-vendor-info", JSON.stringify(info))
  }

  // Función para limpiar la información del vendedor
  const clearVendorInfo = () => {
    setVendorInfoState(null)
    localStorage.removeItem("sabornuts-vendor-info")
  }

  // Solo renderizar los hijos cuando estamos en el cliente
  // Esto evita errores de hidratación
  return (
    <VendorContext.Provider
      value={{
        vendorInfo: isClient ? vendorInfo : null,
        setVendorInfo,
        clearVendorInfo,
      }}
    >
      {children}
    </VendorContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useVendor() {
  const context = useContext(VendorContext)
  if (context === undefined) {
    throw new Error("useVendor debe ser usado dentro de un VendorProvider")
  }
  return context
}

