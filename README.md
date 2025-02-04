# Diffy node usage

This repository contains a Node.js service that interacts with Diffy API to:

1. **Create a project** from configuration.
2. **Scan URLs** to be included in the project.
3. **Create snapshots (screenshots)** for visual testing.
4. **Create diffs** between snapshots to compare visual changes.
5. **Fetch data from a webhook** (e.g. [webhook.site](https://webhook.site/)) to retrieve last screenshots/diffs.

---

## Installation

```bash
git clone git@github.com:gregurcom/diffy-node.git

cd diffy-node
npm install
```

## Configuration
`cp .env-example .env`

Adjust .env with your api key (https://app.diffy.website/#/keys)

## Launch
Need to pass url argument:
```bash
node index.js --url="https://example.com"
```