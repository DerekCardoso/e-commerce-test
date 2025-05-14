"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Check, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// Importe o hook useCart no topo do arquivo
import { useCart } from "@/hooks/use-cart"

// Tipos
interface ProductVariant {
  color: string
  sizes: string[]
}

interface ProductData {
  id: string
  name: string
  price: number
  description: string
  images: string[]
  variants: ProductVariant[]
}

interface AddressData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

// Dados do produto
const productData: ProductData = {
  id: "1",
  name: "Camiseta Premium Algodão Pima",
  price: 129.9,
  description:
    "Camiseta confeccionada em algodão Pima de alta qualidade, proporcionando conforto excepcional e durabilidade. Ideal para o dia a dia, com acabamento premium e design atemporal.",
  images: [
    "/placeholder.svg?height=600&width=600",
    "/placeholder.svg?height=600&width=600&text=Imagem+2",
    "/placeholder.svg?height=600&width=600&text=Imagem+3",
    "/placeholder.svg?height=600&width=600&text=Imagem+4",
  ],
  variants: [
    {
      color: "Preto",
      sizes: ["P", "M", "G", "GG"],
    },
    {
      color: "Branco",
      sizes: ["P", "M", "G", "GG"],
    },
    {
      color: "Azul",
      sizes: ["P", "M", "G"],
    },
  ],
}

export default function ProductPage() {
  // Estados
  const [mainImage, setMainImage] = useState<string>(productData.images[0])
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [cep, setCep] = useState<string>("")
  const [address, setAddress] = useState<AddressData | null>(null)
  const [isLoadingCep, setIsLoadingCep] = useState<boolean>(false)
  const [cepError, setCepError] = useState<string>("")

  // Dentro do componente ProductPage, adicione:
  const { addToCart } = useCart()

  // Efeito para carregar dados salvos do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("productSelections")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        const timestamp = parsedData.timestamp || 0
        const now = new Date().getTime()

        // Verificar se os dados têm menos de 15 minutos (900000 ms)
        if (now - timestamp < 900000) {
          setMainImage(parsedData.mainImage || productData.images[0])
          setSelectedColor(parsedData.selectedColor || "")
          setSelectedSize(parsedData.selectedSize || "")
          setCep(parsedData.cep || "")
          setAddress(parsedData.address || null)
        } else {
          // Limpar dados expirados
          localStorage.removeItem("productSelections")
        }
      } catch (e) {
        console.error("Erro ao carregar dados salvos:", e)
      }
    }
  }, [])

  // Efeito para salvar dados no localStorage
  useEffect(() => {
    const dataToSave = {
      mainImage,
      selectedColor,
      selectedSize,
      cep,
      address,
      timestamp: new Date().getTime(),
    }

    localStorage.setItem("productSelections", JSON.stringify(dataToSave))
  }, [mainImage, selectedColor, selectedSize, cep, address])

  // Adicione um novo useEffect para atualizar o timestamp quando o usuário interage com a página
  useEffect(() => {
    // Função para atualizar o timestamp das seleções do produto
    const updateProductTimestamp = () => {
      const savedData = localStorage.getItem("productSelections")
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          parsedData.timestamp = new Date().getTime()
          localStorage.setItem("productSelections", JSON.stringify(parsedData))
        } catch (e) {
          console.error("Erro ao atualizar timestamp:", e)
        }
      }
    }

    // Adicionar event listeners para detectar interações do usuário
    window.addEventListener("click", updateProductTimestamp)
    window.addEventListener("keydown", updateProductTimestamp)
    window.addEventListener("touchstart", updateProductTimestamp)

    // Verificar expiração periodicamente (a cada minuto)
    const checkExpiration = () => {
      const savedData = localStorage.getItem("productSelections")
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          const timestamp = parsedData.timestamp || 0
          const now = new Date().getTime()

          // Se passaram mais de 15 minutos (900000 ms)
          if (now - timestamp > 900000) {
            localStorage.removeItem("productSelections")
          }
        } catch (e) {
          console.error("Erro ao verificar expiração:", e)
        }
      }
    }

    const expirationInterval = setInterval(checkExpiration, 60000)

    return () => {
      // Limpar event listeners e interval
      window.removeEventListener("click", updateProductTimestamp)
      window.removeEventListener("keydown", updateProductTimestamp)
      window.removeEventListener("touchstart", updateProductTimestamp)
      clearInterval(expirationInterval)
    }
  }, [])

  // Função para formatar CEP
  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 9)
  }

  // Função para consultar CEP
  const fetchAddressByCep = async () => {
    if (cep.length < 8) {
      setCepError("CEP inválido")
      return
    }

    const cleanCep = cep.replace(/\D/g, "")

    if (cleanCep.length !== 8) {
      setCepError("CEP deve conter 8 dígitos")
      return
    }

    setIsLoadingCep(true)
    setCepError("")

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setCepError("CEP não encontrado")
        setAddress(null)
      } else {
        setAddress(data)
      }
    } catch (error) {
      setCepError("Erro ao consultar CEP")
      console.error("Erro na consulta de CEP:", error)
    } finally {
      setIsLoadingCep(false)
    }
  }

  // Função para lidar com mudança de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCep = formatCep(e.target.value)
    setCep(formattedCep)

    if (formattedCep.length === 9) {
      fetchAddressByCep()
    } else {
      setAddress(null)
    }
  }

  // Função para selecionar cor
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    // Resetar tamanho quando a cor muda
    setSelectedSize("")
  }

  // Obter tamanhos disponíveis para a cor selecionada
  const availableSizes = selectedColor ? productData.variants.find((v) => v.color === selectedColor)?.sizes || [] : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seção de imagens */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
            <Image
              src={mainImage || "/placeholder.svg"}
              alt={productData.name}
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {productData.images.map((img, index) => (
              <button
                key={index}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${mainImage === img ? "ring-2 ring-rose-500" : ""}`}
                onClick={() => setMainImage(img)}
              >
                <Image src={img || "/placeholder.svg"} alt={`Miniatura ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Informações do produto */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{productData.name}</h1>
            <p className="mt-2 text-3xl font-bold text-rose-600">R$ {productData.price.toFixed(2).replace(".", ",")}</p>
            <p className="mt-4 text-gray-600">{productData.description}</p>
          </div>

          <Separator />

          {/* Seletor de cor */}
          <div>
            <h2 className="mb-3 text-lg font-medium">Cor</h2>
            <div className="flex flex-wrap gap-3">
              {productData.variants.map((variant, index) => (
                <button
                  key={index}
                  className={`rounded-md border px-4 py-2 transition-all ${
                    selectedColor === variant.color
                      ? "border-rose-500 bg-rose-50 text-rose-600"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => handleColorSelect(variant.color)}
                >
                  {variant.color}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de tamanho */}
          {selectedColor && (
            <div>
              <h2 className="mb-3 text-lg font-medium">Tamanho</h2>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => (
                    <div key={size}>
                      <RadioGroupItem value={size} id={`size-${size}`} className="peer sr-only" />
                      <Label
                        htmlFor={`size-${size}`}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-gray-300 peer-data-[state=checked]:border-rose-500 peer-data-[state=checked]:bg-rose-50 peer-data-[state=checked]:text-rose-600"
                      >
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          <Separator />

          {/* Verificação de CEP */}
          <div>
            <h2 className="mb-3 text-lg font-medium flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Calcular frete e prazo
            </h2>

            <div className="flex max-w-md gap-2">
              <div className="w-full">
                <Input type="text" placeholder="Digite seu CEP" value={cep} onChange={handleCepChange} maxLength={9} />
                {cepError && <p className="mt-1 text-sm text-red-500">{cepError}</p>}
              </div>
              <Button onClick={fetchAddressByCep} disabled={isLoadingCep || cep.length < 8} className="shrink-0">
                {isLoadingCep ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            {address && (
              <div className="mt-4 rounded-md bg-gray-50 p-3">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço encontrado:</p>
                    <p className="text-gray-600">
                      {address.logradouro}
                      {address.complemento ? `, ${address.complemento}` : ""}, {address.bairro}
                    </p>
                    <p className="text-gray-600">
                      {address.localidade} - {address.uf}, {address.cep}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-600 hover:underline"
              >
                Não sei meu CEP
              </a>
            </div>
          </div>

          <Separator />

          {/* Botão de compra */}
          <Button
            size="lg"
            className="mt-2 bg-rose-600 hover:bg-rose-700"
            disabled={!selectedColor || !selectedSize}
            onClick={() => {
              if (selectedColor && selectedSize) {
                addToCart({
                  id: productData.id,
                  name: productData.name,
                  price: productData.price,
                  image: mainImage,
                  color: selectedColor,
                  size: selectedSize,
                  quantity: 1,
                })
              }
            }}
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </div>
  )
}
