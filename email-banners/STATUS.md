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
