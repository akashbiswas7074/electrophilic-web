"use client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAtom, useStore } from "jotai";
import { accountMenuState } from "./store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";

const AccountDropDown = () => {
  const { isSignedIn: isLoggedIn } = useUser();
  const { signOut } = useClerk();

  const [accountMenuOpen, setAccountMenuOpen] = useAtom(accountMenuState, {
    store: useStore(),
  });
  const handleOnClickAccountMenu = () => {
    setAccountMenuOpen(true);
    console.log("acc", accountMenuOpen);
  };

  return (
    <DropdownMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:flex"
          onClick={handleOnClickAccountMenu}
        >
          <User size={24} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isLoggedIn ? (
            <>
              {" "}
              <Link href={"/profile"}>
                <DropdownMenuItem>
                  <User />
                  <span>Profile</span>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
            </>
          ) : (
            <>
              {" "}
              <Link href={"/sign-up"}>
                <DropdownMenuItem>
                  <User />
                  <span>Sign up</span>
                </DropdownMenuItem>
              </Link>
              <Link href={"/sign-in"}>
                <DropdownMenuItem>
                  <User />
                  <span>Sign in</span>
                </DropdownMenuItem>
              </Link>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {!isLoggedIn ? (
          <p className="text-[12px] text-gray-400">
            Sign up or log in to view your orders, set up billing details,
            unlock discounts, and much more!
          </p>
        ) : (
          <DropdownMenuItem
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
          >
            <LogOut />
            <span>Log out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountDropDown;
