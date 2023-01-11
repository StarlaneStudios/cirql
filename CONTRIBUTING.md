# Cirql Contribution Guide
Welcome to the development of Cirql! 😄 🎉 🎊

Developing a query builder is a difficult task, as you're always trying to accomodate for many different use-cases and syntaxes. Since just like most people we only use a subset of all SurrealDB functionality ourselves, it is important to us to receive community feedback, suggestions, and contributions to broaden the scope of Cirql.

Before partaking in development on Surrealist we do ask you to read through our contribution guidelines.

## Reporting Issues
* The issue list of this repo is **exclusively** for Bug Reports and Feature Requests.
* Bug reproductions should be as **concise** as possible.
* **Search** for your issue, it _may_ have been answered.
* See if the error is **reproduceable** with the latest version.
* **Never** comment "+1" or "me too!" on issues without leaving additional information, use the :+1: button in the top right instead.
* **Always be sure to take out any private or sensitive information**, especially when taking screenshots or inserting code snippets.

## Pull Requests
* We ask you use [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages as to keep these consistent and concise.
  * Primarily use the `feat`, `fix`, `change`, `refactor`, and `chore` types, only deviate when necessary.
* Always work on a feature branch. You should follow the convention `feat/branch-name`, e.g. `feat/tab-renaming` (See [The beginner's guide to contributing to a GitHub project](https://akrabat.com/the-beginners-guide-to-contributing-to-a-github-project/))
* Use a descriptive title no more than 64 characters long.
* For changes and feature requests, please include an example of what you are trying to solve and an example of the markup. It is preferred that you create an issue first however, as that will allow the team to review your proposal before you start. 
* Please reference the issue # that the PR resolves, something like `Fixes #1234` or `Resolves #6458` (See [closing issues using keywords](https://help.github.com/articles/closing-issues-using-keywords/))
* Releases will be drafted in release branches following the convention `release/version`, e.g. `release/1.2.3`. Critical bug fixes should be merged directly into release branches, which will be merged back into main once the release is completed.

## Code of Conduct
Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help keep Cirql an inclusive space for all.

## Final words
For general questions and discussions, please join our [Starlane Discord Community](https://discord.gg/exaQDX2). We hope you enjoy contributing to the development of Cirql, and of course thank you for reading!