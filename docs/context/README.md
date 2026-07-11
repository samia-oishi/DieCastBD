# Session context snapshots

Working-state snapshots written by Claude Code so no session context is ever lost to a context-window compaction or `/clear`.

**Convention (for Claude):** before context runs out, before `/clear`, and at the end of any session that changed project state, write (or update) a dated snapshot here — `YYYY-MM-DD-<topic>.md`. Capture: what was done and why, current repo/branch/server state, unfinished work with next steps, and any gotchas discovered. Update the same day's file rather than creating duplicates. At the start of a session, read the newest snapshot to pick up where the last one left off.

These are working notes — coarser than `log.md` (the permanent changelog) and disposable once their content has been folded into `plan.md`/`log.md`. Old snapshots can be deleted freely.
