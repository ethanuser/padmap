// Controller definitions. Each one is drawn in its own coordinate space and
// rotated about (cx, cy); `extent` is the drawing's width and height.
// Each button has an anchor (x, y) that its leader line ends at (lines are
// masked so they stop at the button's edge), an optional `via` list of points
// the line passes through to avoid crossing other buttons, and a `kind` that
// picks the icon used in the mapping boxes. `columns` fixes which side and
// order each mapping box sits in, so rotating the drawing never moves them.

// The D-pad is drawn from point lists (data-pts) so the app can tilt it in
// perspective toward the direction being held.
const shape = (cls, pts) => `<path class="${cls}" data-pts="${pts}" d="M${pts.replace(/ /g, 'L').replace(/,/g, ' ')}Z"/>`;
const dpad = {
  base: '95,64 125,64 125,95 156,95 156,125 125,125 125,156 95,156 95,125 64,125 64,95 95,95',
  Up: ['95,64 125,64 125,95 95,95', '110,73 117,83 103,83'],
  Down: ['95,125 125,125 125,156 95,156', '110,147 103,137 117,137'],
  Left: ['64,95 95,95 95,125 64,125', '73,110 83,103 83,117'],
  Right: ['125,95 156,95 156,125 125,125', '147,110 137,117 137,103'],
};
const arm = n => `<g class="b dpad" data-button="${n}">${shape('cap', dpad[n][0])}${shape('ink', dpad[n][1])}</g>`;

export const zero2 = {
  id: 'zero2',
  name: '8BitDo Zero 2',
  cx: 200, cy: 100, extent: [392, 200],
  dpadCenter: [110, 110],
  buttons: {
    L:      { kind: 'shoulder', x: 100, y: 14 },
    R:      { kind: 'shoulder', x: 300, y: 14 },
    Up:     { kind: 'dpad',     x: 110, y: 79 },
    Down:   { kind: 'dpad',     x: 110, y: 141 },
    Left:   { kind: 'dpad',     x: 79,  y: 110 },
    Right:  { kind: 'dpad',     x: 141, y: 110, via: [[150, 178]] },
    X:      { kind: 'face',     x: 290, y: 72 },
    Y:      { kind: 'face',     x: 252, y: 110, via: [[318, 134], [290, 110]] },
    A:      { kind: 'face',     x: 328, y: 110 },
    B:      { kind: 'face',     x: 290, y: 148 },
    Select: { kind: 'small',    x: 182, y: 162, via: [[166, 188]] },
    Start:  { kind: 'small',    x: 218, y: 162, power: 'Turns the remote on' },
  },
  // Rough circles covering each button, [x, y, r, owner], used to plan leader
  // lines for rotated views so they avoid passing under other buttons.
  obstacles: [
    [50, 28, 12, 'L'], [78, 15, 12, 'L'], [108, 13, 12, 'L'], [140, 13, 12, 'L'],
    [350, 28, 12, 'R'], [322, 15, 12, 'R'], [292, 13, 12, 'R'], [260, 13, 12, 'R'],
    [110, 79, 17, 'Up'], [110, 141, 17, 'Down'], [79, 110, 17, 'Left'], [141, 110, 17, 'Right'], [110, 110, 17, ''],
    [290, 72, 20, 'X'], [252, 110, 20, 'Y'], [328, 110, 20, 'A'], [290, 148, 20, 'B'],
    [182, 162, 12, 'Select'], [218, 162, 12, 'Start'],
  ],
  columns: [
    ['L', 'Up', 'Left', 'Down', 'Right', 'Select'],
    ['R', 'X', 'A', 'Y', 'B', 'Start'],
  ],
  svg: `
    <g class="b shoulder" data-button="L"><path class="cap" d="M38 60V22Q38 4 58 4H165V40Z"/><text x="100" y="15.5">L</text></g>
    <g class="b shoulder" data-button="R"><path class="cap" d="M362 60V22Q362 4 342 4H235V40Z"/><text x="300" y="15.5">R</text></g>
    <rect class="body" x="10" y="25" width="380" height="170" rx="85"/>
    ${shape('dpad-base', dpad.base)}
    ${arm('Up')}${arm('Down')}${arm('Left')}${arm('Right')}
    <g class="b" data-button="X"><circle class="cap" cx="290" cy="72" r="18"/><text x="290" y="72">X</text></g>
    <g class="b" data-button="Y"><circle class="cap" cx="252" cy="110" r="18"/><text x="252" y="110">Y</text></g>
    <g class="b" data-button="A"><circle class="cap" cx="328" cy="110" r="18"/><text x="328" y="110">A</text></g>
    <g class="b" data-button="B"><circle class="cap" cx="290" cy="148" r="18"/><text x="290" y="148">B</text></g>
    <g class="b" data-button="Select"><circle class="cap" cx="182" cy="162" r="10"/><path class="stroke" d="M177 162h10"/></g>
    <g class="b" data-button="Start"><circle class="cap" cx="218" cy="162" r="10"/><path class="stroke" d="M213 162h10M218 157v10"/></g>
  `,
};

export const controllers = { zero2 };
