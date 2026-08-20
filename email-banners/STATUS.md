# Banner status

Five lines, kept current. This is the human answer to "what is live right now".
The machine answer is the daily `Banner health` workflow.

**Live since:** 20 August 2026
**Creative:** Global Rosary for Peace, all six ministries, one identical file.
600 x 100, 33 KB. Marian image, "Save The Date! OCTOBER 22, 2026,
10:00 a.m. Eastern / 4:00 p.m. Rome". Clicks land on
https://hcfm.org/pray-for-peace/ with per-ministry UTM tags.
**Replaced:** Global Rosary 2026, published 6 July, which stayed live nine days
past the 11 August event. That overrun is why the staleness gate exists.
**Next scheduled change:** 23 October 2026, the day after the event. The health
check will start failing on 23 October and open an issue every morning until
the banner is replaced. Publish the replacement 48 hours early: Gmail proxies
and caches images for external recipients, so a same-day swap does not reach
everyone the same day.
**Owner:** Emmy, Marketing and Communications.

## Banner Studio is down. You do not need it.

Checked 20 August 2026: the fine-grained GitHub token behind Banner Studio
(`hcfm-banner-studio.vercel.app`) **has expired**. Every publish through the
Studio will fail until it is replaced. Nobody noticed, because nothing was
watching it, which is the same failure that let the August banner go stale.

The Studio is a convenience. It is not how this system works. All six banners
live today were published without it.

**Publishing a banner with no Studio, no token, no tooling:**

1. Go to `github.com/hcfm/hcfm-brand/upload/main/email-banners/<ministry>`
2. Drag the PNG in. It must be named exactly `banner.png`.
3. Write why you are changing it, click Commit changes.
4. The `Banner health` workflow runs on that push and fails loudly if the file
   is the wrong size, the wrong format, too heavy, or past its `end_date`. That
   is the same validation the Studio did, except it now runs whether or not
   anyone remembers to use the Studio.

**To bring the Studio back** (Emmy only, needs a secret, so it cannot be
delegated to an agent):

- github.com/settings/personal-access-tokens → Generate new token
- Resource owner: **hcfm** (not your personal account, or it cannot see this repo)
- Repository access: Only select repositories → **hcfm-brand**
- Permissions: Repository permissions → **Contents: Read and write**
- Expiration: the longest offered. Write the date in this file when you do it.
- Then Vercel → hcfm-banner-studio → Settings → Environment Variables →
  `GITHUB_TOKEN` → update → **Redeploy**, or the old value stays live.
- Test: sign in, upload today's banner again to any ministry, reason
  "token check". Success or "no change" both mean the token works.

**Token expires:** _unknown, previous one lapsed silently. Record the date here._

## Two things IT needs to know

**1. `prayforpeace.hcfm.org` does not resolve.** NXDOMAIN, checked 20 August
2026. It appears 162 times across the Global Rosary print materials, including
the QR code on the postcard and the flyers, and it is still linked from at
least one live staff email signature. Anyone scanning that QR code today gets
a browser error. The banner deliberately points at `hcfm.org/pray-for-peace/`
instead, which is live, but the printed materials cannot be changed after the
fact. This needs a DNS record or a redirect.

**2. `banners.hcfm.org` is still not created.** Until it is, every signature
points at `hcfm.github.io/hcfm-brand/...`. That works and is stable. When the
CNAME exists and the custom domain is set in this repository's Pages settings,
the old host keeps serving, so nothing installed breaks on the day of the
change. It is a cosmetic improvement, not a blocker.
