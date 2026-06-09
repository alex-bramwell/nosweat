## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Check the relevant option(s) -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Style update (formatting, renaming)
- [ ] ♻️ Code refactor (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 Build configuration change

## Related Issues
<!-- Link to related issues using #issue_number -->

Closes #

## Changes Made
<!-- List the specific changes made in this PR -->

- 
- 
- 

## Testing
<!-- Verify as much as possible BEFORE requesting review. See README -> Deployment -> Shipping process. -->

**Local (before opening the PR):**
- [ ] `npm run lint` passes (0 errors) and `npm run build` succeeds
- [ ] Affected `/api/*` endpoints smoke-tested locally (expected status codes)
- [ ] DB migrations applied locally (`npx supabase migration up`) if schema changed

**On the Vercel preview (this PR):**
- [ ] No CSP / console errors loading a gym site
- [ ] Stripe **test-mode** checkout works end-to-end (if payments/CSP touched)
- [ ] Fonts, images, and auth behave as expected

## Screenshots (if applicable)
<!-- Add screenshots to demonstrate visual changes -->

## Checklist
<!-- Check all that apply -->

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes
<!-- Add any additional information that reviewers should know -->
