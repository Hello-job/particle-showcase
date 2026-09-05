import type { ShowcaseVersion } from "../../config/showcase";
import { ArrowIcon } from "../icons/ArrowIcon";

export function ShowcaseFooter({ version }: { version: ShowcaseVersion }) {
  return (
    <footer className="astra-footer">
      {!version.showcase && (
        <a href={version.url}>
          {version.hero ? `Explore ${version.name}` : "Explore GPT-6 Astra"} <ArrowIcon />
        </a>
      )}
      <a href="#astra">Back to top</a>
    </footer>
  );
}
