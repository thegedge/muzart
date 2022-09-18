import React, { useEffect, useRef, useState } from "react";
import { Box, LINE_STROKE_WIDTH, PX_PER_MM } from "../../../layout";

export interface RenderFunction {
  (context: CanvasRenderingContext2D, viewport: Box): void;
}

export const Canvas = (props: { render: RenderFunction; size: Box }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pixelRatio, setPixelRatio] = useState(devicePixelRatio);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);

  const context = canvas?.getContext("2d", {
    willReadFrequently: false,
  });

  useEffect(() => {
    const update = () => setPixelRatio(devicePixelRatio);
    const media = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    media.addEventListener("change", update, { once: true });
    return () => media.removeEventListener("change", update);
  }, [pixelRatio]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.width = `${zoom * props.size.width * PX_PER_MM}px`;
      containerRef.current.style.height = `${zoom * props.size.height * PX_PER_MM}px`;
    }
  }, [containerRef.current, zoom, props.size]);

  useEffect(() => {
    if (scrollRef.current) {
      const listener = (event: WheelEvent) => {
        if (event.metaKey && event.deltaY != 0) {
          event.preventDefault();
          event.stopPropagation();
          setZoom((currentZoom) => Math.max(0.1, Math.min(5, currentZoom * Math.exp(-event.deltaY / PX_PER_MM / 100))));
        }
      };

      scrollRef.current.addEventListener("wheel", listener);
      return () => scrollRef.current?.removeEventListener("wheel", listener);
    }
  }, [scrollRef.current]);

  useEffect(() => {
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      canvas.width = Math.ceil(canvasRect.width * pixelRatio);
      canvas.height = Math.ceil(canvasRect.height * pixelRatio);
    }
  }, [canvas, pixelRatio]);

  useEffect(() => {
    if (!canvas || !context || !scrollRef.current) {
      return;
    }

    let frameHandle = -1;
    const listener = () => {
      cancelAnimationFrame(frameHandle);

      frameHandle = requestAnimationFrame((_time) => {
        let x = 0;
        let y = 0;
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          // No need to multiply by PX_PER_MM because the container values are already in pixels
          x = containerRect.x * pixelRatio;
          y = containerRect.y * pixelRatio;
        }

        const factor = zoom * pixelRatio * PX_PER_MM;
        const w = canvas.width / factor;
        if (props.size.width < w) {
          x += 0.5 * (w - props.size.width) * factor;
        }

        context.resetTransform();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(factor, 0, 0, factor, x, y);
        context.lineWidth = LINE_STROKE_WIDTH;

        const viewport = new Box(-x / factor, -y / factor, canvas.width / factor, canvas.height / factor);
        props.render(context, viewport);

        frameHandle = -1;
      });
    };

    listener(); // initial render

    scrollRef.current.addEventListener("scroll", listener, { passive: true });
    return () => {
      cancelAnimationFrame(frameHandle);
      scrollRef.current?.removeEventListener("scroll", listener);
    };
  }, [canvas, scrollRef.current, containerRef.current, props.size, pixelRatio, props.render, context, zoom]);

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-auto">
      <div ref={containerRef} className="absolute" />
      <canvas ref={setCanvas} className="sticky left-0 top-0 w-full h-full" style={{ imageRendering: "crisp-edges" }} />
    </div>
  );
};
