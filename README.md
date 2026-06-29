# NTE Russian Voice Watch

**NTE Russian Voice Watch** is an unofficial public tracker for the status of official Russian voice-over in **NTE: Neverness to Everness**.

The project exists because Russian text localization and Russian full audio are different things. The site tracks that difference openly: current status, official-source evidence, check history, and a multilingual appeal to the developers.

> Unofficial community project. Not affiliated with Hotta Studio, Perfect World Games, Valve, Sony Interactive Entertainment, or other rights holders.

## Live site

Use and share the official public site:

https://bonaqu.github.io/nte-russian-voice-watch/

Sharing the link is encouraged. Rehosting, copying, cloning, republishing modified versions, or monetizing the site/code/content is not allowed without written permission from the owner.

## What the site shows

- current Russian voice-over status;
- live counter since release;
- source-by-source evidence;
- check history;
- methodology for avoiding false positives;
- multilingual interface: Russian, Chinese, English, Korean, Japanese;
- open developer appeal in the same five languages.

## Core rule

A generic phrase like `Russian language supported` is **not** treated as proof of Russian voice-over.

A positive signal must explicitly connect Russian with voice-over / dubbing / full audio, or with a direct equivalent such as `配音`, `音声`, or `더빙`.

## Public statuses

| Status | Meaning |
|---|---|
| `NO_RUSSIAN_VOICE` | official sources do not confirm Russian full audio |
| `POSSIBLE_MENTION` | relevant but ambiguous official/store signal found |
| `CONFIRMED_ANNOUNCEMENT` | an official source announced Russian voice-over |
| `RUSSIAN_VOICE_RELEASED` | Russian full audio is confirmed as available |
| `UNKNOWN` | not enough reliable data; the monitor does not guess |

## Sources and data

Configured sources are stored in `data/sources.json`. The tracker prioritizes official NTE pages, store language fields, release FAQ pages, and related official announcements.

Community and media search pages may be monitored as a watchlist only. They can surface an unverified lead, but they cannot change the public status unless an official source or store metadata confirms it.

Public JSON files:

- `data/status.json` — current status;
- `data/evidence.json` — latest source results;
- `data/history.json` — check history;
- `data/sources.json` — monitored source list.

The project stores short excerpts and technical fingerprints, not full copies of third-party pages.

## Local check

```bash
python -m pip install -r requirements.txt
python -m pytest -q
python scripts/check_sources_safe.py
python scripts/build_site.py
```

The static build is created in `dist/`.

## Privacy and transparency

- static site;
- no accounts;
- no forms collecting user data;
- no analytics;
- no cookies;
- no paid APIs;
- no hidden database;
- detector logic and source list are visible for transparency.

## License

This is a **source-available, non-commercial, no-rehosting** project.

You may view the source and share links to the official site. You may not copy, fork, rehost, redistribute modified versions, sell, monetize, or use the project commercially without written permission from the owner.

See [`LICENSE`](LICENSE) for the full terms.

NTE names, logos, characters, screenshots, and trademarks belong to their respective rights holders.
