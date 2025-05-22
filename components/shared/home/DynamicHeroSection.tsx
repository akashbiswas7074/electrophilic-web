"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface DynamicHeroSectionProps {
  data: {
    _id: string;
    title: string;
    subtitle: string;
    isActive: boolean;
    order: number;
    pattern: string;
    contentAlignment?: string;
    backgroundImage?: string;
    mediaUrl?: string;
    mediaType?: string;
    buttons: Array<{
      _id: string;
      label: string;
      link: string;
      variant: "primary" | "secondary" | "outline" | "ghost";
    }>;
  };
}

export default function DynamicHeroSection({ data }: DynamicHeroSectionProps) {
  const { 
    title, 
    subtitle, 
    buttons = [],
    pattern = "standard",
    contentAlignment = "center",
    backgroundImage,
    mediaUrl,
    mediaType = "image"
  } = data;
  
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Map button variants from database to UI component variants
  const getButtonVariant = (variant: string = "primary") => {
    const variantMap: Record<string, string> = {
      primary: "default",
      secondary: "secondary",
      outline: "outline",
      ghost: "ghost",
    };

    return variantMap[variant] || "default";
  };

  // Function to handle video play
  const handleVideoPlay = () => {
    setVideoIsPlaying(true);
  };

  // Render based on pattern type
  switch (pattern) {
    case 'dont-miss': 
      return (
        <section className="bg-black text-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                  {title}
                </h2>
                <p className="text-lg md:text-xl mb-8 text-gray-300">
                  {subtitle}
                </p>

                {buttons && buttons.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {buttons.map((button) => (
                      <Link href={button.link} key={button._id}>
                        <Button
                          variant={getButtonVariant(button.variant) as any}
                          size="lg"
                          className={cn(
                            "min-w-[160px] font-medium text-base",
                            button.variant === "primary" &&
                              "bg-white text-black hover:bg-gray-200",
                            button.variant === "secondary" &&
                              "bg-gray-800 text-white border border-white hover:bg-gray-700"
                          )}
                        >
                          {button.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {mediaUrl && (
                <div className="md:w-1/2">
                  {mediaType === 'video' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                        onPlay={handleVideoPlay}
                        onLoadedData={() => setIsVideoLoaded(true)}
                      />
                      {!videoIsPlaying && isVideoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center cursor-pointer">
                            <div className="ml-1 w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video md:aspect-square w-full overflow-hidden rounded-lg">
                      <Image 
                        src={mediaUrl}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      );
      
    case 'brand-control':
      return (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {mediaUrl && (
                <div className="md:w-1/2 order-2 md:order-1">
                  {mediaType === 'video' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                        onPlay={handleVideoPlay}
                        onLoadedData={() => setIsVideoLoaded(true)}
                      />
                      {!videoIsPlaying && isVideoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center cursor-pointer">
                            <div className="ml-1 w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <Image 
                        src={mediaUrl}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="md:w-1/2 order-1 md:order-2">
                <div className="max-w-xl">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                    {title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    {subtitle}
                  </p>

                  {buttons && buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {buttons.map((button) => (
                        <Link href={button.link} key={button._id}>
                          <Button
                            variant={getButtonVariant(button.variant) as any}
                            size="lg"
                            className={cn(
                              "min-w-[160px] font-medium text-base",
                              button.variant === "primary" &&
                                "bg-black hover:bg-gray-800",
                              button.variant === "secondary" &&
                                "bg-white text-black border border-black hover:bg-gray-100"
                            )}
                          >
                            {button.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
      
    case 'partner':
      return (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <div className="max-w-xl">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                    {title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    {subtitle}
                  </p>

                  {buttons && buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {buttons.map((button) => (
                        <Link href={button.link} key={button._id}>
                          <Button
                            variant={getButtonVariant(button.variant) as any}
                            size="lg"
                            className={cn(
                              "min-w-[160px] font-medium text-base",
                              button.variant === "primary" &&
                                "bg-black hover:bg-gray-800",
                              button.variant === "secondary" &&
                                "bg-white text-black border border-black hover:bg-gray-100"
                            )}
                          >
                            {button.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {mediaUrl && (
                <div className="md:w-1/2">
                  {mediaType === 'video' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                        onPlay={handleVideoPlay}
                        onLoadedData={() => setIsVideoLoaded(true)}
                      />
                      {!videoIsPlaying && isVideoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center cursor-pointer">
                            <div className="ml-1 w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                      <Image 
                        src={mediaUrl}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      );
      
    default: // standard pattern
      return (
        <section 
          className={cn(
            "py-16 md:py-24 flex items-center justify-center",
            backgroundImage ? "text-white" : "bg-gradient-to-r from-gray-100 to-gray-50"
          )}
          style={{
            backgroundImage: backgroundImage ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="container mx-auto px-4">
            <div className={`max-w-4xl mx-auto text-${contentAlignment}`}>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 uppercase">
                {title}
              </h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8">{subtitle}</p>

              {buttons && buttons.length > 0 && (
                <div className={`flex flex-wrap gap-4 justify-${contentAlignment === 'left' ? 'start' : (contentAlignment === 'right' ? 'end' : 'center')}`}>
                  {buttons.map((button) => (
                    <Link href={button.link} key={button._id}>
                      <Button
                        variant={getButtonVariant(button.variant) as any}
                        size="lg"
                        className={cn(
                          "min-w-[160px] font-medium text-base",
                          button.variant === "primary" &&
                            "bg-black hover:bg-gray-800",
                          button.variant === "secondary" &&
                            "bg-white text-black border border-black hover:bg-gray-100"
                        )}
                      >
                        {button.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      );
  }
}