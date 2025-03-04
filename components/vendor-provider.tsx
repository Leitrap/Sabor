"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type VendorInfo = {
  name: string
  loginTime: string
}

type VendorContextType = {
  vendorInfo: VendorInfo | null
  setVendorInfo: (info: VendorInfo) => void
  clearVendorInfo: () => void
}

const VendorContext = createContext<VendorContextType | undefined>(undefined)

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendorInfo, setVendorInfoState] = useState<VendorInfo | null>(null)

  // Cargar información del vendedor desde localStorage al iniciar
  useEffect(() => {
    const savedVendor = localStorage.getItem("sabornuts-vendor")
    if (savedVendor) {
      try {
        setVendorInfoState(JSON.parse(savedVendor))
      } catch (e) {
        console.error("Error al cargar datos del vendedor", e)
      }
    }
  }, [])

  const setVendorInfo = (info: VendorInfo) => {
    setVendorInfoState(info)
    localStorage.setItem("sabornuts-vendor", JSON.stringify(info))
  }

  const clearVendorInfo = () => {
    setVendorInfoState(null)
    localStorage.removeItem("sabornuts-vendor")
  }

  return (
    <VendorContext.Provider value={{ vendorInfo, setVendorInfo, clearVendorInfo }}>{children}</VendorContext.Provider>
  )
}

export function useVendor() {
  const context = useContext(VendorContext)
  if (context === undefined) {
    throw new Error("useVendor debe ser usado dentro de un VendorProvider")
  }
  return context
}

