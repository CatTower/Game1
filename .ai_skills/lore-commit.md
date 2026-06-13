---
name: lore-commit
description: Framework for generating clear, automated, and structured Git commit messages based on diffs.
---
# Git Commit Message Guidelines (Lore Commit)

Always analyze `git diff --cached` before writing a commit message, and generate messages adhering to the format below.

## 1. Commit Message Structure
```text
<type>(<scope>): <short description in present tense / Korean>

- <bullet point 1: what changed and why>
- <bullet point 2: what changed and why>
```

## 2. Commit Types
- `feat`: New feature or capability.
- `fix`: Bug fix.
- `docs`: Documentation updates (including `.ai_skills`, README).
- `style`: Formatting, missing semi-colons, white-space changes (no code logic change).
- `refactor`: Refactoring production code without changing behavior.
- `test`: Adding or updating tests.
- `chore`: Build tasks, package manager configs, local tool adjustments.

## 3. Automation Instructions for AI Agent
When the user asks to "commit" or "use lore commit":
1. Run `git diff --cached` (or stage modified files if not done).
2. Generate the commit message based on the diff using the above format.
3. Keep the title under 50 characters, and explain *what* and *why* in the bullet points.
4. Execute `git commit -m "<message>"` directly or output the message for the user to commit.
