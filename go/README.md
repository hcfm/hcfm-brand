# go/

Redirect pages for the campaign banner in every HCFM email signature.

Every installed signature links its banner to `https://hcfm.github.io/hcfm-brand/go/<ministry>/`, never straight at a campaign page. That means
Marketing can change where a banner click lands by editing one line in
`email-banners/campaigns.yml`, with no signature re-install anywhere in the
organisation.

These files are generated. Do not edit them by hand: edit `campaigns.yml`
and the build-go-pages workflow rewrites this folder on push.

Each page carries UTM tags (`utm_source=email-signature`, `utm_medium=email`,
`utm_campaign=<slug>`, `utm_content=<ministry>`) so banner clicks are visible
in GA4 and can be reported alongside everything else in the weekly analytics
system. A meta refresh, a JavaScript replace, and a visible button are all
present, because secure email gateways strip some of those and never all.
