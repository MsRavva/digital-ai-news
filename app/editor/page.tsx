'use client';

import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import { PlateEditor } from '@/components/editor/plate-editor';

export default function Page() {
  return (
    <TooltipProvider>
      <div className="h-screen w-full">
        <PlateEditor />

        <Toaster />
      </div>
    </TooltipProvider>
  );
}
