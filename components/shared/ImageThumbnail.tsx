import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageThumbnailProps {
  src: string;
  alt: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function ImageThumbnail({ src, alt, isSelected, onClick }: ImageThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${alt}`}
      aria-pressed={isSelected}
      className={cn(
        "aspect-square rounded-md overflow-hidden flex-shrink-0 transition-all duration-200 border",
        "min-w-[64px] w-16 h-16 sm:w-20 sm:h-20", // Fixed dimensions for better visibility
        isSelected
          ? "ring-2 ring-black border-black opacity-100 scale-[0.98]" 
          : "ring-0 border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100"
      )}
    >
      <div className="w-full h-full relative">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 64px, 100px"
          className="object-contain p-0.5"
          onError={(e) => { 
            console.log(`Failed to load image: ${src}`); 
            (e.target as HTMLImageElement).src = '/placeholder.png'; 
          }}
          loading="eager"
        />
      </div>
    </button>
  );
}
