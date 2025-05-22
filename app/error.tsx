"use client"; // Error boundaries must be Client Components

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <Image
        src={"/images/error.png"}
        alt="Smoe thing went wrong image"
        width={350}
        height={350}
      />
      <h2 className="heading mb-[10px]">Something went wrong!</h2>
      <Link href={"/shop"}>
        <Button>Go to Shop Page</Button>
      </Link>
    </div>
  );
}
