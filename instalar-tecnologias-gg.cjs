
'use strict';

/*
 GRUPO GUTIÉRREZ
 INSTALADOR TECNOLOGÍAS V1

 Ejecutar:
 node instalar-tecnologias-gg.cjs

 SQL se ejecuta por separado en Supabase.
 No crea archivos .bak.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');

const ROOT = process.cwd();
const writes = new Map();
const previous = new Map();
const full = name => path.resolve(ROOT, name);

function read(name) {
  if (!fs.existsSync(full(name))) {
    throw Error('No existe ' + name + ' en ' + ROOT);
  }
  return fs.readFileSync(full(name), 'utf8');
}

function update(file, callback) {
  writes.set(file, callback(writes.get(file) ?? read(file)));
}

function insertOnce(file, anchor, text) {
  const current = writes.has(file)
    ? writes.get(file)
    : read(file);

  if (current.includes(text.trim())) return;

  if (!current.includes(anchor)) {
    throw Error('Falta ancla ' + anchor + ' en ' + file);
  }

  writes.set(
    file,
    current.replace(anchor, text + '\n' + anchor)
  );
}

function appendCard(source, card) {
  if (source.includes('data-module="tecnologias"')) {
    return source;
  }

  const open = source.search(
    /<div\s+class=["']module-grid["']/i
  );

  if (open < 0) {
    throw Error('No se encontró .module-grid');
  }

  const tag = /<\/?div\b[^>]*>/gi;
  tag.lastIndex = open;

  let depth = 0;
  let close = -1;
  let match;

  while ((match = tag.exec(source))) {
    if (/^<div\b/i.test(match[0])) depth++;
    else depth--;

    if (depth === 0) {
      close = match.index;
      break;
    }
  }

  if (close < 0) {
    throw Error('No se encontró el cierre de la órbita');
  }

  return source.slice(0, close)
    + card + '\n'
    + source.slice(close);
}

const card = `
<!-- GG_TEC_INSTALADO_V1 -->
<div class="module-shell slot-tecnologias"
     style="--delay:.73s">
  <button type="button"
          data-module="tecnologias"
          class="module-card card-tecnologias">
    <span class="card-top">
      <span class="card-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="14"
                height="11" rx="2"/>
          <path d="M10 15v3M5 18h10"/>
          <rect x="17" y="8" width="5"
                height="12" rx="1"/>
        </svg>
      </span>
      <span class="card-serial">11 / 11</span>
    </span>
    <span class="card-content">
      <span class="card-eyebrow">
        INFRAESTRUCTURA DIGITAL
      </span>
      <strong class="card-title">
        tecnologías
      </strong>
      <span class="card-description">
        Equipos, telefonía y capacitaciones.
      </span>
    </span>
    <span class="card-footer">
      <span class="card-meta">TECNOLOGÍA</span>
      <span class="card-arrow">↗</span>
    </span>
  </button>
</div>`;

/*
 HTML, CSS y JavaScript del módulo.
 Se descomprimen a archivos normales y editables.
*/
const PAYLOAD = `
eNq9fduO40iW2K+wqraaUhXFpKi7VMqa7Kzs6oTrtnXp6Z7qQoMSQyl2UaKGpPLSqnwdr+Fd2NiFd/zglwEMLPZhYCzmwcDCgIGt
P+kf8C/4nBMRZARJKZU9Yw+mK8VgMOLEiRPnHhGbuymbLqMwOgu8xJ6ni/Du8O6jO340Ta9WzMCCw++Xj/CvEXrLs/H3d1ny/V1j
GnpJAg9nZw1oYN4Io+lH5n9/lyozz4e/hvFowVLPmM69OGEpVF6ns0af6sh3S2/B4MV5wC5WUZxiw9EyZUusfRH46Xzss/Ngyhr0
YBnBMkgDL2wkUy9k42ZVW+mcLVhjCkOKtebuOX1n0sw+SYM0ZIdvxeA//9FLjH/7n8bTeL2KjKfrNPj8z3HMfnp0wOvRJ2Gw/GjE
LITGVjGDlpdsiiDPYzaDsnmarpLhwcEMukzssyg6C5m3ChJ7Gi1kr9TEHvUPpkniPp55iyC8Gj95/vCNt0yGF2fz9Fdtxxl14L8u
/NdznC9EnefeMo5WrLLOqA/1/CBZhd7VOLnwVgAzH0aSXoUsmTOWagCWX0qYAawDlWDgmc/5gZj0R5PIv+JN+cF5RiZpw1tMApgI
aMqLA68xD3yfLfFNvGbQxKPg8NFBUPxzAG3wxrB5FivtpdFq4sUCbKjgSRCTIEnZwiNaVgg1bUxib4kU+ihZecvDp0/pb/F9Awrj
j1Dr5//2p0cHVFP+4Z8VCSRZeGF4+Ob0zduT50fG8cmLt6+PnhkHxtuT4xcvn718+vnvjt5AC1Qra9CTUOs4gjHFAUygBFJ5FQbn
CpoM2d/R8dvTb17KdifrNI2WBq5c+Ig/AQoCH5v40pt+1PEhaosfjd+uAz7VNDWHP//uPxvHXsrOohhXx6MDXu0QML1HG1VzcfjG
C4PY+Pl3v0cMKJN7wGdXrGUvWAqQj1arHB6BsQTWXBDJGl+vJ9qY5vgsqpbQCy8b2FMFeqNzFgPpI4pPjl9K7B4YruN2JXbnTY1d
cHqwszmF149Wh28jP0KmA1B6fmQb9DzxfqTCNI5C+GCljL0CzFkYeWmwPCsMBuptmV/fS70GLH5cTsA7Vus0KiKlMfVi3xA/ZZUS
FvBtcrWYRDhZP//tf80on6jXaQJCTl98AyR+9Pr0ZUbUCQxreXZ4AnO/ipJHk/jQZ8b085+oF6jFX1f15cVxdIFdIUUINAoqu92o
UxYyYKOBt2vcq3lEE7x71P/4PwqjdmHUzz7/3YsTZR1XDlkAAbTx/2fQU2/lTYMU/oNxJbtGDnIlXt448pzhiZG3YOSvTl6/efmi
PPRjrfO/wIDLSzWKJ8F2eaGvoF3rCduaRRFy1aPXr4/eAIM2Tp/AdFrG8csXJ8dvj7JRWsbL10+PXpz+5sg4+et3p69evlFbBug5
86nmRV9GgHGdw4oSjYOV4KNawPujUBVoWysiBwPusJOJqRDBTCGQUF9bu5yluWrNt6jqIAcUZH0wdwt4rpBYBHXDI0QkGvSoTXgT
FirVEyDE6TyTwT//7X+RkARL4BYCmDeilqR++ZUBCsyUzaMQZAUUf7kGLTA2GEFrGWyxAjoHnmvbSDTAe5DRhSzFJqLZjIiGANJh
FCuNd/2EgfhPF6CoJBWyMgdJPh/+/Pu/MfhHHn4VJRW0Xezk5HLKwj2b/90/GFR9j2ZfsIud8h10i4UXX1X08n/+1380js5idubF
VUtz/6XGKRS18Yw8OWzH0Rr0cKRuR0xYoqlVjwKlFZ/WKuk5r1myAroKzj3D83+ENjyjWNWgfxsxWR9cOQIFIs4+zHhOCW4O2jeK
7ZG1qxgkqTcJlj67hHJHciMiIyg4SZALRlAYe8ABvUnIDJAEYoS28S7xDOBXvmcAhXjGT1G0sLLKBggLUA7ojc9QO/8JyIjZZRbA
Af11FIc6f7ngJdWLVNDaYpVeaR8xUSKYkliJCvPnnPzd0ghBYf9JABjFZ94yAADDyEhBp7EVlk+CgdOPka4NpDMm1yWqPQbwgEmU
fv7T0kjWKxYHUWznKvFO/rLwVsD60Ww4/Pm//5OR8e9XR/DP85ffnLxGq+31u5Mnouw3L18+v6FNnAVE2k5t+TdQ6eU6LU74Uch+
JCb989/8fa4RK4SO3z3DylCn6Tj391LN8aPTZamvKYun1Bmsz7yzG1uCNcNKgB8Dc4qBW/I5JfXuH/M2t67wG0Te2xiUdRJGqkzI
C1Uaq9a2v3r5+vnR8ennf3iBwvjt6Yt3R7lwKmoZRY3bRY37JDS86ZQlkXHlGSxJP/8BKBA5Munf8HYWrkH9Rp10HSdRYhkJS6g9
48pg5wEAOAVTFkqhzgwgj6EFBtTvGUlwtkajFVZ0CpBw1b0gAMVgG8GUM2xcSIg/HXOPDtCs4T91FD5hy4Dpy9qXRdoSffrUUFYp
WBtHfNTA6dIYIAhoUZIVojX9nCWJd4a4/gaW3iyYesh10nViwFJcBIARkJg0sj1M6G0ihazFb6IQJtbwgAHT99zK09CQM6bnke/p
jS9EiW7vFfgB1mkkU+hXasPTMEpwJYjPNWLOcK2oIMKhAaYYfuUHHthzcrVQG5mSqaygkPmTqwxsqShtkYLUBRrzCA3Rwk2KGrV6
csUmXFN+8e7km5cF2z5T1TQIhNQWzFbR2LaxiRwIJNiGblgUUFnkICC3kBt9/v02xpHP7puUrXQNKuElBVyg3kiODaeZaYLc9UMP
jltZ2qosbVdL+lkUL6Q/IQHO+BU8A2TL6NwLAxg2K0oKQgWCC580S2PAIcxbh2/A2JsiW/KMNWCZI7/F+VFwxpB7TDPniXEeJGsv
BP4SipnKWYlgpDBNL1dCh1bZC5QnGVFXCjYVXLcC3IyLAHhPPNBQFTAkzMdcUwaOF4F8ByoA4BegwRi/XTNjyYDPBClLCGhN/8wH
cExOBRZ/FbDQ18cwE0XapxXGwWwd4vp9wnB5r6YB6AvCLBCeXZ+/4daMsfAuQ7Y8S+c47rZTMg9OfrSN5970yyj6aLyKpZ4VJOzz
v0RbbAEJ1OFzMDg8vXPhPdS6BQFf2e0TFoY3dhHBNER6Hwss27OPZ14apGuQap02Dn53Z6dAACnxfj+K9T4D8QqVc71jt9zxG5Ag
zIiMYHkOXwF7uBGTx5//5AdnkXGGflO957M4Wq9+mMKY9+hZthOgGbG8qdsyVb2cJCw+l4pEyi4BepbFDCL+Vq4/4ML4casMVxmw
F1EKykO0Il4QsoTMTwBOdlFtdBYWsraUXqGfasc6KroTdg/8xed/BW084t4pWFLA9vVpILfYD8v1YlIigVankvT6TaPpttpGp9vr
owjD1pB0uSPuJop4i1YB0G34+Y9L5oGEBkZaAAa6JHdVRGvdAEa9xpfoQQbTDkwlNiViBmuVVylVJQ3wDMnkFf+1vSbv6xX8yesc
cKhuzSQ4+LdhFUerVch+Ca/gXd2GYwREWEaz+2dwC97rrXjG6fOT09uwjDIJ7+AhHJ7/B5ykJGpvEr2tG0TvO9AAYnQVgFGxBMRK
0ftScA60Y7O4AVnNrxk3WIyv1wtvGVWI3y34UnQT6RQrLDMsjq4YzmSmg56Isu0Lj4Me77dMdB8EtQxLEf0qRW8EvQNTQr6USCvz
yK0aQ+5/KwzUz/x56lBzLx+hKt0+ZF9teo9x30gm7RvI5LXit+IEciT8XjByP5quCRTj1ZOvjFkQL5BWksBgl2hx7UEgQcgafswt
E9Xl+sqfoU7MkZb7znJfIX6JFgHYnCuMpnvAt4BBID4OVv7Mslf+LPfr/vt/0r1JeS/SN5LTaIyDKXqTvvYSGHLTMZ5/iQtDLpLc
a7Sb4BAdYBLzUemOrt//J9WpeJX5FQuOmtw3KBsr+00rHLhoY9PkULCj4LLhbb5mC7D/OGh7NPjX6yBV3L78aWiKYrRD3K+7nYe
gdrKUlZt8Pve8ozYvcAmWDmLYKkCVrBxz7gpu5f/CxlD9eiP0vjzH5I9nV8jQOXa013xJvPs/Py7v9/WfLKeLCgCJWxa75zt6WAX
SHoKLN9XrPMt7ja0UCv9bUqIPCduYF43O0/2d5sAh0tzA3OLvwTGSAvvz/WeIOzSdfHLnSaHMkhHfsOSg0TtpBCa+cu4RwTKSn4Q
1dWAQAhPg+rYW+FijBdF9ou1XwCUlZpcjOQTM79keCwmMSNjXpVSyiq/RShIknplKEhQaIEGnwFbLI8upNLDog+0kpLfRl6hiVSU
CPICGZCuk4yUgnNS+aIwSPUQ8CPrFzCSeKrkVU39pf1jAvgJzmN7ydKD5Wpx8KtkvfImXsIO5I/Gj8mvXM6pqJWKFn9M8tpT9KCn
0PDuT3YCcRkml79y7Gbf7sAYkpQKbNRmbGCqN7b9o56DVawO88ZzsIDeefreXasqcevu8O4wBsmwoVw54A6YODcEfvVx1GhMzoYi
YQ4eYH2xcHiv6TYHbgeez3DC4LndnLoDfwIluDCH92b0vyYWBMuP8NyZdWcePC3WKfOH9wZTrz/Bt95v1x48NlmfdeHxwosXw3us
6836/esHm0l02UiCn0DmDidRDNTegJJrHIuFI9sA6Z4Fy6EzAmQ15gwzpoYYaxlNvOlHtAWW/vDci2s4ivqIRieeAar6CPPtGjxt
bmg+eW5gbp1pJfBvI0EP+TUne4sWqMVVPUua8xv8ehgs51AzFTU3pKfHw1VENoUoHcLMYkDQ30QUxLga2u3WSFRdRmkD+Gl0wfxr
j0+AbHSEXcFimkYxqVdQd8mu33PG/mEj8vio9E6wwCCltwRIEDHIImfQaONyyKtT8XA4YbCA2UbkQg5Nc7SKkoAanwWXzB8Fy4Sl
gFAFgbGHzB3EOPyFj2rAxYNVwgwvNdqd+4br3LfuNSfupDUxHOueM3D8Ztdod6HU6eGTgTNSHwmcNBhafwkfi60njRoE+3mQBJMg
RDwJ2O0saXCzBdyKxkcSB+VWjCBvx5skUQhEOaK80mGrc34x8tCvkDYI68MmEZd46ziry5EgRcTHOhl2gNxAJ4beh5NwHdcGndVl
fZTNdNMtEyMSfX0EEg6I9f4oZLN02Gi274+8JTBjggqmHegvNdxWYjBkNgBChEJiiXEpUFY87HDppUwb1nCZzhvTeRD6Nbe+Ufq9
N2j3PJ/xvnqd+9R5y1G6BDpDYmo0nWRbky29Sb/fn3S7vMlWjzfZr2yym1z/6iO7msUgmBJDjG2TRps0hrWGImVIv0IYT21wfmE1
eufzukGpvbWm7fbr1wgTT/TMpy6G5jFoMPqpQXH5YWsk18QsZJejH9egrs+uGpLaMUTPGhOWXjC2HJ15gP4+TKcXgjHbAKQukuEU
NcFYZSd9F6qsPB8zbYZNmFsUUotVzYVyqw2w9h2c74w9wYJfDJtQDcgq8A0+4cgU6zgEcghtNCgrus9AIxbTcxyDOhaZvQqDAuSn
SPaUfADwNWynzRZZR4eoD8FKiZOUTyHxLOSobOhi+6XPm13lc54Bu1HZJqdcznYbfOZXl9kHBqmG2fAmuKo1rkvcn/PdYReGNYBR
VTHeImB2c8AWsluksw7vVabJ6hgl9DmVM4sfofawuZhDMbXPgFtcxN5qlONmIFDfuOA0gJnTJYj6ABEf2z1YFRPfkfDFXAy5HETs
zQgsm3JTMjiDJZJEg2OI85YedCporlfJZNS11/dBkZ6OSD7OwfS/GDoGUAn0aYh3fVeHp8fBEQky2kKezfqs36lujL/LG6M5l2MT
Qo+DqhC9EP9urzAK/G6k94z/cyZl0ZytOGwVqV+ZHmqmOD8VE0o8hbMK2+0kOcTDOcoGAXdDTKLnMo+1+9MKAJvdUQWn+q7WAEDq
ebNSmVaRi9PsxbnwbLqOz84sYJ6zFptZoAjBbPlSN7nnTEGSuiMNMuoQViJ8rs8RrGDDRcYArTDX95uDMixyqOqYHBjSVO9R+ZAS
t9UPlP6xmrS+KvhCcU6UKXPK3MZ2Ba+arycVTF3hwSAHpjXQIvzzudEwkCMjD7oUQrnJpbLUBSnhL6OfHlJxq4v/OJxoZe73hrQr
YhGS726XLK4mm73VCibVsAcJZjPN1VaNeRPXukwGMeYu1xP7wO244Oi0QXD0QXA0kY7rB03bcfdj7TkPJOlgaFraNkKDuYalDMqY
1/eB1owW/sbCTgt+TD3WmTlGtycK+23Q1PJWpahw7pMSN6ogyLwu2EOrISJVw1UYAEGBDriXIqNg0UDZVUAllVXQHdDc5GMAVXFG
QRcLG6U6ugLCgUINRIE/m30cquFcawCtFNFJ7Kgs1rC+mrG/EdQLhFzr9M/nVntAqoJC2G2i3Araz4h70FdoGylbQkU50Zsqvbes
2m5j0E1HyB4EEbRCq9sjCAV0bq9a2yUZgD9QErcH96uYY60BFSz8pw42fEolTRcosl6UMzhAEFqu32Oe07dIozfwRbejvpDjxmT2
Cu09X6h8RHytNfu42FwXVpvb7haQ3xw0FdUO9bmRwhJwkFsR53oFtLjtAkmQENu1PNsdWp5ur9Vv+xMPTCin2Xfb/gDGfb+AJGzd
6BKeHMfp4uY3jqQmF9E0lx51hy79hmqOoJ5X1/Vi/KfhBzH3yAwB7PViqSlLVCMBMzdVhWg+HMNuJZYqpESBhJkeSX3HXxo/oBVi
9PblBjjdQoZRe0Nglz1dPt4bTFiftQZtHWkt5Py9jkBa30KSanGSGvgDNml6ah9CddV1wArVtVINlEwZe4RJUQQNb5oCGlwO9DpS
DjQHSJpImR0uBpr7SYFOJjTFjg0FaBzziDRLSeOjMie0lc0YFSuJq4suX/rcmukXcKG1IzYRbYgrDDhTaIKFyVf9sNEDOpd1KUi7
4T30eVU3q9mFimXj0U3kx7R3hXfThq8EcK3se7fy+3bB9iT622J7gkbXBD25bmQl39Zwcq71Jrj438ziaJF5dJxqDdElfqquR1yO
19C9/LBZ/aGjf+XUM3GEIZwK3UWn3JKqlRsrPbffGnRJ4cMc/c0uHStnlp0OEsQebCRT3LuZqYzrgii91UbkEmlVqVOdTq5PaVth
bjSY97D0kUETxGgaDPGfvBuxkaZCWSMrv4WgtxD0vRZoN+cIDjdStZ0xZVt1UO2EKEPLt7/s5T4YVFta07JIUzwUVeaanE9uEFaz
AQ4XT/9RLQdSR0SHzggYPTmHnbKgFETWQqg1+d0GWrGaPeSSLb6UNCswn0LcabK5hfdni1dCsVaIatxc+SLuXk1Fco/IBl8Jh6Ec
0hYNr+CcBFa4ns4FiXC8Cf8waAyT7QrcpKiHONq8SwmJ3nusm7+A1XfGSq7daRBPQwa2gjtt+Z2mjwqGpaj7+FxhH6B6QhqQIoBz
Pa7pcM2l5XScnu+CICbekOkzHRWFdpBgkAEV/o2CgQk8YzXa51IhtEgqOCRQFE4MSnLAbUJUdNEsmGPwephVIE8npgJv9Qe7bdK/
Fa2x2y4pxW6uJ1d7QfbQA7utdttDjwDM1MBtz9wqPZBIUKo0PatKDZxsUQNp9WTMuVelrha1X5UC1wkyOYqAcPIsE6yqKWqqoaur
hlyiE9orHTGDLqhz7qDgkEI9VpgEmTrndoW/q+dP3WbWKtKQH3tnZ0hE0jAAW6dAT0UtssUGrKhDYgd9SaiTrAdocwlwq0IMNb3G
JGZeOmdG/yb1tjoaIrGiuNyXdWNbp1LDaRU0HBWS7YpOm/SarG1YObdhn1uMBeSZfeFo5Kd1YPD81uJbFPMViPSuCYiy/V9eel6T
9Vjb9W9yQA581vHBDi5AbCTnZxsZ8lG6x9+ozX9kQyAm5IjHCIwok/4oUGRQeQv5shDvcOFPAT3UsVr4I1ACL81nA8PdrNIYueeD
msu6hapGIKDt58D2b3QiM783601GlT5pzXfc0Vl77h1ms36z1+82C+DYcw+4uD8DsNT+eoBqr1/dEn/X72QtGfNWbjGhwAALyd3T
UdbulIwyHEIWFCXh7S2vLuYszped7uNpVtt/mZdR6EM3tNmYeP5ZcSaLyjk59qQXuj/t+oSFFQNutawQTBS661A7s1xvv288JMuz
LpZNs9Mv0DqqAO6A9bdLqnZxuXSKOv8ObVPKlkGRWGgG3ExqbWN9fLxGsDiz8ifE47kHvEWuxpayGlslCifFLZr8iNHbWQDIwenR
kNBqtVudfjaoszjwR5RNow9KLrbBrD1rlUIPxPDmMWY2OAroip2v6JF6NKwiTFFSBVEMZ4U82h4kqk9QxNxktxVBtxv9GH8pONSg
nACLthVvoVvdfbjTbXhbn5WYubJlnIUDtxAewctdyznayNytNHZEddWngwHaXmWAVvmAZqnaayz3Nm9TbEvOmErJ4A0mM79Z9lCh
Pbpl6LgBeqsLqNlWenX35ATtAtMBy6PlOsB0JHvo7FKVO8X1LEgK4TRktHGbfSnXbG/m6ms2tyrdQUGY6931Sr1Vhc+4nt3PahYo
p+lskRxZFgmZFCU6JULAvMltOS6Zi9vZneZAS4VxdUJJ96yY54pkHzTTus7A86vNiJ4IeFKOZkXQLg8ntDtkujvO+UVm33P3Us5o
KFK3yzjq8hhWs++2Wk2Lm7FTsBzvZ64KHo+uIKTMr1+wSxskiZxcq+9rviiefBqA5Gm5uTdKSXndKEN08iHqKrhsZQ8f4bc18v9u
cwnSSs0wfls1vTITglT1rMnM6YV6ltvbN82kq6hYPUKoK9zeSrrs5jbOJqfSY9V0t6TtZZ4HmbjVVZZ2l4NCO433cpf1ckkmOJ7b
V9rga1x05CodqWxxmy6xt7pFmWSZQHGqp6JaguRQ2nwjtcayph02YV3JIJuO67he4SsfHfO6Qdzv+yhPtKf8q0A6jpuV8wYrkDvD
5Be6Pt+/RTqTqnN38kk51NR190Z13W2KnCHcSL3RJg3/aaS4AQkWZIPrFgkwtRXY0DXXgrUOSk/NsZqzuF7ni0ppLEOE294l27wq
f+yguAq6VY6ZSo/x3hrRFutay45J5GC4wLPEUxUxDRw2Za1mq+g+YVDsyGbIgJahAydbpJ1ObkDfm7Thi37ZUs6s6FuazrzfgjCu
SBWiOD3toN2HCmDODfgvcwdn9Ez7GTB9t2Yr26nqlOkls/u3auVkXhbTZaQeN5s6+Urj/dh8i9uGYOSgDZsHjbwWT1GWTyJVWT7K
lGUNNuGuF9jOszuq49eSYP1dypv08Ct6WUbYaqw9H30+SYodgcw4ZvQKaDENwMTVxzmcRdN1UhhtoVCOOS8ujJy/KPoep6zHcqyK
LYR8t5+2Cpqdps+ZaHHfokxKR/XZ4D7bfOAVJmt7t0Jczmx0t2Y2FkGRxnSpvGhWtxW9mH6XbeiSXq6b1W672/FuEoWVMJat5lbR
aq7+rhCw3+ax0ZegQmZtvpizpbv5ZQbnFvYqpYQ6t74HKhdM7qDvg4XdKzH/nkIq7bZMfNT3FGho93pswFxnUm1NZCMTS13dMKC/
L3DN1tZIn/JJ1bQVqhRnqNoyur6nbtPcKDNEtu5N6psejpMu6AKv1ftQ1TmF890bdHxvMsm1bb5bci8Fsl8KDMrJpYFUKsBiqqmG
6+g80BUqLG6e3OSaFN98KdwIwCQ8zytki0LhoDdot9h1pSDK2EjmptfFgbajhmPIyerhlq6CzBTKiAq5o7SM0G9lbq1d8ea9PQ59
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
vw==
`.replace(/\s/g, '');

const files = JSON.parse(
  zlib.inflateSync(
    Buffer.from(PAYLOAD, 'base64')
  ).toString('utf8')
);

for (const [name, content] of Object.entries(files)) {
  writes.set(name, content);
}

// Sistema Central: nueva tarjeta y órbita.
update('sistema.html', source => {
  source = appendCard(source, card);

  source = source.replace(
    /(\b\d{2}\s*\/\s*)(?:08|09|10|11)(?=\s*<\/span>)/g,
    '$111'
  );

  return source;
});

insertOnce(
  'sistema.html',
  '</head>',
  '<link rel="stylesheet" href="css/gg-tecnologias-orbit.css">'
);

insertOnce(
  'sistema.html',
  '</body>',
  '<script src="js/gg-tecnologias-orbit.js"></script>'
);

// Órbita: aceptar el nuevo número de módulos.
update('js/sistema-orbital.js', source => {
  if (source.includes('modules.length !== 10')) {
    source = source.replace(
      'modules.length !== 10',
      'modules.length < 3'
    );
  }

  return source.replace(
    'OCHO ESPACIOS · UNA SOLA PLATAFORMA',
    'ESPACIOS · UNA SOLA PLATAFORMA'
  );
});

// Ruta de acceso desde Sistema Central.
update('js/sistema.js', source => {
  if (source.includes('"tecnologias": {')) {
    return source;
  }

  const anchor = 'const ROUTES = Object.freeze({';

  if (!source.includes(anchor)) {
    throw Error('No se encontró ROUTES en js/sistema.js');
  }

  return source.replace(
    anchor,
    anchor +
    '\n    "tecnologias": {' +
    ' name:"Tecnologías", url:"tecnologias.html" },'
  );
});

// Autorización de entrada.
update('js/gg-sistemas-nav.js', source => {
  if (!source.includes('tecnologias: "tecnologias.html"')) {
    const anchor = '  const paths = {';

    if (!source.includes(anchor)) {
      throw Error('No se encontró paths en gg-sistemas-nav.js');
    }

    source = source.replace(
      anchor,
      anchor + '\n    tecnologias: "tecnologias.html",'
    );
  }

  const before = `const {data,error} = await db.rpc(
        "gg_module_access",
        {p_module:module}
      );`;

  const after = `const {data,error} = module === "tecnologias"
        ? await db.rpc("gg_tec_has_access")
        : await db.rpc("gg_module_access",{p_module:module});`;

  if (!source.includes(after)) {
    if (!source.includes(before)) {
      throw Error('Cambió el control de acceso de navegación');
    }

    source = source.replace(before, after);
  }

  source = source.replace(
    'module !== "sistemas"\n',
    'module !== "sistemas" && module !== "tecnologias"\n'
  );

  return source;
});

// Integración con Sistemas / Accesos.
insertOnce(
  'sistemas.html',
  '</select>',
  '          <option value="tecnologias">Tecnologías</option>'
);

update('js/sistemas-panel.js', source => {
  if (source.includes('GG_TEC_SISTEMAS_V1')) {
    return source;
  }

  const anchor = '  function render() {';

  if (!source.includes(anchor)) {
    throw Error('No se encontró render() en sistemas-panel.js');
  }

  const helper = `  /* GG_TEC_SISTEMAS_V1 */
  async function loadTechRoles() {
    const {data,error}=await db.rpc("gg_tec_roles_snapshot");
    if(error){
      note("Tecnologías: "+error.message);
      return;
    }
    snapshot.roles=snapshot.roles
      .filter(r=>r.module!=="tecnologias")
      .concat(Array.isArray(data)?data:[]);
    render();
  }

`;

  source = source.replace(anchor, helper + anchor);

  const fullLoad = '    render();\n    renderRequests();';

  if (!source.includes(fullLoad)) {
    throw Error('Cambió load() en sistemas-panel.js');
  }

  source = source.replace(
    fullLoad,
    '    if ($("sysModule").value === "tecnologias")' +
    ' await loadTechRoles();\n' +
    '    else render();\n' +
    '    renderRequests();'
  );

  const selection = '    active = next;\n    render();';

  if (!source.includes(selection)) {
    throw Error('Cambió onchange en sistemas-panel.js');
  }

  source = source.replace(
    selection,
    '    active = next;\n' +
    '    if (next === "tecnologias")' +
    ' loadTechRoles(); else render();'
  );

  const oldRpc =
    'const {error} = await db.rpc(\n' +
    '      "gg_sistemas_save_roles",';

  if (!source.includes(oldRpc)) {
    throw Error('Cambió el guardado de permisos');
  }

  source = source.replace(
    oldRpc,
    'const {error} = await db.rpc(\n' +
    '      module === "tecnologias" ?' +
    ' "gg_tec_save_roles" : "gg_sistemas_save_roles",'
  );

  return source;
});

// Incorporar Tecnologías a Vite / dist.
update('vite.config.js', source => {
  if (source.includes('tecnologias:')) {
    return source;
  }

  const anchor = '                sistema:';

  if (!source.includes(anchor)) {
    throw Error('Cambió la configuración de Vite');
  }

  return source.replace(
    anchor,
    '                tecnologias:' +
    ' resolve(__dirname, "tecnologias.html"),\n\n' +
    anchor
  );
});

// Validar antes de escribir.
for (const [file, content] of writes) {
  if (!content.trim()) {
    throw Error('Archivo vacío: ' + file);
  }

  if (
    file.endsWith('.js') &&
    !file.endsWith('vite.config.js')
  ) {
    new vm.Script(content, {filename:file});
  }

  if (
    file.endsWith('.html') &&
    !content.includes('</html>')
  ) {
    throw Error('HTML incompleto: ' + file);
  }
}

// Conservar contenido anterior solamente en memoria.
for (const [name] of writes) {
  previous.set(
    name,
    fs.existsSync(full(name))
      ? fs.readFileSync(full(name))
      : null
  );
}

const applied = [];

try {
  for (const [name, content] of writes) {
    fs.mkdirSync(
      path.dirname(full(name)),
      {recursive:true}
    );

    fs.writeFileSync(
      full(name),
      content,
      'utf8'
    );

    applied.push(name);
  }

} catch (error) {
  for (const name of applied.reverse()) {
    const old = previous.get(name);

    try {
      if (old === null) {
        fs.rmSync(full(name), {force:true});
      } else {
        fs.writeFileSync(full(name), old);
      }
    } catch (restoreError) {
      console.error(
        'No se pudo restaurar',
        name,
        restoreError
      );
    }
  }

  throw error;
}

console.log(
  '\n✓ Tecnologías instalado: ' +
  writes.size + ' archivos.'
);

console.log(
  '✓ Tarjeta 11, permisos, workspace, RH y Excel.'
);

console.log(
  '✓ No se generaron respaldos .bak.'
);

console.log(
  'Ahora ejecuta npm run dev.'
);
