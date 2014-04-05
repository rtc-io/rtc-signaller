### 1.2.0 (05 Apr 2014)

- Signaller now emits an "init" event after it's initialized
- Fix double announce bug

### 1.1.0 (05 Apr 2014)

- Added `signaller.close()` as an alias for `signaller.leave()`
- Ensure that `end` is a valid close method as this is used by primus.

### 1.0.1 (05 Apr 2014)

- `setMaxListeners(0)` on signaller to prevent warnings

### 1.0.0 (04 Apr 2014)

- Stable 1.0.0 release