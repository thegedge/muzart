import React, { useEffect, useRef, useState } from "react";
import { Box, LINE_STROKE_WIDTH, PX_PER_MM } from "../../../layout";

export interface RenderFunction {
  (context: CanvasRenderingContext2D, viewport: Box): void;
}

export interface Point {
  x: number;
  y: number;
}

export const Canvas = (props: { render: RenderFunction; size: Box; onClick: (p: Point) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const [pixelRatio, setPixelRatio] = useState(devicePixelRatio);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState<Box | null>(null);

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
    const container = containerRef.current;
    const scroll = scrollRef.current;
    if (!canvas || !container || !scroll) {
      return;
    }

    const listener = () => {
      // No need to multiply by PX_PER_MM because the container values are already in pixels
      const containerRect = container.getBoundingClientRect();
      let x = containerRect.x * pixelRatio;
      const y = containerRect.y * pixelRatio;
      const factor = zoom * pixelRatio * PX_PER_MM;
      const w = canvas.width / factor;
      if (props.size.width < w) {
        x += 0.5 * (w - props.size.width) * factor;
      }

      setViewport(new Box(-x / factor, -y / factor, canvas.width / factor, canvas.height / factor));
    };

    // Ensure we set an initial viewport
    listener();

    scroll.addEventListener("scroll", listener, { passive: true });
    return () => scroll.removeEventListener("scroll", listener);
  }, [canvas, containerRef.current, scrollRef.current, props.size, zoom, pixelRatio]);

  const frameHandle = useRef(-1);

  useEffect(() => {
    if (!canvas || !context || !viewport) {
      return;
    }

    cancelAnimationFrame(frameHandle.current);

    frameHandle.current = requestAnimationFrame((_time) => {
      const factor = zoom * pixelRatio * PX_PER_MM;
      context.resetTransform();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(factor, 0, 0, factor, -viewport.x * factor, -viewport.y * factor);
      context.lineWidth = LINE_STROKE_WIDTH;
      props.render(context, viewport);
    });
  }, [canvas, context, viewport, props.size, zoom, pixelRatio, props.render]);

  const onClick = () => {
    if (!props.onClick) {
      return;
    }

    const p = { x: 0, y: 0 };
    props.onClick(p);
  };

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-auto">
      <div ref={containerRef} className="absolute" onClick={onClick} />
      <canvas ref={setCanvas} className="sticky left-0 top-0 w-full h-full" style={{ imageRendering: "crisp-edges" }} />
    </div>
  );
};
