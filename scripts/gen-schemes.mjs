// Regenerates assets/schemes.css. Run: npm i @material/material-color-utilities esbuild && npx esbuild scripts/gen-schemes.mjs --bundle --platform=node --format=esm --outfile=/tmp/gen.mjs && node /tmp/gen.mjs > assets/schemes.css
import { argbFromHex, hexFromArgb, SchemeTonalSpot, Hct } from "@material/material-color-utilities";
const seeds = { blue:"#1E88E5", green:"#4CAF50", purple:"#9C27B0", orange:"#FF9800", pink:"#E91E63", teal:"#009688" };
const roles = { "primary":"primary","on-primary":"onPrimary","primary-container":"primaryContainer","on-primary-container":"onPrimaryContainer",
 "secondary-container":"secondaryContainer","on-secondary-container":"onSecondaryContainer",
 "tertiary":"tertiary","tertiary-container":"tertiaryContainer","on-tertiary-container":"onTertiaryContainer",
 "surface":"surface","surface-low":"surfaceContainerLow","surface-c":"surfaceContainer","surface-high":"surfaceContainerHigh","surface-highest":"surfaceContainerHighest",
 "on-surface":"onSurface","on-surface-variant":"onSurfaceVariant","outline":"outline","outline-variant":"outlineVariant","inverse-surface":"inverseSurface","inverse-on-surface":"inverseOnSurface","inverse-primary":"inversePrimary" };
let css = "/* Generated with @material/material-color-utilities (SchemeTonalSpot). Seeds match QuickeR's accent colors. */\n";
const out = {};
for (const [name, seed] of Object.entries(seeds)) {
  for (const dark of [false, true]) {
    const s = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), dark, 0);
    const vars = Object.entries(roles).map(([k, r]) => `--${k}:${hexFromArgb(s[r])}`).join(";");
    const sel = dark
      ? `:root[data-accent="${name}"][data-mode="dark"]`
      : `:root[data-accent="${name}"]`;
    css += `${sel}{${vars}}\n`;
    if (!dark) out[name] = { seed, primary: hexFromArgb(s.primary), container: hexFromArgb(s.primaryContainer) };
  }
}
process.stdout.write(css);
console.error(JSON.stringify(out));
