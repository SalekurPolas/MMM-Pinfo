# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
