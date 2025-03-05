"use client"

import type React from "react"

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
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, type Customer } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import { Users, Pencil, Trash2, Search } from "lucide-react"
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

interface CustomerSelectorProps {
  onSelectCustomer: (name: string, address: string) => void
}

export function CustomerSelector({ onSelectCustomer }: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false)
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerForm, setCustomerForm] = useState({
    name: "",
    address: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
    }
  }, [isOpen])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        (customer.address && customer.address.toLowerCase().includes(term)),
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const loadedCustomers = await getCustomers()
      setCustomers(loadedCustomers)
      setFilteredCustomers(loadedCustomers)
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

  const handleEditCustomer = (customer: Customer, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedCustomer(customer)
    setCustomerForm({
      name: customer.name,
      address: customer.address || "",
    })
    setIsEditCustomerOpen(true)
  }

  const handleDeleteCustomer = (customer: Customer, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedCustomer(customer)
    setIsDeleteCustomerOpen(true)
  }

  const handleAddCustomer = async () => {
    if (!customerForm.name.trim()) {
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
        name: customerForm.name.trim(),
        address: customerForm.address.trim(),
      }

      await addCustomer(customer)

      setCustomers((prev) => [...prev, customer])
      setFilteredCustomers((prev) => {
        if (
          !searchTerm.trim() ||
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
        ) {
          return [...prev, customer]
        }
        return prev
      })

      setCustomerForm({ name: "", address: "" })
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

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return

    if (!customerForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const updatedCustomer: Customer = {
        ...selectedCustomer,
        name: customerForm.name.trim(),
        address: customerForm.address.trim(),
      }

      await updateCustomer(updatedCustomer)

      setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)))

      setFilteredCustomers((prev) => {
        const shouldInclude =
          !searchTerm.trim() ||
          updatedCustomer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (updatedCustomer.address && updatedCustomer.address.toLowerCase().includes(searchTerm.toLowerCase()))

        const exists = prev.some((c) => c.id === updatedCustomer.id)

        if (exists) {
          return prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
        } else if (shouldInclude) {
          return [...prev, updatedCustomer]
        } else {
          return prev.filter((c) => c.id !== updatedCustomer.id)
        }
      })

      setIsEditCustomerOpen(false)
      setSelectedCustomer(null)
      setCustomerForm({ name: "", address: "" })

      toast({
        title: "Cliente actualizado",
        description: `${updatedCustomer.name} ha sido actualizado correctamente`,
      })
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCustomerConfirm = async () => {
    if (!selectedCustomer) return

    setIsLoading(true)
    try {
      await deleteCustomer(selectedCustomer.id)

      setCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id))
      setFilteredCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id))

      setIsDeleteCustomerOpen(false)
      setSelectedCustomer(null)

      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
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
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleEditCustomer(customer, e)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteCustomer(customer, e)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
                value={customerForm.name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">Dirección (opcional)</Label>
              <Input
                id="customer-address"
                placeholder="Dirección del cliente"
                value={customerForm.address}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
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

      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-customer-name">Nombre del cliente</Label>
              <Input
                id="edit-customer-name"
                placeholder="Nombre del cliente"
                value={customerForm.name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-customer-address">Dirección (opcional)</Label>
              <Input
                id="edit-customer-address"
                placeholder="Dirección del cliente"
                value={customerForm.address}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
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

      <AlertDialog open={isDeleteCustomerOpen} onOpenChange={setIsDeleteCustomerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente {selectedCustomer?.name} y no se puede deshacer.
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

