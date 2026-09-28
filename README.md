# DSH Hunt Community

This is the public community repository for DSH Hunt. Use it for:

- plugin submissions;
- evidence corrections;
- false-positive appeals;
- methodology feedback; and
- the [public roadmap](ROADMAP.md).

Official website: <https://dshhunt.com>

## What published structure evidence means

A package record describes public repository structure at a fixed source commit. It may include the package and manifest path, declared metadata, Patch file links and order, source hashes, a limited YAML structure summary, and the collector's coverage. The public record does not rehost Patch contents.

`observed` means the recorded source files were read and checked at that commit. It does not mean the package was installed, built, or run. DSH Hunt does not infer runtime compatibility or safety from these fields. `partial` means some declared structure was outside the collector's supported coverage; missing evidence must not be read as evidence that a field or file does not exist.

## Scope and limitations

This repository does not contain DSH Hunt's closed-source product code, collection logic, or analysis rules.

DSH Hunt uses static analysis to publish evidence. Static analysis is not a security audit, and inclusion is not a security endorsement. The first release does not perform runtime compatibility testing.

DSH Hunt is an independent community project. It is not affiliated with or endorsed by DeepSeek.

## Review outcomes

`accepted` means a maintainer has reviewed a submission or correction and recorded the proposed scope. It does not mean the public site has changed; accepted evidence must still pass the release checks. `published` is used only after a release is live and the affected page has been checked. Maintainers update the Issue state after those steps.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), then choose the matching Issue form for a plugin submission, evidence correction, false-positive appeal, or methodology proposal.

## License

Unless otherwise stated, the community-authored content in this repository is licensed under [CC BY 4.0](LICENSE).

This license does not cover DSH Hunt's closed-source product code or any third-party plugin content. Third-party projects remain subject to their own licenses and terms.
