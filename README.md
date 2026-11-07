# Pad Map

Turn controller buttons into [Karabiner-Elements](https://karabiner-elements.pqrs.org/)
rules. Built for using an 8BitDo Zero 2 in keyboard mode as a remote for Anki,
video and slides, with as many modes as you like.

**Live:** https://ethanuser.github.io/padmap/

Static site, no build step. Everything runs and is saved in the browser.

## Use it

1. Pair the controller with your Mac in keyboard mode.
2. Press a button on it (or click one on the drawing) and pick what it does,
   or record any shortcut from your keyboard.
3. Add modes, and give one button **Next mode** or **Switch to** so the remote
   can move between them.
4. **Export**, **Copy**, then in Karabiner-Elements open Complex Modifications,
   click **Add your own rule**, paste over the example and save.

## Develop

```sh
npm run dev   # serves dist/ on http://localhost:4173
npm test
```

Controllers are defined in `dist/controllers.js`; add another entry there to
support a new one.

## Deploy

Pushing to `main` deploys `dist/` to GitHub Pages with GitHub Actions.
