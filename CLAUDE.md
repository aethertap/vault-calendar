# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin that displays calendar views of events extracted from DataView queries. Events are identified by parsing ISO dates (YYYY-MM-DD) from task text or custom DataView query results. The plugin uses SolidJS for reactive rendering and Luxon for date handling.

## Build and Development Commands

```bash
# Development mode (watch mode with inline sourcemaps)
npm run dev

# Production build (runs type check first, then bundles without sourcemaps)
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate documentation (outputs to docs/ folder)
npm run docs
```

## Testing

- Tests are located in `src/__tests__/`
- Test files use `.test.ts` or `.spec.ts` extensions
- Jest is configured with jsdom environment for DOM testing
- To run a single test file: `npm test -- <filename>`

## Architecture

### Core Plugin Flow

1. **Plugin initialization** (`src/main.tsx`):
   - `CalendarPlugin` extends Obsidian's `Plugin` class
   - Registers markdown code block processor for `calendar` blocks
   - Listens to DataView events (`dataview:index-ready`, `dataview:refresh-views`) to trigger calendar updates
   - Uses SolidJS signals to propagate changes across all calendar instances

2. **Rendering** (`src/calendar.tsx`):
   - `CalendarRenderer` is a `MarkdownRenderChild` that manages the calendar lifecycle
   - `Calendar` component (SolidJS) renders the calendar grid
   - Uses `createResource` to reactively fetch events when DataView updates
   - Events are filtered to the visible month using date pattern overlapping logic

3. **Date handling** (`src/datepattern.ts`):
   - `DatePattern` interface abstracts single dates and date ranges
   - `SimpleDate`: represents a single calendar day
   - `DateRange`: represents consecutive days (used for multi-day events)
   - All dates are parsed from ISO format (YYYY-MM-DD) in event text

4. **Event extraction**:
   - If a DataView query source is provided, executes the query via DataView API
   - If no source provided, defaults to searching all uncompleted tasks with dates
   - Supports custom output objects with `start`, `end`, `display`, and `link` properties
   - Strips date patterns from display text automatically

### Functional Programming Patterns

The codebase uses Rust-inspired error handling patterns:

- **Option type** (`src/option.ts`): Represents optional values with `Some(value)` or `None()`
  - Use `.map()`, `.andThen()`, `.unwrapOr()` for composable transformations
  - Prefer `.unwrapOr(default)` over `.unwrap()` to avoid exceptions

- **Result type** (`src/result.ts`): Represents operations that can succeed (`Ok(value)`) or fail (`Err(error)`)
  - Use `.map()`, `.andThen()`, `.orElse()` for error propagation
  - Prefer `.unwrapOr(default)` over `.unwrap()` to avoid exceptions

Note: The Option and Result types are currently defined but not widely used in the codebase yet. When refactoring code that handles nullable values or errors, prefer using these types.

### Key Dependencies

- **SolidJS**: Reactive UI framework (not React - uses different patterns)
  - Uses `createSignal()`, `createMemo()`, `createResource()` for reactivity
  - Components use JSX but are compiled differently than React
  - No virtual DOM - direct DOM manipulation

- **Luxon**: Modern replacement for moment.js
  - All dates use `DateTime` type from Luxon
  - Date arithmetic uses `Duration.fromObject({days: n})`
  - Immutable API - all operations return new DateTime objects

- **DataView API**: Obsidian plugin for querying vault metadata
  - Accessed via `getAPI()` from `obsidian-dataview`
  - Returns query results with `.value.values` array
  - Events have `.text`, `.key` (link), and optional `.value` object

## Build System

- **esbuild** (`esbuild.config.mjs`): Fast bundler with SolidJS plugin
  - Entry point: `src/main.tsx`
  - Output: `main.js` (CommonJS format)
  - External modules: Obsidian API, CodeMirror, electron
  - Development mode runs watch mode, production mode bundles once

## Code Conventions

- Use TypeScript with strict mode (`noImplicitAny: true`)
- JSX is preserved in tsconfig and handled by esbuild-plugin-solid
- Date strings always use ISO format (YYYY-MM-DD)
- Console.log statements are present for debugging DataView integration
- Event links use DataView's link objects with `.toFile().obsidianLink()`

## Current Refactoring Context

The repository is currently on branch `result-option-refactor`, suggesting ongoing work to integrate Option/Result types throughout the codebase. When making changes:

- Consider using `Option<T>` instead of `T | undefined` for optional values
- Consider using `Result<T, E>` instead of throwing exceptions
- Both types support functional composition with `.map()` and `.andThen()`
