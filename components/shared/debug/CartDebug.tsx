"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function CartDebug() {
  const { cartItems, addItem, clearCart, setCartDrawerOpen } = useCart();
  const [isChecking, setIsChecking] = useState(false);
  const [dbCartInfo, setDbCartInfo] = useState<string | null>(null);
  const { data: session } = useSession();

  const addTestItem = () => {
    const testId = `test-${Date.now()}`;
    addItem({
      _id: testId,
      _uid: testId, // Added _uid property
      name: "Test Product",
      price: 9.99,
      image: "/placeholder-product.png", 
      quantity: 1
      // Add other CartItem fields if they are mandatory and not covered by _uid generation in context
      // For example, if 'size' is strictly needed by the CartItem type or _uid generation logic in context
    });
  };
  
  const checkDbCart = async () => {
    if (!session?.user?.id) {
      setDbCartInfo("Not logged in");
      return;
    }
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/debug/cart?userId=${session.user.id}`, {
        credentials: 'include', // Add credentials to include cookies in the request
      });
      const data = await response.json();
      setDbCartInfo(
        data.cart 
          ? `DB Cart: ${data.cart.products.length} items, Total: $${data.cart.cartTotal}` 
          : "No cart found in DB"
      );
    } catch (error) {
      setDbCartInfo("Error checking DB cart");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 bg-white p-4 border rounded-lg shadow-lg z-50">
      <h3 className="font-bold mb-2">Cart Debug</h3>
      <p>Local Items: {cartItems.length}</p>
      {dbCartInfo && <p className="text-xs mt-1 text-blue-600">{dbCartInfo}</p>}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex gap-2">
          <Button size="sm" onClick={addTestItem}>
            Add Test Item
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCartDrawerOpen(true)}>
            Open Cart
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={clearCart}>
            Clear Local Cart
          </Button>
          <Button size="sm" variant="secondary" onClick={checkDbCart} disabled={isChecking}>
            {isChecking ? "Checking DB..." : "Check DB Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
