
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Clock, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";

const MobileSpecificHeader = () => {
  const { data: session } = useSession();

  const userName = session?.user?.name || "Alcloset"; // Fallback name
  const userImage = session?.user?.image || ""; // Fallback image (can be a placeholder path)
  const location = "Bangladesh"; // Placeholder location, can be dynamic later

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm lg:hidden">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userImage} alt={userName} />
          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-base font-semibold text-gray-800">{userName}</h1>
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="mr-1 h-3 w-3" />
            <span>{location}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-600 hover:text-gray-800">
          <Clock size={22} />
        </button>
        <button className="text-gray-600 hover:text-gray-800">
          <Bell size={22} />
        </button>
      </div>
    </div>
  );
};

export default MobileSpecificHeader;
