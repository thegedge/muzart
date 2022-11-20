import layout from "../layout";
import { PAGE_MARGIN } from "../layout/elements/Part";
import { Application } from "../ui/state/Application";

export const Page = (_application: Application, context: CanvasRenderingContext2D, element: layout.Page) => {
  context.shadowBlur = PAGE_MARGIN;
  context.shadowColor = "rgb(0, 0, 0, 0.25)";
  context.fillStyle = "#ffffff";
  context.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);
  context.shadowBlur = 0;
  context.shadowColor = "";

  const box = element.content.box.translate(element.box.x, element.box.y);
  context.beginPath();
  context.rect(box.x, box.y, box.width, box.height);
  context.clip();
  context.closePath();
};
