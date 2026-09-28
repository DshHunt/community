# Public data boundary

The community repository is a public, reviewable input to DSH Hunt. It is not a
copy of the SaaS catalog or its internal database. Plugin JSON records contain
only public descriptive metadata needed to identify a candidate listing.

## Allowed in plugin records

- A stable ID derived from a public source repository and a filesystem-safe slug.
- Public display name and a short, factual description.
- The public source repository URL and, when available, a public homepage URL.
- One controlled category, a small set of bounded tags, and optional public
  submission notes.

The JSON Schema in `schemas/plugin-record.schema.json` is the machine-readable
contract. Every example in `examples/` is synthetic and is not a real listing.

## Never add

- User accounts, private analysis data, access tokens, credentials, or cookies.
- Private repository content or source code copied from a third party.
- Internal labels, moderation notes, scores, analyzer findings, or scoring rules.
- Contributor-supplied publication eligibility or static-analysis results.
- Personal information that is not necessary to review the public source.

## Import and publication boundary

Community records are proposals. DSH Hunt maintainers verify and normalize
public source details, deduplicate candidates, and pass eligible source inputs
through the main application's existing import/upsert and static-analysis
workflow. Importing a record does not publish it. The main application owns
canonical identity, publication eligibility, analysis, and release decisions.
There is no automatic two-way or real-time synchronization.

Contributors must not execute submitted plugins or installation commands as
part of review. A merged community pull request means that its public metadata
was accepted into this repository; it does not mean the listing passed DSH
Hunt's analysis or is live on the website.
