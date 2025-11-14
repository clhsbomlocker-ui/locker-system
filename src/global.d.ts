/// <reference types="react" />
/* Provide JSX intrinsic element types to the compiler so standard HTML tags (div, span, etc.)
   are recognized when using the automatic React JSX runtime. */
declare namespace JSX {
  type Element = import("react").ReactElement;
  type ElementClass = import("react").Component<any, any>;
  interface IntrinsicElements extends import("react").JSX.IntrinsicElements {}
}
