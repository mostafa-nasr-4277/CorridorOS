# Security Baseline

- Measured boot: UEFI → PCRs mapped to policy; verify on first-boot.
- Device attestation: SPDM with transcript captured; include verifier policy.
- Image signing: Sign all containers; verify on pull; document keys & rotation.
- SBOM: Generate SBOM for release artifacts; attach to GitHub Releases.
- Secrets: No long-lived secrets in images; use environment or vault with transit keys.
