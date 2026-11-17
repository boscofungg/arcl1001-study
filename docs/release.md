# Releasing and rolling back

Production deploys from the branch configured in the Vercel project (currently `study-workspace`).

1. Work on a branch and open a pull request. Vercel builds a preview URL; CI runs lint,
   type check, tests and build.
2. Check the preview on desktop and mobile: Read & ask (ask one question), General practice,
   flashcards (prepared set), mock paper.
3. Before merging, tag the current production commit: `checkpoint/pre-<name>-<YYYY-MM-DD>`.
4. Merge, then tag the merge commit `release/<name>-<YYYY-MM-DD>` and publish a GitHub Release
   from that tag with the CHANGELOG entry as its notes.
5. Rollback: revert the release commit and push to the production branch. Never force-push.
