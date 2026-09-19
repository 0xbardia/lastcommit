# Product specification

LastCommit establishes whether a registered project meets its registered abandonment policy using public evidence and GenLayer semantic consensus.

The protocol distinguishes meaningful development, maintenance, infrastructure, and stewardship from superficial activity. A verdict is one of `ACTIVE`, `DORMANT`, `ABANDONED`, or `INSUFFICIENT_EVIDENCE`. Zero successfully loaded sources always resolves to `INSUFFICIENT_EVIDENCE`.

An `ABANDONED` review may make succession eligible only while its stored `config_version` equals the current project configuration. Updating sources or policy preserves the historical review but invalidates its current succession authority until a new review completes.

LastCommit proves eligibility. It does not automatically transfer assets or external project ownership.
