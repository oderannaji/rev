# Coordinating speech actions

Feature branch: `feature/speech-action-priority`.

When voice controls are enabled, a recognized command is handled by the command controller. That phrase is withheld from automatic Scripture and slide matching, so a verse-jump command cannot also trigger a competing content match. The command remains in the transcript. When voice controls are disabled, the phrase is ordinary transcript content.

Automatic slide and Scripture display are already mutually exclusive session choices. This branch adds priority for explicit commands. The browser test checks that a completed spoken verse jump updates the displayed verse while making zero detection requests for that command phrase.
