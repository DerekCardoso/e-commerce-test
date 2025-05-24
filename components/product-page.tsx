"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";

import { getProduct, sendCheckout } from "@/services/api";

// Tipagem de dados
interface ProductVariant {
  id: number;
  product_id: number;
  values: string[];
  price: string;
  inventory_quantity: number;
  image_url: string;
}

interface ProductData {
  id: number;
  title: string;
  options: string[];
  values: string[][];
  variants: ProductVariant[];
  image_url: string;
  images: { id: number; src: string }[];
}

interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

// ------------------------------------------------------

export default function ProductPage() {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [variant, setVariant] = useState<ProductVariant | null>(null);

  const { addToCart } = useCart();

  // Estado do CEP
  const [cep, setCep] = useState<string>("");
  const [address, setAddress] = useState<AddressData | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState<boolean>(false);
  const [cepError, setCepError] = useState<string>("");

  // ------------------------------------------------------

  useEffect(() => {
    const loadProduct = async () => {
      const data = await getProduct();
      setProduct(data);
      setMainImage(data.image_url);
      setSelectedValues(new Array(data.options.length).fill(""));
    };
    loadProduct();
  }, []);

  const handleSelect = (index: number, value: string) => {
    const updated = [...selectedValues];
    updated[index] = value;
    setSelectedValues(updated);

    const matchedVariant = product?.variants.find((v) =>
      v.values.every((val, i) => val === updated[i])
    );

    setVariant(matchedVariant || null);
    if (matchedVariant?.image_url) {
      setMainImage(matchedVariant.image_url);
    }
  };

  const handleCheckout = async () => {
    if (!variant) {
      alert("Selecione uma combinação válida!");
      return;
    }

    try {
      const payload = [
        {
          values: variant.values,
          quantity: 1,
          product_id: variant.product_id,
          variant_id: variant.id,
        },
      ];
      await sendCheckout(payload); //não entendi o porque está sinalizando erro
      alert("Checkout realizado com sucesso!");
    } catch (err) {
      alert("Erro no checkout.");
      console.error(err);
    }
  };

  // ------------------------------------------------------
  // Funções de CEP
  const formatCep = (value: string): string => {
    const numericValue = value.replace(/\D/g, "");
    const truncated = numericValue.slice(0, 8);
    return truncated.length > 5
      ? `${truncated.slice(0, 5)}-${truncated.slice(5)}`
      : truncated;
  };

  const isValidCep = (cep: string) => {
    const numericCep = cep.replace(/\D/g, "");
    return numericCep.length === 8;
  };

  const fetchAddressByCep = async (cepToFetch: string = cep) => {
    setCepError("");
    if (!isValidCep(cepToFetch)) {
      setCepError("CEP inválido.");
      setAddress(null);
      return;
    }
    setIsLoadingCep(true);
    try {
      const cleanCep = cepToFetch.replace(/\D/g, "");
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepError("CEP não encontrado.");
        setAddress(null);
        return;
      }

      setAddress(data);
      setCepError("");
    } catch (err) {
      console.error(err);
      setCepError("Erro ao buscar CEP.");
      setAddress(null);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatCep(input);
    setCep(formatted);

    if (cepError && formatted.length < 9) setCepError("");

    if (isValidCep(formatted)) {
      setTimeout(() => fetchAddressByCep(formatted), 100);
    } else if (formatted.length === 9) {
      setCepError("CEP inválido.");
    } else {
      setAddress(null);
    }
  };

  const handleSearchClick = () => fetchAddressByCep();

  // ------------------------------------------------------

  if (!product) return <p>Carregando...</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagem */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
            <Image
              src={mainImage}
              alt={product.title}
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setMainImage(img.src)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${
                  mainImage === img.src ? "ring-2 ring-rose-500" : ""
                }`}
              >
                <Image src={img.src} alt={`Imagem`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{product.title}</h1>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              R$ {variant?.price || product.variants[0]?.price}
            </p>
          </div>

          <Separator />

          {/* Seletores */}
          {product.options.map((option, index) => (
            <div key={option}>
              <h2 className="mb-3 text-lg font-medium">{option}</h2>
              <div className="flex flex-wrap gap-3">
                {product.values[index].map((val) => (
                  <button
                    key={val}
                    className={`rounded-md border px-4 py-2 transition-all ${
                      selectedValues[index] === val
                        ? "border-rose-500 bg-rose-50 text-rose-600"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => handleSelect(index, val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Separator />

          {/* Estoque */}
          {selectedValues.every((v) => v) && (
            <div className="mt-2">
              {variant ? (
                variant.inventory_quantity > 0 ? (
                  <p className="text-green-600">
                    Em estoque: {variant.inventory_quantity} unidades
                  </p>
                ) : (
                  <p className="text-red-500">Produto sem estoque</p>
                )
              ) : (
                <p className="text-gray-500">Variante não encontrada</p>
              )}
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
              <Button
                onClick={handleSearchClick}
                disabled={isLoadingCep || !isValidCep(cep)}
                className="shrink-0"
              >
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

          {/* Checkout */}
          <Button
            size="lg"
            className="mt-2 bg-rose-600 hover:bg-rose-700"
            disabled={!variant || variant.inventory_quantity === 0}
            onClick={() => {
              if (variant) {
                addToCart({
                  id: product.id.toString(),
                  name: product.title,
                  price: parseFloat(variant.price),
                  image: mainImage,
                  color: variant.values[0],
                  size: variant.values[1] || "",
                  quantity: 1,
                });
              }
            }}
          >
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}
