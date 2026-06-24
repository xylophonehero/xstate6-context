# XState v6 alpha — partial `{ context }` patch does not merge

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/xylophonehero/xstate6-context)

**Version:** `xstate@6.0.0-alpha.5`

## Summary

The [v6.0.0-alpha.1 release note](https://github.com/statelyai/xstate/releases/tag/xstate%406.0.0-alpha.1)
describes context updates as returning a **"partial-or-full `{ context }` patch"**.
In practice, returning a partial patch from a transition function **replaces**
context instead of merging it — every key not included in the returned object is
dropped.

There are two parts:

1. **Runtime:** `return { context: { a: context.a + 1 } }` from a state with
   context `{ a, b, c }` yields `{ a }` — `b` and `c` are gone.
2. **Types:** the transition return type also requires the *full* context shape,
   so the partial is a type error (see the `@ts-expect-error` in `src/main.ts`).

Related: a transition that returns a `{ target }` must also include `context`,
even when it doesn't change context — there's no way to return just
`{ target: 'b' }`. (Second `@ts-expect-error` in `src/main.ts`.)

## Run it

```sh
npm install
npm run dev        # open the page — output is on the page and in the console
npm run typecheck  # remove the @ts-expect-error to see the type error
```

## Expected vs actual

```
before: { "a": 1, "b": 2, "c": 3 }
after : { "a": 2 }            // actual

expected if partial merges: { "a": 2, "b": 2, "c": 3 }
```

## Workaround

Spread the full context: `return { context: { ...context, a: context.a + 1 } }`.
