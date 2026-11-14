# GoldenGateScene

An animated Golden Gate Bridge scene for the web — isometric traffic, boats, drifting fog and gulls, with pointer interaction. Vanilla JS, no dependencies.

This is a vanilla-JS port of the **ObsidianUI 404 scene**, as used on the [kilee.cn](https://kilee.cn) homepage background.

## Demo

Live on [kilee.cn](https://kilee.cn) — the scene sits behind the homepage content.

## Files

| File | What it is |
| --- | --- |
| `js/goldengate.js` | The scene: fetches the SVG, clones it into a layer stack, animates traffic / boats / fog / gulls |
| `css/gg.css` | Scene styles, including `[data-theme="dark"]` support |
| `golden-gate/north-tower.svg` | The bridge artwork (1040×640) |

## Usage

1. Copy the three files into your site, keeping `golden-gate/north-tower.svg` at the site root (the script fetches `/golden-gate/north-tower.svg`).
2. Include the stylesheet and the script:

```html
<link rel="stylesheet" href="/css/gg.css">
<script src="/js/goldengate.js"></script>
```

3. Add the mount point where the scene should render:

```html
<div class="gg-scene obsidianui-404-scene"><div class="gg-scene-host"></div></div>
```

The scene fades in once the SVG is loaded (`data-ready` on `.gg-scene`). Set `data-theme="dark"` on a parent element for the dark palette.

## Credits

Ported from the [ObsidianUI](https://github.com/Atharvsinh-codez/ObsidianUI) 404 scene ([obsidianui.dev](https://obsidianui.dev)), MIT licensed. Original artwork and component belong to their respective authors.

## License

MIT — see [LICENSE](LICENSE).
