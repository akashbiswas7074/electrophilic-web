"use client";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import React, { useEffect } from "react";
import { quantityState } from "../jotai/store";
import { useAtom, useStore } from "jotai";

const QtyButtons = ({
  product,
  size,
  style,
}: {
  product: any;
  size: number;
  style: number;
}) => {
  const [qty, setQty] = useAtom(quantityState, {
    store: useStore(),
  });
  useEffect(() => {
    setQty(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, setQty]);

  useEffect(() => {
    if (product && typeof product.quantity === "number" && qty > product.quantity) {
      setQty(product.quantity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, product, qty, setQty]);

  return (
    <div>
      <div className="flex items-center gap-0">
        <Button
          onClick={() => qty > 1 && setQty((prev: number) => prev - 1)}
          variant={"outline"}
          className="bg-[#F2F2F2]"
          size={"icon"}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center border-y-2 py-[6px]">{qty}</span>
        <Button
          onClick={() => product && typeof product.quantity === 'number' && qty < product.quantity && setQty((prev: number) => prev + 1)}
          variant={"outline"}
          className="bg-[#F2F2F2]"
          size={"icon"}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="">
        {product && typeof product.quantity === 'number' && product.quantity < 1 && (
          <span className="text-red-500">Out of Stock</span>
        )}
      </div>
    </div>
  );
};

export default QtyButtons;
