import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  style?: CSSProperties;
}

const GAP = 8; // px between trigger and bubble

const BUBBLE_TRANSFORM: Record<string, string> = {
  top: "translate(-50%, -100%)",
  bottom: "translate(-50%, 0)",
  left: "translate(-100%, -50%)",
  right: "translate(0, -50%)",
};

const ARROW_CLASSES: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent",
};

// Styled drop-in replacement for the native `title` attribute — same trigger
// semantics (hover/focus), but rendered as a proper dark chip instead of the
// browser's unstyled, slow-to-appear tooltip.
//
// The bubble is portaled to document.body and positioned with `fixed` +
// getBoundingClientRect, rather than being an absolutely-positioned child of
// the trigger — otherwise any scrollable/`overflow-hidden` ancestor (a
// champion card, a scrollable list, the sidebar, …) would clip it no matter
// how high its z-index is.
export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  style,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const byPosition = {
      top: { top: rect.top - GAP, left: rect.left + rect.width / 2 },
      bottom: { top: rect.bottom + GAP, left: rect.left + rect.width / 2 },
      left: { top: rect.top + rect.height / 2, left: rect.left - GAP },
      right: { top: rect.top + rect.height / 2, left: rect.right + GAP },
    };
    setCoords(byPosition[position]);
    setVisible(true);
  };
  const hide = () => setVisible(false);

  // A scroll (of the page or of a nested scrollable ancestor) can move the
  // trigger without a mouse-leave firing; drop the bubble instead of leaving
  // it floating over the wrong spot.
  useEffect(() => {
    if (!visible) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [visible]);

  return (
    <span
      ref={triggerRef}
      style={style}
      className={`relative inline-block ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && coords &&
        createPortal(
          <span
            role="tooltip"
            className="fixed z-100 max-w-64 w-max px-2.5 py-1.5 rounded-lg bg-gray-900 text-white
              border border-amber-400/80
              text-[11px] font-medium leading-snug text-center shadow-xl pointer-events-none"
            style={{ top: coords.top, left: coords.left, transform: BUBBLE_TRANSFORM[position] }}
          >
            {content}
            <span className={`absolute w-0 h-0 border-4 ${ARROW_CLASSES[position]}`} />
          </span>,
          document.body,
        )}
    </span>
  );
}
