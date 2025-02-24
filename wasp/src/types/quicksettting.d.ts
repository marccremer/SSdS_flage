type ControlCallback = (value: any) => void;

declare class QuickSettings {
  create(x: number, y: number, title?: string): QuickSettings;
  static useExtStyleSheet(): void;

  setPosition(x: number, y: number): this;
  setSize(width: number, height: number): this;
  setDraggable(draggable: boolean): this;
  hide(): this;
  show(): this;
  destroy(): void;

  addBoolean(title: string, value: boolean, callback?: ControlCallback): this;
  addButton(title: string, callback: () => void): this;
  addColor(title: string, color: string, callback?: ControlCallback): this;
  addDate(title: string, date: string, callback?: ControlCallback): this;
  addDropDown(title: string, items: string[], callback?: ControlCallback): this;
  addElement(title: string, htmlElement: HTMLElement): this;
  addFileChooser(
    title: string,
    labelStr: string,
    filter: string,
    callback?: (file: File) => void
  ): this;
  addHTML(title: string, htmlString: string): this;
  addImage(title: string, imageURL: string, callback?: ControlCallback): this;
  addNumber(
    title: string,
    min: number,
    max: number,
    value: number,
    step: number,
    callback?: ControlCallback
  ): this;
  addPassword(title: string, text: string, callback?: ControlCallback): this;
  addProgressBar(
    title: string,
    max: number,
    value: number,
    valueDisplay?: boolean
  ): this;
  addRange(
    title: string,
    min: number,
    max: number,
    value: number,
    step: number,
    callback?: ControlCallback
  ): this;
  addText(title: string, text: string, callback?: ControlCallback): this;
  addTextArea(title: string, text: string, callback?: ControlCallback): this;
  addTime(title: string, time: string, callback?: ControlCallback): this;

  setValue<T>(title: string, value: T): this;
  getValue<T>(title: string): T;
  getValuesAsJSON(asstring = false): string | Record<string | any>;
  setValuesFromJSON(json: string): this;
  saveInLocalStorage(name: string): this;
}
