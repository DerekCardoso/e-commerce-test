"use client"

import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { Separator } from "@/components/ui/separator"
import { sendCheckout } from "@/services/api"

export default function CartDrawer() {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart()

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    try {
      const payload = cartItems.map(item => ({
        values: [item.color, item.size],
        quantity: item.quantity,
        product_id: parseInt(item.id),
        variant_id: parseInt(item.id), // Assumindo que o variant_id é o mesmo que o product_id
      }));

      await sendCheckout(payload);
      alert("Checkout realizado com sucesso!");
      clearCart();
    } catch (err) {
      alert("Erro no checkout.");
      console.error(err);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <ShoppingBag className="h-12 w-12 text-gray-300" />
        <div>
          <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
          <p className="text-sm text-gray-500 mt-1">Adicione produtos ao seu carrinho para continuar comprando.</p>
        </div>
        <Button className="mt-4 bg-rose-600 hover:bg-rose-700">Continuar comprando</Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-lg font-medium">Seu Carrinho</h2>
        <span className="text-sm text-gray-500">{cartItems.length} itens</span>
      </div>
      <Separator />

      <div className="flex-1 overflow-y-auto py-4">
        {cartItems.map((item, index) => (
          <div key={`${item.id}-${item.color}-${item.size}-${index}`} className="flex py-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
              <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
            </div>

            <div className="ml-4 flex flex-1 flex-col">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium">{item.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Cor: {item.color} | Tamanho: {item.size}
                  </p>
                </div>
                <p className="text-sm font-medium">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</p>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-red-500"
                  onClick={() => removeFromCart(item.id, item.color, item.size)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t py-4">
        <div className="flex justify-between py-2">
          <span className="text-sm">Subtotal</span>
          <span className="text-sm font-medium">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-sm">Frete</span>
          <span className="text-sm font-medium">Calculado no checkout</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-base font-medium">Total</span>
          <span className="text-base font-medium">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
        </div>

        <Button 
          className="mt-4 w-full bg-rose-600 hover:bg-rose-700"
          onClick={handleCheckout}
        >
          Finalizar Compra
        </Button>
      </div>
    </div>
  )
}
