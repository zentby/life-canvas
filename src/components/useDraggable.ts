
import { useRef, useState } from "react";

export interface DraggableHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

export function useDraggable(
  initial: { x: number; y: number },
  opts?: { onDragEnd?: (xy: { x: number; y: number }) => void }
): [ { x: number; y: number }, DraggableHandlers ] {
  const [pos, setPos] = useState({ ...initial });
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Drag start
  const start = (clientX: number, clientY: number) => {
    draggingRef.current = true;
    offsetRef.current = {
      x: clientX - pos.x,
      y: clientY - pos.y
    };
    window.addEventListener("mousemove", drag as any);
    window.addEventListener("mouseup", stopDrag as any);
    window.addEventListener("touchmove", dragTouch as any);
    window.addEventListener("touchend", stopDrag as any);
  };

  // Drag move (mouse)
  const drag = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    setPos({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y
    });
  };

  // Drag move (touch)
  const dragTouch = (e: TouchEvent) => {
    if (!draggingRef.current) return;
    if (e.touches.length > 0) {
      setPos({
        x: e.touches[0].clientX - offsetRef.current.x,
        y: e.touches[0].clientY - offsetRef.current.y
      });
    }
  };

  // Drag stop
  const stopDrag = () => {
    draggingRef.current = false;
    // Remove listeners
    window.removeEventListener("mousemove", drag as any);
    window.removeEventListener("mouseup", stopDrag as any);
    window.removeEventListener("touchmove", dragTouch as any);
    window.removeEventListener("touchend", stopDrag as any);
    if (opts?.onDragEnd) {
      opts.onDragEnd(pos);
    }
  };

  // Bind handlers
  const handlers: DraggableHandlers = {
    onMouseDown: (e) => {
      e.stopPropagation();
      start(e.clientX, e.clientY);
    },
    onTouchStart: (e) => {
      if (e.touches.length > 0) {
        e.stopPropagation();
        start(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
  };

  return [pos, handlers];
}
