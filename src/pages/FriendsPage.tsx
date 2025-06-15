
import React from "react";
import Friends from "@/components/Friends";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const FriendsPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative">
    <Link to="/" className="absolute top-6 left-6">
      <Button variant="outline" className="flex items-center bg-white/60 backdrop-blur hover:bg-white/80 text-gray-800 border-white/30 px-3 py-2 shadow">
        <ArrowLeft className="mr-2" size={18} />
        Back
      </Button>
    </Link>
    <div className="w-full max-w-xl">
      <Friends />
    </div>
  </div>
);

export default FriendsPage;
