# File/Folder Naming Refactor Plan

## 1. Audit and Document Current Structure
- **Inventory**: List all folders and files, noting inconsistencies:
  - Flat vs. nested structures
  - Naming styles (kebab-case, PascalCase, etc.)
  - Import path usage (absolute vs. relative)
  - Placement of mocks, utilities, and styles
- **Output**: Create a summary table or checklist of current issues and examples.

## 2. Research and Propose Conventions
- **Best Practices**: Review conventions from popular TypeScript/React projects and community guidelines.
- **Draft Proposal**:
  - **Folder Hierarchy Example**:
    ```
    src/
      components/
        shared/
        featureX/
      features/
      hooks/
      utils/
      __mocks__/
    ```
  - **Naming Conventions**:
    - Folders: camelCase (e.g., `userProfile`) unless they are component folders (e.g., `components/UserProfile`)
    - Components: PascalCase (e.g., `UserProfile.tsx`)
    - Hooks: camelCase with `use` prefix (e.g., `useFetchData.ts`)
    - Utilities: camelCase (e.g., `formatDate.ts`)
    - Test files: `.test.ts(x)` suffix
  - **Import Paths**:
    - Prefer absolute imports from `src/` for internal modules
    - Use relative imports only within the same feature/module
- **Examples**:
  - `import { UserProfile } from 'components/UserProfile/'`
  - `import { useFetchData } from 'hooks/useFetchData'`

## 3. Standalone Components Refactor

- Move each standalone component file (e.g., `BigValueTitle.tsx`, `Collapse.tsx`) into its own PascalCase folder (e.g., `BigValueTitle/BigValueTitle.tsx`).
- In each component folder, create an `index.ts` barrel file to export the main component and any related files (e.g., `export * from './BigValueTitle'`).
- For components with internal helpers or custom hooks:
  - Create `{ComponentName}.utils.ts` for component-specific utility functions.
  - Create `{ComponentName}.hooks.ts` for custom hooks used by the component.
  - Move relevant logic from the main component file to these new files.
  - Update the barrel file to export these as needed.
- Move test files (e.g., `BigValueTitle.test.tsx`) and styles (e.g., `BigValueTitle.module.css`) into the component folder. If there are multiple tests, consider a `__tests__/` subfolder.
- Update all imports in the codebase to use the new folder structure and barrel files.
- Remove obsolete files and ensure all exports are clear and consistent.

**Example Structure:**
```
components/
  BigValueTitle/
    BigValueTitle.tsx
    BigValueTitle.test.tsx
    BigValueTitle.utils.ts
    BigValueTitle.hooks.ts
    index.ts
```

**Checklist**
- [ ] Move each standalone component to its own PascalCase folder
- [ ] Create and update barrel files (`index.ts`) for each component
- [ ] Split out utils and hooks where possible
- [ ] Move tests and styles into component folders
- [ ] Update all imports
- [ ] Clean up old files

## 4. Documentation Update
- Add finalized conventions to `CONTRIBUTING.md` or a new `docs/architecture.md`
- Include:
  - Folder structure diagram
  - Naming rules and rationale
  - Import path guidelines
  - Example code snippets

## 5. Refactor Strategy
- **Phasing**:
  - Break work into sub-tasks (by feature, folder, or file type)
  - Prioritize least disruptive changes first
- **Coordination**:
  - Schedule around major ongoing PRs to minimize merge conflicts
  - Communicate planned changes to all contributors
- **Execution**:
  - Apply changes incrementally (one sub-task per PR)
  - Ensure all tests pass after each change
  - Use code review to enforce new conventions

## 6. Communication and Enforcement
- Announce new standards to the team
- Encourage adherence in all new work and PRs
- Periodically audit for regressions

---

### Checklist for Completion
- [ ] Audit and document current structure
- [ ] Draft and share proposal
- [ ] Update project documentation
- [ ] Plan and schedule refactor phases
- [ ] Execute refactor (incremental PRs)
- [ ] Communicate and enforce new standards

---

*This plan is a living document. Update as needed based on team feedback and project evolution.*
