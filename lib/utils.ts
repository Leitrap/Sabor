import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda en pesos argentinos (ARS)
 * @param amount - El monto a formatear
 * @returns String formateado como moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea una fecha en formato local
 * @param date - La fecha a formatear
 * @returns String con la fecha formateada
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Formatea una fecha y hora en formato local
 * @param date - La fecha a formatear
 * @returns String con la fecha y hora formateada
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Trunca un texto si excede la longitud máxima
 * @param text - El texto a truncar
 * @param maxLength - La longitud máxima permitida
 * @returns El texto truncado con "..." si excede la longitud máxima
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

/**
 * Genera un color aleatorio en formato hexadecimal
 * @returns String con el color en formato hexadecimal
 */
export function getRandomColor(): string {
  const letters = "0123456789ABCDEF"
  let color = "#"
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

/**
 * Genera un array de colores para gráficos
 * @param count - Cantidad de colores a generar
 * @returns Array de colores en formato hexadecimal
 */
export function generateChartColors(count: number): string[] {
  // Colores predefinidos para los primeros elementos
  const baseColors = [
    "#00c0ad", // Verde Sabornuts
    "#50362a", // Marrón Sabornuts
    "#3b82f6", // Azul
    "#ef4444", // Rojo
    "#f59e0b", // Naranja
    "#10b981", // Verde
    "#8b5cf6", // Púrpura
    "#ec4899", // Rosa
  ]

  // Si necesitamos más colores de los predefinidos, generamos aleatorios
  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }

  const colors = [...baseColors]
  for (let i = baseColors.length; i < count; i++) {
    colors.push(getRandomColor())
  }

  return colors
}

/**
 * Calcula el porcentaje de un valor respecto a un total
 * @param value - El valor para calcular el porcentaje
 * @param total - El valor total
 * @returns El porcentaje calculado
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

