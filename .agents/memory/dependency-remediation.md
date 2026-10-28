---
name: Dependency remediation
description: Why catalog upgrades alone do not prove a vulnerability is removed.
---

Check the resolved transitive dependency graph after upgrading shared catalog dependencies, even when installation and typechecking succeed. Use compatible deduplication for dependencies whose ranges accept both old and new majors; retain narrow security overrides when the latest parent still locks vulnerable transitive versions.

**Why:** A catalog upgrade left an older major in Next's lint dependency chain, and recursive targeted updates retained Express's old parser versions. Successful commands did not mean all vulnerable copies were gone.

**How to apply:** Confirm each affected package through the dependency scanner and resolved lockfile, not only direct manifests. Preserve the release-age guard; select an older compatible adapter release if the latest has not passed the guard.
