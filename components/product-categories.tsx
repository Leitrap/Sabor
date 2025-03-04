"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Categorías de ejemplo - puedes ajustarlas según tus necesidades
const categories = [
  { id: "all", name: "Todos" },
  { id: "nuts", name: "Frutos Secos" },
  { id: "dried", name: "Frutas Secas" },
  { id: "seeds", name: "Semillas" },
  { id: "mixes", name: "Mezclas" },
]

// Asignación de productos a categorías (simplificada)
const categoryMap: Record<string, number[]> = {
  nuts: [1, 2, 3, 4, 5, 6],
  dried: [8, 9, 10, 11, 12],
  seeds: [14, 15, 16, 17],
  mixes: [7, 13, 18],
}

export function ProductCategories({
  onSelectCategory,
}: {
  onSelectCategory: (productIds: number[]) => void
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex space-x-2 pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="outline"
            size="sm"
            onClick={() => {
              if (category.id === "all") {
                // Pasar null para mostrar todos los productos
                onSelectCategory([])
              } else {
                // Pasar los IDs de productos de esta categoría
                onSelectCategory(categoryMap[category.id] || [])
              }
            }}
            className="whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}

