\# /quick-end



Reduced End-of-session wrap-up. Updates docs and commits

Every destructive step requires explicit approval before proceeding.
If any documents dont exist, prompt to create them.



\---


## Step 1 — Summarise session changes



List every file modified, created, or deleted this session with a

one-line description of what changed. Group by layer:

core/, reader/, app/, file\_io/, ui/, tests/, docs



Ask: "Does this summary look correct? Type 'yes' to continue or describe corrections."



Wait for explicit approval before proceeding.



\---





\## Step 2 — Update HANDOFF.md



Rewrite HANDOFF.md with the following sections:



\*\*Last updated:\*\* today's date and branch name



\*\*What was accomplished this session:\*\* bullet list of completed work



\*\*Current state table:\*\* all layers with status (✅ stable / ⚠️ in progress / ❌ not started)



\*\*Known bugs:\*\* any new bugs discovered, and status of previously listed bugs



\*\*Backlog features:\*\* unchanged from previous HANDOFF unless items were completed or added



\*\*Next session plan:\*\* priority-ordered list of what to do next, with the top item clearly marked



\*\*Architecture reminder:\*\* dependency direction, stable files list



Show the full proposed HANDOFF.md. Ask: "Approve HANDOFF update? (yes/edit/skip)"



Wait for explicit approval before writing.



\---



\## Step 3 — Stage and commit



Run:

```

git status

git diff --stat

```



Show output. Propose a commit message in this format:

```

type(scope): short description

```

Where type is one of: feat / fix / refactor / docs / test / chore



Ask: "Approve this commit message? (yes/edit/skip)"



Wait for explicit approval. If approved, run:

```

git add -A

git commit -m "type(scope): short description"

```



Single-line commit message only. No multi-line -m strings. No newlines inside quotes.





Report success or failure. If push fails, report the error and stop.

Do not force push under any circumstances.



\---



\## Completion



Report a one-line summary: tests status, files updated, commit hash, push status.

