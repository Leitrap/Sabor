"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getCustomers, addCustomer, type Customer } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export function CustomerSelector({
  onSelectCustomer,
}: {
  onSelectCustomer: (name: string, address: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Cargar clientes guardados
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true)
      try {
        const loadedCustomers = await getCustomers()
        setCustomers(loadedCustomers)
      } catch (error) {
        console.error("Error loading customers:", error)
        // Fallback a localStorage
        const savedCustomers = localStorage.getItem("sabornuts-customers")
        if (savedCustomers) {
          try {
            setCustomers(JSON.parse(savedCustomers))
          } catch (e) {
            console.error("Error al cargar clientes guardados", e)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomer(customerId)
    setOpen(false)

    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      onSelectCustomer(customer.name, customer.address)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const newCustomer: Customer = {
      id: uuidv4(),
      name: newCustomerName.trim(),
      address: newCustomerAddress.trim(),
    }

    try {
      await addCustomer(newCustomer)

      // Actualizar la lista de clientes
      setCustomers((prev) => [...prev, newCustomer])

      setNewCustomerName("")
      setNewCustomerAddress("")
      setIsAddCustomerOpen(false)

      toast({
        title: "Cliente agregado",
        description: `${newCustomer.name} ha sido agregado a la lista de clientes`,
      })

      // Seleccionar automáticamente el nuevo cliente
      handleSelectCustomer(newCustomer.id)
    } catch (error) {
      console.error("Error adding customer:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full">
              {selectedCustomer
                ? customers.find((customer) => customer.id === selectedCustomer)?.name
                : "Seleccionar cliente..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px]">
            <Command>
              <CommandInput placeholder="Buscar cliente..." />
              <CommandList>
                <CommandEmpty>{isLoading ? "Cargando clientes..." : "No se encontraron clientes."}</CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => handleSelectCustomer(customer.id)}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedCustomer === customer.id ? "opacity-100" : "opacity-0")}
                      />
                      {customer.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)}>
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nombre del cliente</Label>
              <Input
                id="customer-name"
                placeholder="Nombre completo"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Dirección</Label>
              <Input
                id="customer-address"
                placeholder="Dirección de entrega"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
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

