# Local data, upgrades, and recovery

This release uses `.data-ogameka` under its working directory by default. It does not open, import, migrate, or delete the historical OGAMEKA Docker volumes, the earlier preview's `.data-independent` directory, browser extension databases, or exported files. Keep the previous release and its data until you have inspected and deliberately moved anything you need.

The local store is a versioned, checksum-verified JSON envelope protected by a single-writer lock. Writes are serialized and replace the previous file atomically after writing a temporary file. A validated prior copy is retained as a backup. If the primary file is damaged, recovery preserves it and requires an explicit backup recovery; if both copies fail validation, the service fails closed rather than replacing data with an empty store.

The current capture flow does not include a manual text importer. The extension submits one validated capture after an explicit click. Captures retain their `observedAt`, `quality`, and `source` facts; missing values are not filled with defaults. The demo is clearly synthetic.

The deletion control clears only the current instance's store, its backups and temporary recovery files, panel session, pending extension codes, and active extension tokens. It does not delete the old installation, its browser data, system backups, exported files, or any Docker volumes.
