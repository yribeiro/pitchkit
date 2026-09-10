# Third-Party Licenses

## StatsBomb open data (`@pitchkit/data-providers`)

`@pitchkit/data-providers` fetches from
[StatsBomb's open-data repository](https://github.com/statsbomb/open-data) by
default, and a trimmed sample of that data is checked into this repo as test
fixtures (`packages/data-providers/src/statsbomb/__fixtures__/` — see the
README there for provenance).

That data is StatsBomb's, released under their own open-data user agreement
rather than an OSI licence, and using it requires crediting StatsBomb. The
current terms live in their repository; read them before relying on the data.

**No StatsBomb data is redistributed in any published package.** The fixtures
are test-only and excluded from every npm tarball, and
`@pitchkit/data-providers` ships loaders alone — it fetches from whatever URL
the caller supplies.

## mplsoccer (`@pitchkit/core`, `@pitchkit/react`)

pitchkit is a React-native reimplementation of the pitch visualisation
concepts pioneered by [mplsoccer](https://github.com/andrewRowlinson/mplsoccer)
(matplotlib-based, Python). No mplsoccer source files are vendored directly,
but portions of pitchkit's design — pitch dimension specs, coordinate
standardization, and mark/layer concepts — were ported or closely adapted
from mplsoccer's implementation. Its license is reproduced below per the
MIT license's notice-retention requirement.

Source: https://github.com/andrewRowlinson/mplsoccer

```
MIT License

Copyright (c) 2025 Anmol Durgapal, Andrew Rowlinson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
