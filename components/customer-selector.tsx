"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, UserPlus, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, type Customer } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function CustomerSelector({
  onSelectCustomer,
}: {
  onSelectCustomer: (name: string, address: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false)
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
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

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setNewCustomerName(customer.name)
    setNewCustomerAddress(customer.address)
    setIsEditCustomerOpen(true)
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return
    if (!newCustomerName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const updatedCustomer: Customer = {
      ...editingCustomer,
      name: newCustomerName.trim(),
      address: newCustomerAddress.trim(),
    }

    try {
      await updateCustomer(updatedCustomer)

      // Actualizar la lista de clientes
      setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)))

      setIsEditCustomerOpen(false)
      setEditingCustomer(null)
      setNewCustomerName("")
      setNewCustomerAddress("")

      toast({
        title: "Cliente actualizado",
        description: `${updatedCustomer.name} ha sido actualizado correctamente`,
      })

      // Si el cliente editado es el seleccionado, actualizar la selección
      if (selectedCustomer === updatedCustomer.id) {
        onSelectCustomer(updatedCustomer.name, updatedCustomer.address)
      }
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCustomerConfirm = async () => {
    if (!editingCustomer) return

    setIsLoading(true)

    try {
      await deleteCustomer(editingCustomer.id)

      // Actualizar la lista de clientes
      setCustomers((prev) => prev.filter((c) => c.id !== editingCustomer.id))

      // Si el cliente eliminado es el seleccionado, limpiar la selección
      if (selectedCustomer === editingCustomer.id) {
        setSelectedCustomer("")
        onSelectCustomer("", "")
      }

      setIsDeleteCustomerOpen(false)
      setEditingCustomer(null)

      toast({
        title: "Cliente eliminado",
        description: `${editingCustomer.name} ha sido eliminado de la lista de clientes`,
      })
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Intente nuevamente.",
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
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn("mr-2 h-4 w-4", selectedCustomer === customer.id ? "opacity-100" : "opacity-0")}
                        />
                        {customer.name}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCustomer(customer)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingCustomer(customer)
                              setIsDeleteCustomerOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Diálogo para agregar cliente */}
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

      {/* Diálogo para editar cliente */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-customer-name">Nombre del cliente</Label>
              <Input
                id="edit-customer-name"
                placeholder="Nombre completo"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-customer-address">Dirección</Label>
              <Input
                id="edit-customer-address"
                placeholder="Dirección de entrega"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCustomerOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar cliente */}
      <AlertDialog open={isDeleteCustomerOpen} onOpenChange={setIsDeleteCustomerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente {editingCustomer?.name} y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomerConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

