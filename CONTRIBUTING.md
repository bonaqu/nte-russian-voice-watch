# Contributing

Contributions are welcome when they improve factual accuracy, source coverage, accessibility or reliability.

## Core rule

Never treat a generic statement such as “Russian language supported” as proof of Russian voice-over. A valid positive signal must explicitly connect Russian with voice, dubbing, full audio or a direct equivalent in another monitored language.

## Before a pull request

```bash
python -m pip install -r requirements.txt
python -m pytest -q
python scripts/build_site.py
```

For a new source, add it to `data/sources.json`, explain why it is official or authoritative, and include a detector test when new wording is involved.
