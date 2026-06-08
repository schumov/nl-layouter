import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Display labels for the 5 layout types (matches UI-SPEC copywriting contract)
const LAYOUT_NAMES: Record<string, string> = {
  '1col':                 '1 Column',
  '2col':                 '2 Columns',
  '3col':                 '3 Columns',
  'small-left-big-right': 'Small-Left / Big-Right',
  'big-left-small-right': 'Big-Left / Small-Right',
};

export function BuilderPalette() {
  return (
    <div className="flex-[2] min-w-0 border-l bg-background overflow-y-auto">
      <Tabs defaultValue="layouts" className="h-full flex flex-col">
        <TabsList className="w-full shrink-0 rounded-none border-b">
          <TabsTrigger value="layouts" className="flex-1">Layouts</TabsTrigger>
          <TabsTrigger value="elements" className="flex-1">Elements</TabsTrigger>
        </TabsList>
        <TabsContent value="layouts" className="p-4 space-y-2">
          {Object.entries(LAYOUT_NAMES).map(([type, label]) => (
            <div key={type} className="p-3 border rounded-md text-sm cursor-default">
              {label}
            </div>
          ))}
        </TabsContent>
        <TabsContent value="elements" className="p-4" forceMount>
          <p className="text-sm text-muted-foreground">
            Elements will be available in a future phase.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
