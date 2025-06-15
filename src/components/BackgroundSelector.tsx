
import React from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BackgroundSelectorProps {
  onBackgroundChange: (gradient: string) => void;
}

const gradients = [
  {
    name: 'Sunset',
    value: 'from-orange-400 via-red-500 to-pink-500'
  },
  {
    name: 'Ocean',
    value: 'from-blue-400 via-cyan-500 to-teal-500'
  },
  {
    name: 'Lavender',
    value: 'from-purple-400 via-pink-400 to-red-400'
  },
  {
    name: 'Forest',
    value: 'from-green-400 via-emerald-500 to-teal-500'
  },
  {
    name: 'Golden',
    value: 'from-yellow-400 via-orange-500 to-red-500'
  },
  {
    name: 'Arctic',
    value: 'from-blue-200 via-cyan-200 to-blue-300'
  },
  {
    name: 'Berry',
    value: 'from-pink-500 via-purple-500 to-indigo-500'
  },
  {
    name: 'Mint',
    value: 'from-green-300 via-teal-300 to-cyan-300'
  }
];

const BackgroundSelector = ({ onBackgroundChange }: BackgroundSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
        >
          <Palette size={16} className="mr-2" />
          Background
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {gradients.map((gradient) => (
          <DropdownMenuItem
            key={gradient.name}
            onClick={() => onBackgroundChange(gradient.value)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-6 h-6 rounded-full bg-gradient-to-r ${gradient.value}`}
              />
              {gradient.name}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BackgroundSelector;
