# Contributing

We always welcome your contributions! Please refer to the guidelines below before contributing to this repository.

## Coding Convention

This project uses **VSCode's built-in formatter** for code styling. Please ensure that you use the default VSCode settings or the project's defined configuration to maintain consistent code formatting. You can configure your formatter settings in the .vscode/settings.json file or use the recommended extension to format on save.

**Ensure format on save is enabled** in your VSCode settings for consistent code formatting:

``` json
"editor.formatOnSave": true
```

**TypeScript/JavaScript**: We recommend the ESLint extension for additional linting.

## Pull Request (PR)

Here are some general guidelines:

* Ensure your branch is up-to-date with the latest changes from the `beta` branch.
* Your PR should include a description of the changes and the purpose behind them.
* Each PR should solve only one problem or introduce one feature to ensure easy review and testing.

## Merge Strategy

This project uses the rebase strategy when merging pull requests to avoid unnecessary merge commits. As a result, your PR must be conflict-free with the latest `beta` branch. Please ensure your branch is rebased onto the latest `beta` before submitting your PR.
