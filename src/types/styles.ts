import type { CSSProperties } from "react";

/** CSS variables used by the showcase's animation and responsive controls. */
export type ShowcaseStyle = CSSProperties & Record<`--${string}`, string | number>;
