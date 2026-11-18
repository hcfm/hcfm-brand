# HubSpot theme review and manual upload

Theme changes open a pull request and run `Check HubSpot theme`. This check parses
all theme JSON, checks field groups for required names and types and duplicate
names, checks module file sets, and checks standalone JavaScript syntax. Run the
same check locally with Python 3 and Node.js installed:

```sh
python3 scripts/check_hubspot_theme.py
```

These local checks cover file structure and syntax. HubL rendering, forms,
permissions, and integrations need the team's approved HubSpot preview or staging
process and human review before release.

After a reviewed change is merged, an authorized release operator can open
**Actions → Deploy to HubSpot → Run workflow**, choose `main`, and enter the full
reviewed commit SHA. The workflow requires that SHA to match the selected main
revision, repeats the local checks, and uses the pinned HubSpot CLI to upload to
the existing `_hcfm-brand-portal` destination in account `275132`.

The revision input identifies the upload being approved. It does not verify a
reviewer's approval or configure branch protection. The team must establish its
review and preview process and confirm the destination before running an upload.
A push to main does not trigger this workflow.

The upload needs the existing `HUBSPOT_PERSONAL_ACCESS_KEY` GitHub Actions secret.
The workflow reads that secret through an environment variable, writes a temporary
configuration with restricted permissions, and removes it after the run. Keep
credentials out of commits, pull request text, and logs.

The previous automated upload runs failed at the upload step. This change does
not establish the cause of that failure. Check the current CLI and account setup
against an approved preview destination before the next authorized upload. No
HubSpot upload is needed to review this pull request.
