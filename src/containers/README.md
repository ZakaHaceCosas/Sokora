# Containers

(As in Discord containers) Shared containers to be reused throughout the codebase. For historical reasons they’re named as if they were embeds.

One would expect containers to be simple functions that return a `ContainerBuilder`, but they’re not. These things are abhorrently complex.

Most embeds do return a `ContainerBuilder`.

`errorEmbed` returns a MessagePayload AND has side effects.

Tier ?:

- `settingsEmbed` is an exception within containers AND within the whole project, exempt of many of our code QL standards due to how hard it seemingly is to deliver the best settings experience on Discord…
