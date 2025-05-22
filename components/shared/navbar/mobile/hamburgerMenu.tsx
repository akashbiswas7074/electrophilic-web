"use client";
import { useAtom, useStore } from "jotai";
import React from "react";
import { hamburgerMenuState } from "../store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight, Menu, Package, Truck, User } from "lucide-react";

const MobileHamBurgerMenu = ({
  navItems,
}: {
  navItems: { name: string; icon: any; hasSubmenu?: boolean }[];
}) => {
  const [hamMenuOpen, setHamMenuOpen] = useAtom(hamburgerMenuState, {
    store: useStore(),
  });
  const handleOnClickHamurgerMenu = () => {
    setHamMenuOpen(true);
  };
  return (
    <Sheet open={hamMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={() => handleOnClickHamurgerMenu()}
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[400px] overflow-y-auto"
      >
        <div className="flex items-center space-x-4 mb-2">
          <User size={40} className=" border-2 border-black p-1 rounded-full" />
          <div>
            <p className="text-sm font-medium">Download our app</p>
            <p className="text-sm text-muted-foreground">and get 10% OFF!</p>
          </div>
        </div>
        <Button className="w-full mb-2 bg-red-500 hover:bg-red-600 text-white rounded-none">
          Download App
        </Button>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 bg-[#E4E4E4] rounded-none"
          >
            <Package size={20} />
            <span>MY ORDERS</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 bg-[#E4E4E4] rounded-none"
          >
            <Truck size={20} />
            <span>TRACK ORDER</span>
          </Button>
        </div>
        <div className="space-y-4">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between py-2 border-b border-b-gray-300 cursor-pointer"
              onClick={() => setHamMenuOpen(false)} // Close menu on item click
            >
              <div className="flex items-center space-x-4">
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </div>
              {item.hasSubmenu && <ChevronRight size={20} />}
            </div>
          ))}
        </div>
        <div className="mt-6 bg-green-500 p-4 rounded-lg">
          <p className="text-white font-bold">NEW LAUNCH ALERT!</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileHamBurgerMenu;
