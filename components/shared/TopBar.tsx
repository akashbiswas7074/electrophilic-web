"use client";
import { getAllTopBars } from "@/lib/database/actions/topbar.actions";
import { handleError } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const TopBarComponent = () => {
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    async function fetchBanners() {
      try {
        await getAllTopBars()
          .then((res) => setMessages(res?.topbars ?? []))
          .catch((err) => {
            toast.error("Failed to load top bar messages.");
            console.error("Error fetching top bars:", err);
            setMessages([]);
          });
      } catch (error) {
        handleError(error);
        setMessages([]);
      }
    }
    fetchBanners();
  }, []);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!messages) {
      return null;
  }

  return (
    <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white py-2 px-4 relative">
      <div className="embla overflow-hidden max-w-7xl mx-auto" ref={emblaRef}>
        <div className="embla__container flex">
          {messages?.map((message: any, index: number) => (
            <div key={index} className="embla__slide flex-[0_0_100%] min-w-0">
              <div className="text-center text-sm sm:text-base font-medium tracking-wide">
                {message.title}
                {message?.button?.title && (
                  <Link 
                    href={message.button.link ?? '#'}
                    className="ml-[10px] hover:opacity-80 transition-opacity inline-flex items-center"
                  >
                    <button style={{ color: message.button.color ?? 'inherit' }}>
                      {message.button.title}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:opacity-80 transition-opacity"
        onClick={scrollPrev}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:opacity-80 transition-opacity"
        onClick={scrollNext}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TopBarComponent;
