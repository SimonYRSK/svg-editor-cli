/** The external file used by the assignment's transcript (§6). */
export const OTHER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>
`;

/** A file with attributes the kernel does not model, to prove lossless round-trips. */
export const FOREIGN_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <g id="diagram" transform="translate(60,40)">
    <rect id="a" x="0" y="0" width="120" height="60" fill="#4a90d9" stroke-width="2"/>
    <g id="nodeB" transform="translate(200,0) scale(0.8)">
      <rect x="0" y="0" width="120" height="60" fill="#f5a623"/>
      <text x="60" y="38" text-anchor="middle" font-size="16" fill="white">End</text>
    </g>
  </g>
</svg>
`;
