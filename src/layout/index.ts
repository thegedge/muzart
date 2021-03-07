export type Inches = number;

export interface Positioned {
  x: Inches;
  y: Inches;
}

export interface Sized {
  width: Inches;
  height: Inches;
}

export type Box = Positioned & Sized;

export type Margins = {
  left: Inches;
  right: Inches;
  top: Inches;
  bottom: Inches;
};
