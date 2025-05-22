import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <Image
        src={"/images/notfound.png"}
        alt="Smoe thing went wrong image"
        width={600}
        height={600}
      />
      <h2 className="heading mb-[10px]">PAGE NOT FOUND</h2>
      <Link href={"/shop"}>
        <Button>Go to Shop Page</Button>
      </Link>
    </div>
  );
}
