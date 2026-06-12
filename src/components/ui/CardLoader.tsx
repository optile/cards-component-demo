import React from "react";

interface CardLoader {
  loading: boolean;
  children: React.ReactNode;
}

const CardLoader: React.FC<CardLoader> = ({
  loading,
  children
}) => (
   <div className="relative w-4/5">
      {loading && (
        <div className="absolute inset-0 bg-white flex flex-col gap-4 p-4 rounded-xl z-10">
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-14 bg-gray-100 rounded-lg animate-pulse w-full" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-14 bg-gray-100 rounded-lg animate-pulse w-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-14 bg-gray-100 rounded-lg animate-pulse w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {children}
    </div>
);

export default CardLoader;
