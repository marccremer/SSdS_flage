import p5 from "p5";
export function assertNotNull<T>(
  param: T | null | undefined,
  name: string
): asserts param is T {
  if (param === null || param === undefined) {
    throw new Error(`The parameter "${name}" cannot be null or undefined.`);
  }
}

export function createStyledButton(
  p: p5,
  buttonName: string,
  position: [x: number, y: number],
  onClick: () => void
): void {
  const button = p.createButton(buttonName);
  button.mouseClicked(onClick);
  button.size(105, 61);
  button.position(position[0], position[1]);
  button.style("font-family", "Comic Sans MS");
  button.style("font-size", "24px");
}
