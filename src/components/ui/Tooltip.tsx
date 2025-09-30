import React, { useState, useRef, useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [, setActualPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const computePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tipRect = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8; // distance from trigger

    let pos = position;
    let top = 0;
    let left = 0;

    const placeTop = () => {
      top = triggerRect.top - tipRect.height - margin;
      left = triggerRect.left + triggerRect.width / 2 - tipRect.width / 2;
    };
    const placeBottom = () => {
      top = triggerRect.bottom + margin;
      left = triggerRect.left + triggerRect.width / 2 - tipRect.width / 2;
    };
    const placeLeft = () => {
      left = triggerRect.left - tipRect.width - margin;
      top = triggerRect.top + triggerRect.height / 2 - tipRect.height / 2;
    };
    const placeRight = () => {
      left = triggerRect.right + margin;
      top = triggerRect.top + triggerRect.height / 2 - tipRect.height / 2;
    };

    // Try preferred placement, flip if it would go off-screen
    if (pos === "top") {
      placeTop();
      if (top < margin) {
        pos = "bottom";
        placeBottom();
      }
    } else if (pos === "bottom") {
      placeBottom();
      if (top + tipRect.height > vh - margin) {
        pos = "top";
        placeTop();
      }
    } else if (pos === "left") {
      placeLeft();
      if (left < margin) {
        pos = "right";
        placeRight();
      }
    } else {
      placeRight();
      if (left + tipRect.width > vw - margin) {
        pos = "left";
        placeLeft();
      }
    }

    // Clamp horizontally and vertically so tooltip stays visible
    left = clamp(left, margin, vw - tipRect.width - margin);
    top = clamp(top, margin, vh - tipRect.height - margin);

    setActualPosition(pos);
    setTooltipStyle({
      top: Math.round(top) + window.scrollY,
      left: Math.round(left) + window.scrollX,
      position: "absolute",
    });
  };

  useLayoutEffect(() => {
    if (isVisible) {
      // compute after render so tooltipRef has dimensions
      computePosition();
      // Also recompute on resize/scroll to remain correct
      const onResize = () => computePosition();
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize, true);
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onResize, true);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, position, content]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const tooltipNode = (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={`z-50 px-2 py-1 text-sm text-white bg-black rounded shadow-lg whitespace-pre-line max-w-xs`}
      style={tooltipStyle}
      aria-hidden={!isVisible}
    >
      {content}
    </div>
  );

  return (
    <div
      className="relative flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={triggerRef} aria-describedby="" className="inline-flex">
        {children}
      </div>
      {isVisible && typeof document !== "undefined"
        ? createPortal(tooltipNode, document.body)
        : null}
    </div>
  );
};

export default Tooltip;
