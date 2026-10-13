# @stylzo/unicode

Turn plain text into fancy Unicode styles in JavaScript. Bold, cursive, gothic, bubble, glitch,
small caps, zalgo, fullwidth, kaomoji and more — no font, no install on the user's side.

Pure ES module, **zero dependencies**, about 14 KB. Runs in the browser, Node, and any framework.

Used to power [Stylzo](https://www.abdulsamad.shop/), which builds 5,600+ style variations from
this engine.

## Install

```bash
npm install @stylzo/unicode
```

## Use

```js
import { transform } from '@stylzo/unicode';

transform('hello', [{ type: 'map', name: 'bold' }]);
// -> 𝐡𝐞𝐥𝐥𝐨
```

The pipeline is the same idea as CSS: an ordered list of stages, each one transforming the output
of the last. That means styles compose — a bold gothic is a map followed by another map.

`marks` takes a single mark name or an array of them, not an options object:

```js
transform('hello', [
  { type: 'map', name: 'fraktur' },
  { type: 'combine', marks: ['strike'] },
]);
// -> 𝔥̶𝔢̶𝔩̶𝔩̶𝔬̶
```

> **An unknown mark name is inserted literally, not rejected.** A typo becomes visible text in
> your output — `marks: ['strikethrough']` renders the word "strikethrough" after every
> character. The name is `strike`. Check against `COMBINING` first:
>
> ```js
> import { COMBINING } from '@stylzo/unicode/decorators';
> 'strike' in COMBINING; // true
> ```

## API

### `transform(text, pipeline, opts?)`

Run an ordered list of stages over `text`. Input is length-capped at 5,000 characters by default.

| Option | Default | Meaning |
| --- | --- | --- |
| `maxLength` | `5000` | Truncate input beyond this length. |

### `applyStyle(text, style, opts?)`

Convenience wrapper. Accepts either a style record (resolved with `styleToPipeline`) or a raw
pipeline.

```js
applyStyle('hello', { type: 'unicode-map', mapping: 'script' });
```

### `styleToPipeline(style)`

Resolve a style record into a stage list. Styles are plain data:

| `style.type` | Produces |
| --- | --- |
| `'unicode-map'` | A single `{ type: 'map', name: style.mapping }` |
| `'combine'` | An optional map, then `{ type: 'combine', marks }` |
| `'wrap'` | `{ type: 'frame', prefix, suffix, frame }` |
| `'transform'` | `style.pipeline` verbatim |
| `'pipeline'` | `style.pipeline` verbatim |

### `applyStage(text, stage)`

Apply one stage. Useful when you are composing styles yourself.

### `graphemes(text)`

Split text into user-perceived characters, so a combining sequence is never split in half.
Export it if you need to truncate styled text without cutting an accent or an emoji.

### `MAX_INPUT_LENGTH`

The default cap, exported so you can reuse it rather than hardcoding 5,000.

## Alphabets

`ALPHABETS` holds the character maps, and `hasMapping(name)` tests one without throwing.

`bold`, `bold-italic`, `italic`, `script`, `bold-script`, `fraktur`, `bold-fraktur`,
`double-struck`, `sans`, `sans-bold`, `sans-italic`, `sans-bold-italic`, `monospace`,
`fullwidth`, `circled`, `negative-circled`, `squared`, `negative-squared`, `parenthesized`,
`regional`, `small`

```js
import { ALPHABETS, hasMapping } from '@stylzo/unicode/mappings';

hasMapping('fraktur'); // true
```

## Decorators

`@stylzo/unicode/decorators` exports the pieces that sit *around* or *over* characters rather than
replacing them: `COMBINING`, `FRAMES`, `DENSITY`, `ZALGO_LEVELS`, `zalgoMarks`, `seededRng`,
`MAX_ZALGO_PER_CHAR`.

`seededRng` exists so decoration is deterministic — the same input always produces the same
output. That matters if you cache results or snapshot-test them.

```js
import { zalgoMarks, seededRng } from '@stylzo/unicode/decorators';

transform('hey', [
  { type: 'combine', marks: zalgoMarks(3, seededRng('hey')) },
]);
```

## A note on support

The output is made of Unicode characters, not a font. It renders correctly wherever the app has
a glyph for every character used, which is most of the time but not always — some apps strip
rarely-used symbols and some render an empty box. Test in the destinations you care about, and
prefer styles built from everyday Latin and mathematical characters where you can.

## License

MIT