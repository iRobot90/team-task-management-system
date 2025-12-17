---
description: Development to Deployment Workflow
---

# Development to Deployment Workflow

This workflow ensures checking out a feature branch, making changes, verifying them, and eventually merging to the deployment branch.

1.  **Create a Feature Branch**
    Always start work on a new feature or fix on a separate branch.
    ```bash
    git checkout -b feature/your-feature-name
    ```

2.  **Make Changes & Verify**
    Develop your changes (e.g., mobile UI fixes).
    Run the verification script frequently.
    ```bash
    ./verify_changes.sh
    ```
    *Stop if there are errors and fix them.*

3.  **Commit Changes**
    ```bash
    git add .
    git commit -m "Description of changes"
    ```

4.  **Merge to Deployment Branch**
    Only when verification passes:
    ```bash
    git checkout deployment
    git merge feature/your-feature-name
    git push origin deployment
    ```

5.  **Deploy**
    Run the deployment script (which handles backups/updates).
    ```bash
    ./deploy_to_vps.sh
    ```
