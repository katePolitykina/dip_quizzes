import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-background rounded-[16px] border-2 border-dashed border-border">
      <div className="w-24 h-24 bg-analyst-blue-bg rounded-full flex items-center justify-center mb-6 text-violet-light">
        <PackageOpen size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">
        You haven't created any quizzes yet
      </h3>
      <p className="text-text-muted max-w-sm">
        Get started by creating your first quiz. Click the "Create New Quiz" button above to jump into the editor.
      </p>
    </div>
  );
};
