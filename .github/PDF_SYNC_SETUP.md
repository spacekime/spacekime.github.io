# PDF Sync Setup

This repository now deploys through [`.github/workflows/pages.yml`](/.github/workflows/pages.yml).

To turn on automatic PDF syncing:

1. Edit [`pdf-sources.json`](/pdf-sources.json) and replace each placeholder `repository` with the real `owner/repo`.
2. Set `"enabled": true` for each paper you want the workflow to pull from GitHub.
3. If any paper repository is private, add a repository secret named `PAPER_REPO_TOKEN` in this site repo with read access to those repositories.
4. In the repository settings for `spacekime.github.io`, switch GitHub Pages to deploy from GitHub Actions.

The workflow listens for:

- `push` to `main`
- `workflow_dispatch`
- `repository_dispatch` with type `paper-pdf-updated`
- a scheduled sync every 6 hours

To update the site immediately after a paper repo rebuilds, trigger this repository from that paper repo with a `repository_dispatch` event. Example:

```yaml
- name: Notify website repo
  env:
    GH_TOKEN: ${{ secrets.WEBSITE_DISPATCH_TOKEN }}
  run: |
    curl -L \
      -X POST \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/spacekime/spacekime.github.io/dispatches \
      -d '{"event_type":"paper-pdf-updated"}'
```

If a paper repo emits dated filenames, the most reliable approach is to also publish a stable PDF filename there so the manifest does not need to change after each rebuild.
