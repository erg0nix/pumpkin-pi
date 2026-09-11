<div align="center">

# 🎃 pumpkin-pi

</div>

## Included

- [pi-web-access](https://github.com/nicobailon/pi-web-access): search and page fetching.
- [pi-memory](https://github.com/jayzeng/pi-memory): persistent notes.
- [pi-persona](https://github.com/smoosex/pi-persona): optional persona support.

[Defaults](settings.json): dark theme, hidden thinking blocks, install telemetry off.

## Install

Requires Pi 0.85.x.

1. In your terminal:

   ```sh
   pi install git:github.com/erg0nix/pumpkin-pi
   pi
   ```

2. Inside Pi:

   ```text
   /pumpkin-setup
   ```

   Confirm the changes, then quit Pi.

3. Back in your terminal:

   ```sh
   pi
   ```

### Codex subscription login

Inside Pi, run:

```text
/login
```

Choose **ChatGPT Plus/Pro (Codex)** and complete sign-in. Then run:

```text
/model
```

Select a Codex model.

🍂

## Update

1. In your terminal:

   ```sh
   pi update --extensions
   ```

2. In your running Pi session:

   ```text
   /reload
   ```

   If Pi isn't running, start it with `pi` instead.

To apply changed shared defaults, run this inside Pi and restart after confirming changes:

```text
/pumpkin-setup
```

For a local checkout, first run this from the repository directory, then follow the update steps above:

```sh
git pull --ff-only
```

Keep credentials, sessions, and memory out of this repo.

<div align="center">

🍂 &nbsp; 🍁

</div>
