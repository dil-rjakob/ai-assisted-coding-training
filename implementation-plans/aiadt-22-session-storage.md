# AIADT-22 – Persist tasks in `sessionStorage`

## Objective

Ensure the Todo list survives page refreshes within the same browser session by persisting state to `sessionStorage`, while gracefully handling corrupt data or quota errors.

---

## Technical Approach

1. **Storage strategy**
   - Use the key `"todos"` in `window.sessionStorage`.
   - Data format: JSON stringified array of `Todo` objects.
2. **Hydration**
   - On app start (inside `TodoContext`), attempt to read and parse the stored value.
   - Validate that the result is an array where every element has `id: string`, `title: string`, `completed: boolean`.
   - On parse error / validation failure, clear the key and fall back to an empty array.
3. **Persistence**
   - Wrap the `todos` state with a `useEffect` that writes to storage **on every change**. Data size is small; no debouncing required at this stage.
4. **Error handling**
   - Wrap `sessionStorage.setItem` in `try/catch`.
   - On `QuotaExceededError`, log a warning and trigger a toast/alert: "Storage quota exceeded – your latest changes may not be saved." Continue using in-memory state.
5. **User feedback**
   - If a toast system already exists, reuse it; otherwise add a minimal non-blocking toast component (e.g. using CSS fixed positioning) with `useState` + timeout.
6. **Testing**
   - Unit tests using Vitest + React Testing Library.
   - Mock `window.sessionStorage` to:  
     a. Return valid data.  
     b. Return corrupt JSON.  
     c. Throw `QuotaExceededError` on set.
   - Expect:  
     • App hydrates correctly.  
     • Corrupt data resets to empty without crash.  
     • Save side-effect is called on state change.  
     • Quota error shows toast and console warning.
7. **Documentation**
   - Update `README.md` with a brief "Session persistence" section describing scope and limitations.

---

## Task Breakdown

| #   | Task                                                              | File / Location                         | Est.  |
| --- | ----------------------------------------------------------------- | --------------------------------------- | ----- |
| 1   | Create storage helpers (`loadTodos`, `saveTodos`, `isValidTodos`) | `src/utils/sessionStorage.ts`           | 0.5h  |
| 2   | Refactor `TodoContext` to hydrate from storage                    | `src/contexts/TodoContext.tsx`          | 1h    |
| 3   | Add `useEffect` to persist on every change                        | `src/contexts/TodoContext.tsx`          | 0.5h  |
| 4   | Implement toast utility if none exists                            | `src/components/Toast/`                 | 1h    |
| 5   | Wire quota error handling ↔ toast                                | `TodoContext` + toast                   | 0.5h  |
| 6   | Write unit tests for load / save / error cases                    | `src/__tests__/sessionStorage.test.tsx` | 1.5h  |
| 7   | Update `README.md`                                                | root                                    | 0.25h |
| 8   | Manual QA steps & checklist                                       | This doc                                | 0.25h |

Total: **5–6 hours**

---

## Manual QA Checklist

- [ ] Add a todo, refresh page → persists.
- [ ] Close browser, reopen app → list is empty.
- [ ] Manually corrupt `sessionStorage['todos']` in devtools → app loads with empty list, no crash.
- [ ] Simulate quota error via mock → toast appears, UI remains functional.
- [ ] All unit tests pass (`npm test`).

---

## Rollback Plan

If issues arise, revert the context changes and remove the storage helpers; the app will fall back to in-memory state.

---

## References

- Ticket: https://diligentbrands.atlassian.net/browse/AIADT-22
- React docs – [Using the effect Hook](https://react.dev/reference/react/useEffect)
- MDN – [`sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
