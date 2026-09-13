# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-13

### Added
* **Optional FontAwesome Icons**:
  * New `showIcons: false` option (disabled by default for full backward compatibility) displaying crisp system icons next to each metric item.
* **Storage Mount Config Option**:
  * Added `mount` option allowing users to specify a specific mount path (e.g. `/`, `/media/usb`, or Windows `C:`). Auto-detects primary partition if unconfigured.
* **Smooth CSS Bar Transitions**:
  * Added subtle CSS animations (`transition: width 0.4s ease-in-out`) when CPU, RAM, and temperature loads change.
* **Module Suspend / Resume Optimization**:
  * Added socket communication for `SUSPEND` and `RESUME` events. Polling is stopped when MagicMirror enters screen-sleep or when the module is hidden, saving CPU cycles and power on Raspberry Pi.
* **Progress Bar Themes**:
  * Added `theme: 'default'` supporting `'trafficLight'` (intuitive Green $\rightarrow$ Amber $\rightarrow$ Red heat levels) and `'monochrome'` (minimalist silver/white for clean B&W mirrors).
* **Raspberry Pi Under-Voltage & Throttle Detection**:
  * Added hardware-level health monitoring via `vcgencmd get_throttled` detecting power supply voltage drops and CPU throttling. Displays visual indicators (`⚡` / `🔥`) and triggers notifications before power instability crashes the Pi. (Safely ignored on non-Pi platforms).
* **Network Ping & Connectivity Status**:
  * Added opt-in `NETWORK.displayPing: false` to display real-time roundtrip internet latency (`ms`) or `Offline` status with optional custom target host (`NETWORK.pingHost`). Only queries latency if enabled to preserve network resources.

### Fixed
* **Storage Drive Formatting Crash ($\ge 1\text{ TB}$ and $0\text{ B}$)**:
  * Fixed byte conversion in `node_helper.js` which returned `undefined` for drives 1 TB or larger and threw a `TypeError` on 0 bytes.
* **Cross-Platform Storage Detection**:
  * Fixed hardcoded Linux `/` mount detection so storage sizes now properly display on Windows (`C:`), macOS, and custom Docker container mounts.
* **Warning Notification Spam**:
  * Restored and implemented the `WARNING.interval` debounce setting (default 5 minutes). Alerts now trigger once per interval rather than spamming a notification every 5 seconds.
* **RAM Warning Key Mismatch**:
  * Added dual-key compatibility accepting both `RAM_USED` and `MEMORY_USED` in warning configurations so RAM alerts trigger reliably without breaking existing configurations.
* **CPU Temperature Sensor Exception**:
  * Fixed `TypeError: Cannot read properties of null (reading 'toFixed')` when running on VMs, Docker, or platforms without accessible temperature sensors.
* **Config Units Scope Safety**:
  * Safely resolved global vs module `units` configuration to prevent runtime `ReferenceError`.

### Changed
* **Code Architecture & Deduplication**:
  * Refactored frontend DOM generation in `MMM-Pinfo.js` from 13 repetitive functions (~300 lines) into unified, maintainable element builders while maintaining full backward API compatibility.
* **Parallel Query Execution**:
  * Modernized dynamic info polling in `node_helper.js` using `Promise.allSettled()`, eliminating serial polling latency.

## [1.0.1] - 2026-07-19

### Features
* **Device Hardware Details**:
  * Display device hardware model and serial number.
* **Operating System Information**:
  * Display OS distribution, release version, and codename.
* **Network Status**:
  * Display active default network interface name (e.g. `eth0`, `wlan0`).
  * Display local IPv4 and IPv6 addresses.
  * Display hardware MAC address.
* **Memory (RAM) Monitor**:
  * Display total RAM, currently used RAM, and usage percentage with step-colored progress bars.
* **Storage (Filesystem) Monitor**:
  * Display root partition total size, used capacity, and usage percentage bar.
* **CPU Status**:
  * Display CPU processor model/brand name.
  * Display real-time CPU load percentage with step-colored bar.
  * Display CPU core temperature with support for Celsius (°C) and Fahrenheit (°F).
* **System Uptime**:
  * Display formatted uptime (seconds, minutes, hours, or days).
* **Alerts & Warnings**:
  * Configurable threshold monitoring sending MagicMirror `SHOW_ALERT` notifications for CPU temperature, CPU usage, RAM, and Storage.
* **Layout & Styling**:
  * Customizable ordering for each metric item (`orderModel`, `orderRam`, etc.).
  * Independent visibility toggles for each data field (`displayModel`, `displayIPv6`, etc.).
  * Configurable alignments (`itemAlign`, `labelAlign`, `valueAlign`) and custom label texts.
