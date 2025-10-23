declare module 'tinycolor2' {
  interface ColorInput {
    r?: number;
    g?: number;
    b?: number;
    a?: number;
    h?: number;
    s?: number;
    l?: number;
    v?: number;
    string?: string;
  }

  interface Instance {
    [x: string]: any;
    toString(format?: string): string;
    darken(amount?: number): Instance;
    lighten(amount?: number): Instance;
    brighten(amount?: number): Instance;
    toHexString(): string;
    toRgbString(): string;
  }

  function tinycolor(color?: string | ColorInput): Instance;

  export = tinycolor;
}