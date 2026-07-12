import { useState, type CSSProperties, type ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  style?: CSSProperties;
}

const POSITION_CLASSES: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
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
export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  style,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={style}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          role="tooltip"
          className={`absolute z-50 ${POSITION_CLASSES[position]}
            max-w-64 w-max px-2.5 py-1.5 rounded-lg bg-gray-900 text-white
            text-[11px] font-medium leading-snug text-center shadow-xl pointer-events-none`}
        >
          {content}
          <span className={`absolute w-0 h-0 border-4 ${ARROW_CLASSES[position]}`} />
        </span>
      )}
    </span>
  );
}
