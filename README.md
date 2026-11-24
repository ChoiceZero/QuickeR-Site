# QuickeR site

Marketing site for [QuickeR](https://github.com/ChoiceZero/QuickeR), the QR code app with no accounts, limits, ads, purchases or tracking.

Plain HTML, CSS and JavaScript with no build step, served by GitHub Pages from the root of `main`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## What's in it

| Path | What it is |
| --- | --- |
| `index.html` | The whole page: hero, features, QR playground, screenshots, downloads, FAQ. |
| `assets/site.css` | Layout and components, in the style of Material 3 Expressive. |
| `assets/schemes.css` | Light and dark color schemes for each accent color. Generated, don't edit by hand. |
| `assets/site.js` | Theme and accent switching, the QR playground, and live release info from the GitHub API. |
| `assets/shapes.svg` | The rounded M3 shapes behind icons and the hero. |
| `assets/shots/` | App screenshots, converted to WebP from `docs/screenshots` in the app repo. |
| `assets/vendor/qrcode.js` | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 2.0.4 by Kazuhiko Arase (MIT). |
| `scripts/gen-schemes.mjs` | Regenerates `assets/schemes.css` with `@material/material-color-utilities`. |

## Privacy

The page sets no cookies and runs no analytics. Fonts are self-hosted. The only outside request is to `api.github.com` to show the latest version, release date and file sizes. If it fails, the download links still point at `releases/latest`.

## Updating

- **New release:** nothing to do. Version, date, sizes and any new `.deb`/`.rpm` files are read from the latest GitHub release when the page loads. Update the fallback version in `index.html` (`v1.1.2`) if you like.
- **New screenshots:** convert them to WebP (`magick in.png -quality 82 out.webp`) and put them in `assets/shots/`.
- **New accent colors:** add the seed to `scripts/gen-schemes.mjs`, regenerate, and add a swatch in `index.html`.

## Credits

- Google Sans Flex, SIL Open Font License 1.1.
- Material Symbols Rounded (subset), Apache License 2.0.
- Site code: MIT, see [LICENSE](LICENSE).
