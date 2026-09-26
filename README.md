# China Visa-Free Transit Checker

A single-page tool for working out whether you can enter mainland China without a
visa: either under the **240-hour (10-day) visa-free transit policy**, or under the
**30-day unilateral visa-free policy**, or under a **mutual visa exemption agreement**,
whichever applies to your passport.

No build step, no dependencies. Open `index.html` in a browser and it runs.

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup and styles |
| `data.js` | Policy data: eligible nationalities, designated ports, permitted stay areas |
| `app.js` | Dropdown wiring and the eligibility rules |

## How it decides

The checks run in order, and the first one that applies wins:

1. **Destination is mainland China** → not a transit journey.
2. **Passport is on the 30-day visa-free list** → no visa needed, and none of the
   transit conditions apply. This is reported first because it is a better outcome
   than transit for anyone who qualifies.
3. **Passport has a mutual visa exemption agreement with China** → no visa needed,
   usually up to 30 days, on terms set by each agreement.
4. **Arriving from and leaving for the same country** → not a transit journey. Both
   transit policies require onward travel to a *third* country or region (Hong Kong,
   Macao and Taiwan count as third regions).
5. **Passport is not on the 240-hour transit list** → 24-hour airside transit only.
6. **Either port is not a designated port** → reported as unconfirmed, with a pointer
   to the official list. Never reported as ineligible, since this tool's port list can
   lag the official one.
7. Otherwise → eligible for 240 hours, with the permitted stay areas and the documents
   required at the border.

## Tests

```sh
npm install
npm test
```

The suite drives the real page in Chromium and asserts on what a user sees: the
result banner and its wording, across cross-region transit, the 30-day path,
24-hour-only nationalities, recently added nationalities, unlisted ports and
incomplete input. It also checks invariants in `data.js` that a careless edit
would break — duplicate entries, nationalities that are not selectable in the
passport dropdown, a region listed as both permitted and excluded, ports in a
region with no permitted stay area, and `STAY_REGIONS` drifting out of sync with
`POLICY.regionCount`.

Run it after any change to the policy data. CI runs it on every push.

If your environment already has a Chromium, point at it instead of downloading
one: `CHROMIUM_PATH=/path/to/chromium npm test`.

The site itself has no dependencies — Playwright is only for the tests.

## Policy data

Policy last reviewed: **26 September 2026**. Source: the
[National Immigration Administration](https://en.nia.gov.cn/n147418/n147463/c183412/content.html).

The 72-hour and 144-hour transit policies were replaced on 17 December 2024 by a single
240-hour policy. Two changes matter for the rules above:

- Entry and exit ports no longer have to be in the same region.
- Travellers may cross provincial boundaries within the permitted stay areas.

Current scope: **57 eligible nationalities**, **65 designated ports**, **24 provinces,
autonomous regions and municipalities**. The NIA updates all three lists regularly, so
treat the data in `data.js` as a snapshot and re-check it against the source before
relying on a result.

## Updating the data

Everything policy-related lives in `data.js`:

- `POLICY` — duration, review date, source URL, official counts
- `TRANSIT_COUNTRIES` / `TRANSIT_COUNTRY_ADDED` — who qualifies for 240-hour transit
- `VISA_FREE_30_DAY` — unilateral 30-day entry; skips the transit rules entirely
- `MUTUAL_VISA_EXEMPT` — bilateral agreements; also skips the transit rules (kept
  disjoint from `VISA_FREE_30_DAY`)
- `PORTS` — designated ports, grouped by province
- `STAY_REGIONS` / `EXCLUDED_REGIONS` — where you may travel

Bump `POLICY.reviewedOn` and the date in the `index.html` disclaimer whenever you
re-check the source, and run `npm test` before committing.

## Disclaimer

Reference only. Visa rules change frequently and are applied at the discretion of the
border officer. Always confirm with the National Immigration Administration or your
nearest Chinese embassy before you travel.
