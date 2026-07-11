# Contributing to Writerly

Thanks for helping improve Writerly. Contributions to the interface, editor experience, accessibility, documentation, tests, and backend are all welcome.

## Before you start

1. Open an issue or start a discussion for substantial changes so the approach can be aligned early.
2. Fork the repository and create a branch from the default branch.
3. Use a short, descriptive branch name, such as `fix/chapter-actions` or `feature/pdf-layout`.

## Local setup

Install and start both parts of the application:

```bash
bun install
cd backend
bun install
bun run index.ts
```

In a second terminal, from the repository root:

```bash
bun run dev
```

The frontend runs on Vite's local URL and proxies API requests to `http://localhost:3001`.

## Making a change

- Keep changes focused on one problem or feature.
- Prefer clear, accessible UI: use meaningful controls, visible focus states, and readable text sizes.
- Keep TypeScript types accurate; avoid `any` unless there is a documented reason.
- Do not commit generated files, `node_modules`, or the local SQLite database.
- Update the README or relevant documentation when user-facing behaviour changes.

## Check your work

Before opening a pull request, run:

```bash
bun run lint
bun run build
```

Also test the affected flow in the browser. If your change touches the API, run the backend and verify the relevant request end-to-end.

## Pull requests

Please include:

- A concise explanation of what changed and why
- Screenshots or a short recording for visual changes
- Notes about testing performed
- Linked issue(s), if applicable

Keep pull requests small when practical. A maintainer may request adjustments before merging.

## Code of conduct

Be respectful and constructive. We aim for a welcoming environment for everyone who contributes.
