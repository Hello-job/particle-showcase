import { resolveAstraPathShape, type ShapeId } from "../particles/shapes/registry";
import data from "./showcase.json";

export interface ShowcaseVersion {
  name: string;
  modelName: string;
  logo: string;
  logoClass: string;
  url: string;
  hero?: ShapeId;
  ending: ShapeId;
  showcase: boolean;
}

export interface ShowcaseConfig {
  defaultVariant: string;
  showVersionSwitch: boolean;
  versions: Record<string, ShowcaseVersion>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Showcase configuration requires a nonempty ${key}.`);
  }
  return value;
}

function registeredShape(value: unknown): ShapeId {
  const shape = typeof value === "string" ? resolveAstraPathShape(value) : null;
  if (!shape) throw new Error(`Unknown particle shape in showcase configuration: ${String(value)}`);
  return shape;
}

/** Validate editable JSON at the boundary so components only receive typed, complete data. */
export function parseShowcaseConfig(value: unknown): ShowcaseConfig {
  if (!isRecord(value) || !isRecord(value.versions)) {
    throw new Error("Showcase configuration requires a versions object.");
  }
  const entries = Object.entries(value.versions).map(([id, candidate]) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !isRecord(candidate)) {
      throw new Error(`Invalid showcase version: ${id}`);
    }
    const hero = candidate.hero === undefined ? undefined : registeredShape(candidate.hero);
    if (id !== "astra" && !hero) throw new Error(`Showcase ${id} requires a hero shape.`);
    const version: ShowcaseVersion = {
      name: requiredString(candidate, "name"),
      modelName: requiredString(candidate, "modelName"),
      logo: requiredString(candidate, "logo"),
      logoClass: requiredString(candidate, "logoClass"),
      url: requiredString(candidate, "url"),
      hero,
      ending: registeredShape(candidate.ending),
      showcase: candidate.showcase === true,
    };
    return [id, version] as const;
  });
  const versions = Object.fromEntries(entries);
  const defaultVariant = requiredString(value, "defaultVariant");
  if (!Object.hasOwn(versions, defaultVariant)) {
    throw new Error("The default showcase variant must exist in versions.");
  }
  if (typeof value.showVersionSwitch !== "boolean") {
    throw new Error("showVersionSwitch must be a boolean.");
  }
  return { defaultVariant, showVersionSwitch: value.showVersionSwitch, versions };
}

export const showcase = parseShowcaseConfig(data);

export function selectShowcase(search: string, config: ShowcaseConfig = showcase) {
  const requested = new URLSearchParams(search).get("shape");
  const variant =
    requested && Object.hasOwn(config.versions, requested) ? requested : config.defaultVariant;
  return { variant, version: config.versions[variant] };
}
