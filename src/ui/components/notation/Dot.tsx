import React from "react";
import layout from "../../../layout";

export const Dot = (props: { element: layout.Dot }) => {
  return (
    <ellipse
      cx={props.element.box.centerX}
      cy={props.element.box.centerY}
      rx={props.element.box.width / 4}
      ry={props.element.box.height / 4}
      fill="#000000"
    />
  );
};
