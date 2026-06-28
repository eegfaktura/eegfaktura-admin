# Changelog

Alle nennenswerten Änderungen an **eegfaktura-admin (Admin-Frontend)** werden hier dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung an den Deployment-Release-Tags. Detail-Diffs bleiben im `git log`;
dieser Changelog hebt die für Überblick und Betrieb relevanten Änderungen hervor.

## [Unreleased]

## [1.0.0] – 2026-06-28

Erster vollständig aus öffentlichem Quellcode gebauter Produktiv-Release.

### Fixed
- Konfiguration: `keycloak-config.json` wird als Env-Template ins Image gebacken
  statt als leeres `{}`. (#7)
- Registrierung: Validierungsfehler beim Netzbetreiber-Namen wird bei ID-Auswahl
  abgeräumt. (#5)

### Changed
- Quellcode aus Sourcemaps wiederhergestellt, damit der Admin-Frontend aus Source
  baut. (#1)
- CI: Push in den Development-Tier der Registry mit Auto-Rollout-Bridge
  (dispatch-deploy). (#3, #4)
- AGPL-3.0-Lizenz ergänzt; README mit Service-Überblick und Tech-Stack. (#2, #6)
