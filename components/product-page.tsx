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
const productImages = {
  Azul: [
    "/azul.png",
    "/azul2.png",
    "/azul3.png",
    "/azul4.png",
  ],
  Preto: [
    "/preta.png",
    "/preta.png",
    "/preta.png",
    "/preta.png",
  ],
  Branco: [
    "/branca.png",
    "/branca.png",
    "/branca.png",
    "/branca.png",
  ],
}

const productData: ProductData = {
  id: "1",
  name: "Camiseta Premium Algodão",
  price: 129.9,
  description:
    "Camiseta confeccionada em algodão de alta qualidade, proporcionando conforto excepcional e durabilidade. Ideal para o dia a dia, com acabamento premium e design atemporal.",
  images: productImages.Azul, // Imagem inicial
  variants: [
    {
      color: "Azul",
      sizes: ["P", "M", "G"],
    },
    {
      color: "Preto",
      sizes: ["P", "M", "G", "GG"],
    },
    {
      color: "Branco",
      sizes: ["P", "M", "G", "GG"],
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
  const formatCep = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, "")

    // Limita a 8 dígitos
    const truncatedValue = numericValue.slice(0, 8)

    // Adiciona o hífen após o 5º dígito se houver mais de 5 dígitos
    if (truncatedValue.length > 5) {
      return `${truncatedValue.slice(0, 5)}-${truncatedValue.slice(5)}`
    }

    return truncatedValue
  }

  // Função para validar CEP
  const isValidCep = (cep: string): boolean => {
    // Remove todos os caracteres não numéricos
    const numericCep = cep.replace(/\D/g, "")
    // Verifica se tem exatamente 8 dígitos
    return numericCep.length === 8
  }

  // Função para consultar CEP na API ViaCEP
  const fetchAddressByCep = async (cepToFetch: string = cep) => {
    // Limpa mensagens de erro anteriores
    setCepError("")

    // Valida o CEP antes de fazer a consulta
    if (!isValidCep(cepToFetch)) {
      setCepError("CEP inválido. Digite os 8 dígitos do CEP.")
      setAddress(null)
      return
    }

    // Inicia o carregamento
    setIsLoadingCep(true)

    try {
      // Remove caracteres não numéricos para a consulta
      const cleanCep = cepToFetch.replace(/\D/g, "")

      // Faz a requisição para a API
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`)
      }

      const data = await response.json()

      // Verifica se a API retornou erro
      if (data.erro) {
        setCepError("CEP não encontrado")
        setAddress(null)
        return
      }

      // Atualiza o endereço com os dados retornados
      setAddress(data)
      setCepError("")
    } catch (error) {
      console.error("Erro ao consultar CEP:", error)
      setCepError("Erro ao consultar o CEP. Tente novamente.")
      setAddress(null)
    } finally {
      // Finaliza o carregamento
      setIsLoadingCep(false)
    }
  }

  // Função para lidar com mudança de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Obtém o valor atual do input
    const inputValue = e.target.value

    // Formata o CEP
    const formattedCep = formatCep(inputValue)

    // Atualiza o estado do CEP
    setCep(formattedCep)

    // Limpa mensagens de erro enquanto o usuário está digitando
    if (cepError && formattedCep.length < 9) {
      setCepError("")
    }

    // Se o CEP estiver completo (com ou sem hífen), consulta automaticamente
    if (isValidCep(formattedCep)) {
      // Pequeno timeout para garantir que o estado foi atualizado
      setTimeout(() => {
        fetchAddressByCep(formattedCep)
      }, 100)
    } else if (formattedCep.length === 9) {
      // Se tem 9 caracteres (com hífen) mas não é válido
      setCepError("CEP inválido. Digite os 8 dígitos do CEP.")
    } else if (formattedCep.length > 0) {
      // Se está digitando, limpa o endereço
      setAddress(null)
    }
  }

  // Função para lidar com o clique no botão de busca
  const handleSearchClick = () => {
    fetchAddressByCep()
  }

  // Função para selecionar cor
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setMainImage(productImages[color as keyof typeof productImages][0])
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
                <Input
                  type="text"
                  placeholder="Digite seu CEP"
                  value={cep}
                  onChange={handleCepChange}
                  maxLength={9}
                  aria-label="CEP"
                  aria-describedby="cep-error"
                  className={cepError ? "border-red-500" : ""}
                />
                {cepError && (
                  <p id="cep-error" className="mt-1 text-sm text-red-500">
                    {cepError}
                  </p>
                )}
              </div>
              <Button onClick={handleSearchClick} disabled={isLoadingCep || !isValidCep(cep)} className="shrink-0">
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
