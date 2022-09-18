import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, LINE_STROKE_WIDTH } from "../../../layout";

export interface RenderFunction {
  (context: CanvasRenderingContext2D, viewport: Box): void;
}

const PX_PER_MM = 3.7795275591; // 96 DPI

export const Canvas = (props: { render: RenderFunction; size: Box }) => {
  const [pixelRatio, setPixelRatio] = useState(devicePixelRatio);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const context = useMemo(() => {
    return canvasRef.current?.getContext("2d", {
      willReadFrequently: false,
    });
  }, [canvasRef.current]);

  useEffect(() => {
    const update = () => setPixelRatio(devicePixelRatio);
    const media = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    media.addEventListener("change", update, { once: true });
    return () => media.removeEventListener("change", update);
  }, [pixelRatio]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.width = `${props.size.width * PX_PER_MM}px`;
      containerRef.current.style.height = `${props.size.height * PX_PER_MM}px`;
    }
  }, [containerRef.current, props.size]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      canvasRef.current.width = Math.ceil(canvasRect.width * pixelRatio);
      canvasRef.current.height = Math.ceil(canvasRect.height * pixelRatio);
    }
  }, [canvasRef.current, pixelRatio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !context || !scrollRef.current) {
      return;
    }

    let frameHandle: number | undefined;
    const listener = () => {
      if (frameHandle !== undefined) {
        cancelAnimationFrame(frameHandle);
      }

      frameHandle = requestAnimationFrame((_time) => {
        let x = 0;
        let y = 0;
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          // No need to multiply by PX_PER_MM because the container values are already in pixels
          x = containerRect.x * pixelRatio;
          y = containerRect.y * pixelRatio;
        }

        const factor = pixelRatio * PX_PER_MM;

        let vw = canvas.width;
        const vh = canvas.height;
        const vx = -x;
        const vy = -y;
        const w = canvas.width / factor;
        if (props.size.width < w) {
          x += 0.5 * (w - props.size.width) * factor;
          vw = props.size.width * factor;
        }

        const viewport = new Box(vx / factor, vy / factor, vw / factor, vh / factor);

        context.resetTransform();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(factor, 0, 0, factor, x, y);
        context.lineWidth = LINE_STROKE_WIDTH;
        context.strokeStyle = "#000000";
        context.fillStyle = "#000000";

        props.render(context, viewport);

        frameHandle = undefined;
      });
    };

    listener(); // initial render

    scrollRef.current.addEventListener("scroll", listener, { passive: true });
    return () => {
      if (frameHandle !== undefined) {
        cancelAnimationFrame(frameHandle);
      }
      scrollRef.current?.removeEventListener("scroll", listener);
    };
  }, [canvasRef.current, scrollRef.current, containerRef.current, props.size, pixelRatio]);

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-scroll">
      <div ref={containerRef} className="absolute" />
      <canvas ref={canvasRef} className="sticky left-0 top-0 w-full h-full" />
    </div>
  );
};
