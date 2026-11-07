import React from "react";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full ${className}`}>
      {children}
    </div>
  );
};

interface BentoCardProps {
  children: React.ReactNode;
  span?: "1" | "2" | "3" | "4";
  className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({ children, span = "1", className = "" }) => {
  const spanClasses = {
    "1": "col-span-1",
    "2": "col-span-1 md:col-span-2",
    "3": "col-span-1 md:col-span-2 lg:col-span-3",
    "4": "col-span-1 md:col-span-2 lg:col-span-4",
  }[span];

  return <div className={`${spanClasses} ${className}`}>{children}</div>;
};

