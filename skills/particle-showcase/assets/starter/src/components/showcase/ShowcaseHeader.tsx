import { showcase, type ShowcaseVersion } from "../../config/showcase";
import { assetUrl } from "../../lib/assets";
import type { ShowcaseStyle } from "../../types/styles";

export function ShowcaseHeader({
  variant,
  version,
}: {
  variant: string;
  version: ShowcaseVersion;
}) {
  const style: ShowcaseStyle = {
    "--showcase-version-count": Object.keys(showcase.versions).length,
  };
  return (
    <header className="site-header">
      <a
        className={version.logoClass}
        href={variant === "astra" ? "https://openai.com/" : version.url}
        aria-label={`${version.name} home`}
      >
        <img src={assetUrl(version.logo)} alt={variant === "astra" ? "OpenAI" : version.name} />
      </a>
      {showcase.showVersionSwitch && (
        <nav className="version-switch" aria-label="粒子版本" style={style}>
          {Object.entries(showcase.versions).map(([key, option]) => (
            <a
              key={key}
              href={`?shape=${encodeURIComponent(key)}`}
              aria-current={variant === key ? "page" : undefined}
            >
              {option.name}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
