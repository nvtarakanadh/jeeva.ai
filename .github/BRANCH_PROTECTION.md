# Branch Protection Rules

This document outlines the recommended branch protection rules for this repository.

## Main Branch Protection

The `main` branch should have the following protection rules enabled:

1. **Require a pull request before merging**
   - Require approvals: 1
   - Dismiss stale PR approvals when new commits are pushed
   - Require review from code owners

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - Required status checks:
     - `build-and-test` (from CI workflow)
     - `security-scan` (from CI workflow)

3. **Require conversation resolution before merging**
   - All conversations on code must be resolved

4. **Restrict pushes that create files**
   - Prevent pushes that create files larger than 100MB

5. **Require linear history**
   - Prevent merge commits from being pushed to main

## Security Settings

1. **Secret scanning**
   - Enable secret scanning for all repositories
   - Automatically enable for new repositories

2. **Dependency scanning**
   - Enable dependency scanning
   - Enable Dependabot alerts

3. **Code scanning**
   - Enable CodeQL analysis
   - Run on every push and pull request

## Environment Protection

1. **Production environment**
   - Required reviewers: Repository administrators
   - Wait timer: 0 minutes
   - Prevent self-review: Yes

## How to Apply These Rules

1. Go to your repository on GitHub
2. Navigate to Settings → Branches
3. Click "Add rule" or edit existing rule for `main` branch
4. Configure the settings as outlined above
5. Save the rule

## CI/CD Status

The repository includes:
- ✅ TypeScript type checking
- ✅ ESLint code linting
- ✅ Build verification
- ✅ Security scanning with Trivy
- ✅ Secret detection
- ✅ Dependency vulnerability scanning
