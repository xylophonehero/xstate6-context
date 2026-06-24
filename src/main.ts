import { createActor, setup, types } from 'xstate'

// ---------------------------------------------------------------------------
// Repro: a PARTIAL `{ context }` patch returned from a transition function
// REPLACES context instead of merging it. Keys not included are dropped.
//
// The v6.0.0-alpha.1 release note describes context updates as returning a
// "partial-or-full `{ context }` patch", which reads as: return only the keys
// you changed and the rest are preserved. That merge does not happen.
// ---------------------------------------------------------------------------

const machine = setup({
  schemas: {
    context: types<{ a: number; b: number; c: number }>(),
    events: { bump: types<{}>() },
  },
}).createMachine({
  context: { a: 1, b: 2, c: 3 },
  initial: 'idle',
  states: {
    idle: {
      on: {
        // Return ONLY the changed key — a "partial" patch.
        // @ts-expect-error v6 also TYPES the return as the full context shape,
        // so the partial is a type error too. Remove this line to see it.
        bump: ({ context }) => ({ context: { a: context.a + 1 } }),
      },
    },
  },
})

// ---------------------------------------------------------------------------
// Related type issue: a transition that returns a `{ target }` must ALSO
// include `context`, even when the transition doesn't change context. There's
// no way to return just `{ target: 'b' }` — TS requires the full context too.
// ---------------------------------------------------------------------------

setup({
  schemas: {
    context: types<{ a: number; b: number; c: number }>(),
    events: { go: types<{}>() },
  },
}).createMachine({
  context: { a: 1, b: 2, c: 3 },
  initial: 'idle',
  states: {
    idle: {
      on: {
        // @ts-expect-error returning a target without context is a type error,
        // even though this transition doesn't touch context. Remove this line
        // to see it; `{ target: 'done', context }` is currently required.
        go: () => ({ target: 'done' }),
      },
    },
    done: {},
  },
})

const actor = createActor(machine).start()

const before = actor.getSnapshot().context
actor.send({ type: 'bump' })
const after = actor.getSnapshot().context

const expected = { a: 2, b: 2, c: 3 } // if the partial patch merged
const merged = after.b === 2 && after.c === 3

const lines = [
  `xstate version: 6.0.0-alpha.5`,
  ``,
  `before: ${JSON.stringify(before)}`,
  `after : ${JSON.stringify(after)}`,
  ``,
  `expected (if partial merges): ${JSON.stringify(expected)}`,
  `merged? ${merged ? 'YES' : 'NO — b and c were dropped'}`,
]

console.log(lines.join('\n'))

// Render to the page too, so it's visible in StackBlitz without the console.
const pre = document.createElement('pre')
pre.style.cssText = 'font: 14px/1.5 monospace; padding: 1rem'
pre.textContent = lines.join('\n')
document.body.appendChild(pre)
