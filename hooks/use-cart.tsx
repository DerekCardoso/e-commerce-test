"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Tipos
export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  color: string
  size: string
  quantity: number
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string, color: string, size: string) => void
  updateQuantity: (itemId: string, color: string, size: string, quantity: number) => void
  clearCart: () => void
  totalPrice: number
}

// Criação do contexto
const CartContext = createContext<CartContextType | undefined>(undefined)

// Provider do carrinho
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [totalPrice, setTotalPrice] = useState(0)

  // Função para verificar se os dados do carrinho expiraram
  const checkCartExpiration = () => {
    const timestamp = localStorage.getItem("cartTimestamp")
    if (timestamp) {
      const now = new Date().getTime()
      const savedTime = Number.parseInt(timestamp, 10)

      // Se passaram mais de 15 minutos (900000 ms)
      if (now - savedTime > 900000) {
        setCartItems([])
        localStorage.removeItem("cartItems")
        localStorage.removeItem("cartTimestamp")
        return true
      }
    }
    return false
  }

  // Carregar dados do localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems")

    if (savedCart && !checkCartExpiration()) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (e) {
        console.error("Erro ao carregar carrinho:", e)
      }
    }

    // Verificar expiração periodicamente (a cada minuto)
    const expirationInterval = setInterval(checkCartExpiration, 60000)

    return () => {
      clearInterval(expirationInterval)
    }
  }, [])

  // Calcular preço total quando o carrinho mudar
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    setTotalPrice(total)

    // Salvar no localStorage com timestamp
    localStorage.setItem("cartItems", JSON.stringify(cartItems))

    // Só atualizar o timestamp se ele não existir ou se o carrinho mudar de tamanho
    // Isso evita que o tempo de expiração seja reiniciado a cada pequena alteração
    const existingTimestamp = localStorage.getItem("cartTimestamp")
    if (!existingTimestamp || cartItems.length !== JSON.parse(localStorage.getItem("cartItems") || "[]").length) {
      localStorage.setItem("cartTimestamp", new Date().getTime().toString())
    }
  }, [cartItems])

  // Adicionar um novo useEffect para atualizar o timestamp quando o usuário interage explicitamente com o carrinho
  useEffect(() => {
    // Função para atualizar o timestamp
    const updateTimestamp = () => {
      localStorage.setItem("cartTimestamp", new Date().getTime().toString())
    }

    // Adicionar event listeners para detectar interações do usuário
    window.addEventListener("click", updateTimestamp)
    window.addEventListener("keydown", updateTimestamp)
    window.addEventListener("touchstart", updateTimestamp)

    return () => {
      // Limpar event listeners
      window.removeEventListener("click", updateTimestamp)
      window.removeEventListener("keydown", updateTimestamp)
      window.removeEventListener("touchstart", updateTimestamp)
    }
  }, [])

  // Adicionar item ao carrinho
  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      // Verificar se o item já existe no carrinho (mesmo id, cor e tamanho)
      const existingItemIndex = prevItems.findIndex(
        (i) => i.id === item.id && i.color === item.color && i.size === item.size,
      )

      if (existingItemIndex >= 0) {
        // Se existir, aumentar a quantidade
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += item.quantity
        return updatedItems
      } else {
        // Se não existir, adicionar novo item
        return [...prevItems, item]
      }
    })
  }

  // Remover item do carrinho
  const removeFromCart = (itemId: string, color: string, size: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item.id === itemId && item.color === color && item.size === size)),
    )
  }

  // Atualizar quantidade de um item
  const updateQuantity = (itemId: string, color: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId, color, size)
      return
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId && item.color === color && item.size === size ? { ...item, quantity } : item,
      ),
    )
  }

  // Limpar carrinho
  const clearCart = () => {
    setCartItems([])
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook para usar o contexto do carrinho
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
