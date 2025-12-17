---
description: Safe Deployment Workflow
---

# Safe Deployment Workflow

This workflow ensures that changes are tested and built locally before being deployed to the VPS.

1.  **Run Verification Script**
    Run the `verify_changes.sh` script to execute backend tests, frontend tests, and a local frontend build.
    ```bash
    chmod +x verify_changes.sh
    ./verify_changes.sh
    ```

2.  **Fix Issues**
    If the script fails (red error messages), address the specific issues:
    -   **Backend Tests**: Fix Python code in `backend/`.
    -   **Frontend Tests**: Fix React components in `frontend/`.
    -   **Frontend Build**: Fix build errors (often syntax errors or missing dependencies) in `frontend/`.

3.  **Commit Changes**
    Once verification passes, commit your changes to git.
    ```bash
    git add .
    git commit -m "Your commit message"
    git push origin your-branch
    ```

4.  **Deploy to VPS**
    Only after step 1 passes is it safe to run the deployment script on the VPS.
