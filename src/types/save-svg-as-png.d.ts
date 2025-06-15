declare module 'save-svg-as-png' {
  interface SaveSvgAsPngOptions {
    backgroundColor?: string;
    scale?: number;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
    encoderOptions?: number;
    encoderType?: string;
    canvg?: unknown;
    fonts?: unknown[];
    modifyStyle?: (style: CSSStyleDeclaration) => void;
    modifyCss?: (css: string) => string;
    selectorRemap?: (selector: string) => string;
    excludeUnusedCss?: boolean;
  }

  export function saveSvgAsPng(
    el: Element | SVGElement, 
    name: string, 
    options?: SaveSvgAsPngOptions
  ): Promise<void>;
  
  export function svgAsDataUri(
    el: Element | SVGElement, 
    options?: SaveSvgAsPngOptions
  ): Promise<string>;
  
  export function svgAsPngUri(
    el: Element | SVGElement, 
    options?: SaveSvgAsPngOptions
  ): Promise<string>;
}
