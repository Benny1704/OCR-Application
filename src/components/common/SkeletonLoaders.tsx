import React from "react";
import { useTheme } from "../../hooks/useTheme";

const SkeletonBox = ({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { theme } = useTheme();
  const baseClasses =
    theme === "dark" ? "bg-gray-700/50" : "bg-gray-200/80";

  return (
    <div
      className={`relative overflow-hidden rounded-md ${baseClasses} ${className}`}
      style={style}
    >
      <div
        className={`absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] ${
          theme === "dark"
            ? "bg-gradient-to-r from-transparent via-gray-600/30 to-transparent"
            : "bg-gradient-to-r from-transparent via-gray-300/50 to-transparent"
        }`}
      ></div>
    </div>
  );
};

export const KpiCardSkeleton = () => {
  const { theme } = useTheme();
  const cardClasses = `p-4 md:p-6 rounded-2xl border ${
    theme === "dark"
      ? "bg-[#1C1C2E] border-gray-700/50"
      : "bg-white border-gray-200/80"
  }`;

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start">
        <SkeletonBox className="h-4 w-3/5" />
        <SkeletonBox className="h-6 w-6 rounded-md" />
      </div>
      <SkeletonBox className="h-8 w-2/5 mt-3" />
      <SkeletonBox className="h-3 w-4/5 mt-3" />
    </div>
  );
};

export const ChartSkeleton = () => {
  const { theme } = useTheme();
  const barColor = theme === "dark" ? "bg-gray-700/60" : "bg-gray-200/90";

  return (
    <div className="w-full h-full flex items-end justify-between gap-2 px-4 pt-8 pb-4">
      <SkeletonBox
        className={`w-1/6 ${barColor}`}
        style={{ height: "40%" }}
      />
      <SkeletonBox
        className={`w-1/6 ${barColor}`}
        style={{ height: "70%" }}
      />
      <SkeletonBox
        className={`w-1/6 ${barColor}`}
        style={{ height: "50%" }}
      />
      <SkeletonBox
        className={`w-1/6 ${barColor}`}
        style={{ height: "90%" }}
      />
      <SkeletonBox
        className={`w-1/6 ${barColor}`}
        style={{ height: "60%" }}
      />
      <SkeletonBox
        className={`w-1/6 ${barColor}`}
        style={{ height: "30%" }}
      />
    </div>
  );
};

export const QueueListSkeleton = () => {
  const { theme } = useTheme();
  const cardClasses = `rounded-xl border flex flex-col ${
    theme === "dark"
      ? "bg-gray-800/20 border-gray-700/80"
      : "bg-white border-gray-200/80"
  }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full animate-pulse">
      {/* Left Panel: List of Documents */}
      <div className={cardClasses}>
        <div className="p-3">
          <SkeletonBox className="h-6 w-3/5" />
        </div>
        <div className="p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg">
              <SkeletonBox className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-4/5" />
              </div>
              <SkeletonBox className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Document Details */}
      <div className={`${cardClasses} lg:col-span-2`}>
        <div className="p-4 flex flex-col gap-4 h-full">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4 space-y-2">
              <SkeletonBox className="h-7 w-3/4" />
              <SkeletonBox className="h-4 w-1/2" />
            </div>
            <SkeletonBox className="h-8 w-24 rounded-full" />
          </div>
          <div className="!my-4"></div>

          {/* Document Info */}
          <div className="space-y-3">
            <SkeletonBox className="h-6 w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SkeletonBox className="h-16 rounded-lg" />
              <SkeletonBox className="h-16 rounded-lg" />
            </div>
          </div>

          <div className="flex-grow"></div>

          <div className="!my-4"></div>

          {/* Actions */}
          <div>
            <SkeletonBox className="h-6 w-1/4 mb-3" />
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-8 w-24 rounded-md" />
              <SkeletonBox className="h-8 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
    const { theme } = useTheme();
    const cardClasses = `rounded-xl border flex flex-col ${
      theme === "dark"
        ? "bg-gray-800/20 border-gray-700/80"
        : "bg-white border-gray-200/80"
    }`;
  return (
    <div className={`w-full h-full animate-pulse p-6 ${cardClasses}`}>
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-6">
        <SkeletonBox className="h-10 w-64 rounded-lg" />
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-10 w-24 rounded-lg" />
          <SkeletonBox className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3">
          <SkeletonBox className="h-5 flex-1 rounded-md" />
          <SkeletonBox className="h-5 flex-1 rounded-md" />
          <SkeletonBox className="h-5 flex-1 rounded-md" />
          <SkeletonBox className="h-5 flex-1 rounded-md" />
          <SkeletonBox className="h-5 w-24 rounded-md" />
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border-t border-gray-200/80 dark:border-gray-300/50"
          >
            <SkeletonBox className="h-5 flex-1 rounded-md" />
            <SkeletonBox className="h-5 flex-1 rounded-md" />
            <SkeletonBox className="h-5 flex-1 rounded-md" />
            <SkeletonBox className="h-5 flex-1 rounded-md" />
            <SkeletonBox className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};