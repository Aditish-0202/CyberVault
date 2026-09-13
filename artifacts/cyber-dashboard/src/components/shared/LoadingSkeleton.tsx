import React from 'react';
import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-5 w-24" />
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
      <LoadingSkeleton className="h-10 w-32" />
      <LoadingSkeleton className="h-4 w-48" />
    </div>
  );
}