"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import { useMediaQuery } from "@/hooks/use-media-query";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface Banner {
  id: string;
  url: string;
  linkUrl?: string;
  altText?: string;
  public_id: string;
  platform: "desktop" | "mobile";
  priority: number;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/banners");
        if (!res.ok) throw new Error("Failed to fetch banners");
        
        const data = await res.json();
        if (data.banners) {
          setBanners(data.banners);
        }
      } catch (err: any) {
        console.error("Error fetching banners:", err);
        setError(err.message || "Failed to load banners");
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Function to track banner view
  const trackImpression = async (bannerId: string) => {
    try {
      await fetch("/api/banners/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bannerId,
          eventType: "impression"
        }),
      });
    } catch (error) {
      // Silently fail tracking
      console.error("Failed to track banner impression:", error);
    }
  };

  // Function to track banner clicks
  const trackClick = async (bannerId: string) => {
    try {
      await fetch("/api/banners/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bannerId,
          eventType: "click"
        }),
      });
    } catch (error) {
      // Silently fail tracking
      console.error("Failed to track banner click:", error);
    }
  };

  // Filter banners based on platform
  const filteredBanners = banners.filter(
    (banner) => banner.platform === (isMobile ? "mobile" : "desktop")
  );

  // Sort by priority (lower number = higher priority)
  const sortedBanners = [...filteredBanners].sort(
    (a, b) => (a.priority || 10) - (b.priority || 10)
  );

  if (loading) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-gray-100 animate-pulse"></div>
    );
  }

  if (error || sortedBanners.length === 0) {
    return null; // Don't show anything if there's an error or no banners
  }

  return (
    <div className="relative w-full">
      <Swiper
        modules={[Pagination, Autoplay, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        navigation
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        className="mySwiper"
        onSlideChange={(swiper) => {
          const activeBannerId = sortedBanners[swiper.activeIndex]?.public_id;
          if (activeBannerId) trackImpression(activeBannerId);
        }}
        onInit={(swiper) => {
          const activeBannerId = sortedBanners[swiper.activeIndex]?.public_id;
          if (activeBannerId) trackImpression(activeBannerId);
        }}
      >
        {sortedBanners.map((banner) => (
          <SwiperSlide key={banner.public_id}>
            {banner.linkUrl ? (
              <Link
                href={banner.linkUrl}
                onClick={() => trackClick(banner.public_id)}
              >
                <div className="w-full h-[300px] md:h-[400px] relative">
                  <Image
                    src={banner.url}
                    alt={banner.altText || "Banner image"}
                    fill
                    priority
                    className="object-cover object-center"
                  />
                </div>
              </Link>
            ) : (
              <div className="w-full h-[300px] md:h-[400px] relative">
                <Image
                  src={banner.url}
                  alt={banner.altText || "Banner image"}
                  fill
                  priority
                  className="object-cover object-center"
                />
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}