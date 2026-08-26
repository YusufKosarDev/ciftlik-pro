"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";

export function AddToCartButton({
  product,
}: {
  product: { productId: string; name: string; price: number; unit: string | null };
}) {
  const t = useTranslations("Store");
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleAdd} className="w-full">
      {added ? (
        <>
          <Check className="h-4 w-4" /> {t("added")}
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" /> {t("addToCart")}
        </>
      )}
    </Button>
  );
}
