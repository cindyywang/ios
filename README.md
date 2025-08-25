# Travel Luggage Rules – Prototype

Interactive static site to explore what you can bring as carry‑on, checked baggage, and customs import constraints for specific routes (e.g., CN → US, CN → DE).

## Run locally

Requirements: Python 3

```bash
python3 -m http.server 8000 --directory /workspace
```

Then open http://localhost:8000 in your browser.

## Data

Seeded dataset lives in `data/rules.json`. It uses a simple schema:

```json
{
  "version": "0.1",
  "routes": {
    "ORIGIN->DEST": {
      "items": [
        {
          "id": "unique-id",
          "name": "Human readable item name",
          "keywords": ["search", "terms"],
          "carry_on": { "status": "allowed|restricted|prohibited|unknown", "conditions": "text" },
          "checked": { "status": "allowed|restricted|prohibited|unknown", "conditions": "text" },
          "customs": { "status": "allowed|restricted|prohibited|unknown", "conditions": "text" },
          "sources": [{ "label": "Title", "url": "https://..." }]
        }
      ]
    }
  }
}
```

Extend by adding more routes (e.g., `CN->UK`, `US->JP`) and items.

## Disclaimer

This is an informational prototype. Aviation security and customs rules change and vary by airport, airline, and country. This tool may be incomplete or inaccurate. Always verify with your airline, airport security (TSA/EU), and official customs websites before you travel. Not legal advice.

## Roadmap ideas

- More countries and item coverage
- Per‑airline and per‑airport overrides
- Whitelist/blacklist categories with thresholds (e.g., battery Wh)
- Offline cache and PWA install
- Localization (EN/中文/DE)

# ios