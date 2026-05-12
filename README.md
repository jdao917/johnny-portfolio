# Johnny Dao Portfolio

Static portfolio website showcasing cloud automation, Python scripting, AWS reporting, CI/CD, and AI/LLM workflow demos.

## What this project shows

- GitHub Actions CI/CD
- GitHub Pages static hosting
- Safe cached demo outputs
- AWS automation project examples
- AI/LLM document extraction workflow examples

## Demo approach

The public demos use sanitized sample data and cached outputs. No real AWS infrastructure, secrets, or customer data are used.

## CI/CD flow

Code push -> GitHub Actions validation -> GitHub Pages deployment

## Development Workflow

This portfolio uses a simple production-style workflow:

1. Create a feature branch from `main`.
2. Make changes locally.
3. Run `python scripts/validate_site.py`.
4. Push the branch to GitHub.
5. Open a pull request into `main`.
6. Let GitHub Actions validate the site.
7. Merge the pull request after validation passes.

The `main` branch represents the live GitHub Pages site.
