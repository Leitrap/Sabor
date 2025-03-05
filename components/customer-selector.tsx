"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCustomers, addCustomer, type Customer } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import { Users } from "lucide-react"

interface CustomerSelectorProps {
  onSelectCustomer: (name: string, address: string) => void
}

export function CustomerSelector({ onSelectCustomer }: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    address: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
    }
  }, [isOpen])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const loadedCustomers = await getCustomers()
      setCustomers(loadedCustomers)
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer.name, customer.address)
    setIsOpen(false)
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const customer: Customer = {
        id: uuidv4(),
        name: newCustomer.name.trim(),
        address: newCustomer.address.trim(),
      }

      await addCustomer(customer)

      setCustomers((prev) => [...prev, customer])
      setNewCustomer({ name: "", address: "" })
      setIsAddCustomerOpen(false)

      toast({
        title: "Cliente agregado",
        description: `${customer.name} ha sido agregado correctamente`,
      })
    } catch (error) {
      console.error("Error adding customer:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        <Users className="mr-2 h-4 w-4" />
        Seleccionar cliente
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar cliente</DialogTitle>
            <DialogDescription>Selecciona un cliente existente o agrega uno nuevo</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => setIsAddCustomerOpen(true)}>Nuevo cliente</Button>
            </div>

            <div className="max-h-60 overflow-auto border rounded-md">
              {isLoading ? (
                <div className="p-4 text-center">
                  <p className="text-muted-foreground">Cargando clientes...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron clientes que coincidan con la búsqueda"
                      : "No hay clientes registrados"}
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <li
                      key={customer.id}
                      className="p-3 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <p className="font-medium">{customer.name}</p>
                      {customer.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar nuevo cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nombre del cliente</Label>
              <Input
                id="customer-name"
                placeholder="Nombre del cliente"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">Dirección (opcional)</Label>
              <Input
                id="customer-address"
                placeholder="Dirección del cliente"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAddCustomer} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

