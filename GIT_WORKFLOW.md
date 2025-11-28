# Git Workflow - CrossFit Comet

## Branching Strategy

This project follows a Git Flow branching model for version control.

### Main Branches

- **`main`** - Production-ready code. All releases are tagged here.
- **`develop`** - Integration branch for features. Latest development changes.

### Supporting Branches

#### Feature Branches
- **Naming**: `feature/<feature-name>`
- **Branch from**: `develop`
- **Merge back to**: `develop`
- **Purpose**: Develop new features

```bash
# Create a feature branch
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# Work on your feature...
git add .
git commit -m "feat: add new feature"

# Push and create PR to develop
git push origin feature/new-feature
```

#### Release Branches
- **Naming**: `release/<version>`
- **Branch from**: `develop`
- **Merge back to**: `main` and `develop`
- **Purpose**: Prepare for production release

```bash
# Create a release branch
git checkout develop
git checkout -b release/1.0.0

# Make final adjustments, update version numbers
git commit -m "chore: prepare release 1.0.0"

# Merge to main
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/1.0.0

# Delete release branch
git branch -d release/1.0.0
```

#### Hotfix Branches
- **Naming**: `hotfix/<issue>`
- **Branch from**: `main`
- **Merge back to**: `main` and `develop`
- **Purpose**: Quick fixes for production

```bash
# Create a hotfix branch
git checkout main
git checkout -b hotfix/critical-bug

# Fix the issue
git commit -m "fix: resolve critical bug"

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug

# Delete hotfix branch
git branch -d hotfix/critical-bug
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semi-colons, etc)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples
```
feat(navbar): add mobile menu toggle
fix(footer): correct social media links
docs(readme): update installation instructions
chore(deps): update sass-embedded to v1.80.0
```

## Pull Request Guidelines

1. **Create from feature/hotfix branch to develop (or main for hotfix)**
2. **Use descriptive PR titles** following commit convention
3. **Fill out PR template** with description, changes, and testing
4. **Request review** from at least one team member
5. **Ensure CI/CD checks pass** before merging
6. **Squash or merge commits** as appropriate
7. **Delete branch** after merging

## Version Numbering

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

Example: `1.2.3` → `1.3.0` (new feature) → `2.0.0` (breaking change)

## Quick Reference

```bash
# Initial setup
git checkout -b develop

# Daily workflow
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# ... work on feature ...
git push origin feature/my-feature
# ... create PR to develop ...

# Keep your branch updated
git checkout develop
git pull origin develop
git checkout feature/my-feature
git merge develop
```
