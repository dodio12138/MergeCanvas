# MergeCanvas

A browser-based lossless image merge tool. Everything runs locally — no uploads, no backend.

## Features

- Vertical / horizontal stitching with auto uniform sizing
- Drag to reorder, per-image scale & crop (visual editor)
- Configurable gap, alignment, background color
- Multi-text overlay with drag positioning & edge snapping
- Export PNG / JPEG at 1x or 2x, with quality control
- Paste from clipboard (Ctrl/⌘+V), drag-and-drop upload
- English / Chinese toggle

## Tech Stack

React · TypeScript · Vite · HTML5 Canvas

## Quick Start

```bash
npm install
npm run dev
```

## Deploy

**GitHub Pages** — push to `main`, auto-deployed via GitHub Actions.

**Docker**:
```bash
docker build -t mergecanvas .
docker run -d -p 8080:80 mergecanvas
```

## License

MIT
