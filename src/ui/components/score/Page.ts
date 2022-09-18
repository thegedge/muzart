import layout from "../../../layout";
import { PAGE_MARGIN } from "../../../layout/elements/Part";
import { Application } from "../../state/Application";

export const Page = (_application: Application, context: CanvasRenderingContext2D, element: layout.Page) => {
  context.shadowBlur = 2 * PAGE_MARGIN;
  context.shadowColor = "rgb(0, 0, 0, 0.2)";
  context.fillStyle = "#ffffff";
  context.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);
  context.shadowBlur = 0;
  context.shadowColor = "";
};
