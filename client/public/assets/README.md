# Assets Directory

This folder contains static assets for the streaming layouts.

## Structure

```
public/
├── assets/
│   └── gifs/           # Place your GIF files here
│       ├── batsman1.gif
│       ├── batsman2.gif
│       └── bowler.gif
```

## Usage

In Vite projects, files in the `public` folder are served at the root path.

To use your GIFs in the layout, reference them like this:

```tsx
<img src="/assets/gifs/batsman1.gif" alt="Batsman 1" />
```

## Instructions

1. Place your GIF files in `public/assets/gifs/`
2. Name them appropriately (e.g., `batsman1.gif`, `batsman2.gif`, `bowler.gif`)
3. Reference them in your code using `/assets/gifs/filename.gif`
