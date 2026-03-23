'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import type { Sticker } from '@/types';

interface StickerPickerProps {
  onSelect: (sticker: Sticker) => void;
  disabled?: boolean;
}

export function StickerPicker({ onSelect, disabled }: StickerPickerProps) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && stickers.length === 0) {
      loadStickers();
    }
  }, [isOpen]);

  const loadStickers = async () => {
    setIsLoading(true);
    try {
      const [stickersData, categoriesData] = await Promise.all([
        api.getStickers(),
        api.getStickerCategories(),
      ]);
      setStickers(stickersData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load stickers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (sticker: Sticker) => {
    onSelect(sticker);
    setIsOpen(false);
  };

  const getStickersByCategory = (category: string) => {
    return stickers.filter(s => s.category === category);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2a34]"
        >
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-[#1a1a24] border-[#2a2a34]" 
        align="start"
        side="top"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="w-full justify-start bg-[#0f0f14] rounded-none border-b border-[#2a2a34] p-0 h-10">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-4 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3b82f6] data-[state=active]:shadow-none capitalize text-xs"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((category) => (
              <TabsContent key={category} value={category} className="p-0 m-0">
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {getStickersByCategory(category).map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => handleSelect(sticker)}
                        className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-[#2a2a34] transition-colors text-2xl"
                        title={sticker.name}
                      >
                        {sticker.url}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}
