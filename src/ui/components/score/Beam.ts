import layout from "../../../layout";

const BEAM_COLOR = "#333333";

export const Beam = (context: CanvasRenderingContext2D, beam: layout.Beam) => {
  context.fillStyle = BEAM_COLOR;

  if (beam.size == beam.box.height) {
    context.fillRect(beam.box.x, beam.box.y, beam.box.width, beam.box.height);
    return;
  }

  const x1 = beam.box.x;
  const y1 = beam.box.y;
  const x2 = beam.box.right;
  const y2 = beam.box.bottom;
  const sz = beam.size;

  context.beginPath();
  context.moveTo(x1, y2);
  context.lineTo(x2, y1 + sz);
  context.lineTo(x2, y1);
  context.lineTo(x1, y2 - sz);
  context.fill();
  context.closePath();
};
