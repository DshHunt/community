# Contributing to DSH Hunt Community

Thank you for helping improve the public evidence and methodology maintained by DSH Hunt. Submit the matching Issue form and include only information you are authorized to share.

## Choose a contribution path

- To add or update a public plugin record, open a pull request that changes one
  JSON file under `data/plugins/`. Use the versioned schema and examples in
  `schemas/` and `examples/`.
- If you do not use Git, open the matching public Issue form. A maintainer can
  turn a reviewed request into a record change.
- Use the evidence-correction, false-positive, or methodology form for changes
  to published evidence or methodology, rather than editing plugin metadata.

All Issues and pull requests are public. Do not include secrets, private source
code, or information you are not authorized to publish. See the
[data boundary](docs/data-boundary.md) for the fields this repository accepts.

## Plugin submissions

Please use the plugin-submission form. It asks for:

- the public repository URL;
- the repository-relative bundle path (`.` for the repository root);
- the npm package name, or `Not published` if no package exists;
- the documented installation command, or `Not found`;
- the plugin type and your relationship to the project;
- the license identifier or public license URL; and
- public supporting evidence.

The form may be submitted before you know the full fixed commit SHA. Maintainers need that immutable source revision and a verifiable source before accepting a submission. An installation command is reference information only; maintainers do not run submitted commands or install submitted plugins.

## Evidence corrections

Use the evidence-correction form to identify the DSH Hunt page, report or finding ID when available, exact field, current value, proposed value, and public primary source. For repository evidence, include the full fixed commit SHA and source file path so the claim can be checked at the same revision. Link to the source instead of pasting Patch contents or other large copyrighted material.

Use the false-positive form to challenge a project or repository classification. When disputing a published report, include the report's full source SHA and evidence at that same revision; a newer commit is a separate source update. Use the methodology-feedback form for an analysis rule or methodology proposal, rather than for a plugin submission.

Requests whose only basis is “please raise my score” are not accepted. Corrections are evaluated against evidence and published methodology, not a desired score.

## Safe disclosure rules

- No private security reporting route has been verified. Do not describe a vulnerability in a public Issue. The public safe-reporting question form is only for asking whether a private route is available; include no target, affected file, vulnerability details, or reproduction steps. The notice is public and does not deliver a report privately.
- Do not submit API keys, tokens, passwords, private keys, cookies, or other secrets.
- Do not submit source code from private repositories.
- Do not paste a complete README or other copyrighted work unless you have authorization to publish it. Link to the original source and quote only the minimum evidence needed.
- Do not submit personal information that is not necessary for verification.

Static analysis is not a security audit, and acceptance into DSH Hunt is not a security endorsement.

## Plugin record pull request checklist

- [ ] The file is named `data/plugins/<slug>.json` and matches the schema.
- [ ] The repository URL is the public source for this plugin and uses HTTPS.
- [ ] The record does not already exist under another ID or slug.
- [ ] Name, description, category, and tags are objective and supported by public sources.
- [ ] No score, finding, analysis result, or internal review field is supplied.
- [ ] No credentials, private data, or unnecessary personal information is included.

Maintainers may normalize text or categories and verify source details. A
community record is a proposal for review: the main site can apply its own
normalization, deduplication, eligibility, and static-analysis steps before
publishing anything.
