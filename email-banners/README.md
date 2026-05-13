# email-banners/

Live banner images that ride at the bottom of every HCFM email signature.

| Path | URL recipients see | Who controls it |
|---|---|---|
| `parent/banner.png` | https://emmanuelepau.github.io/hcfm-brand/email-banners/parent/banner.png | HCFM Marketing & Communications |
| `ftp/banner.png` | https://emmanuelepau.github.io/hcfm-brand/email-banners/ftp/banner.png | Family Theater Productions |

## How to update a banner

Use **Banner Studio**: https://emmanuelepau.github.io/hcfm-brand/banner-upload/

Drop a 600×200 PNG, pick the target, click Publish. Within ~10 minutes every staff signature in the org shows the new banner — no action from staff.

For setup, troubleshooting, and architecture details, see `banner-upload/README.md`.

## Specs

- **Format:** PNG only (no JPG, GIF, WebP — Outlook compatibility)
- **Dimensions:** Exactly 600 × 200 pixels
- **File size:** Under 100 KB recommended, hard limit 250 KB

## Audit trail

Every banner swap is a Git commit. View history at:
- This folder: https://github.com/EmmanuelEpau/hcfm-brand/commits/main/email-banners

Reverting a bad swap = revert the commit on GitHub, or re-upload the prior file via Banner Studio.

## Why these filenames are fixed

The email signature templates point at the exact URLs above. The filenames (`banner.png`) and folder paths (`parent/`, `ftp/`) are referenced in every staff member's installed signature. Renaming or moving them breaks every signature.

If a new sub-ministry needs its own banner (e.g., Catholic Mom), add a new subfolder (`catholicmom/banner.png`) and update the corresponding signature template — don't reshuffle existing paths.
