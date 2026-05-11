# Life OS

A personal dashboard for tasks, deadlines, projects, reading, finance, and health tracking.

## Frontend organization

The dashboard is intentionally split into small files so you can work on one area without opening the entire app:

```text
index.html                 # Lightweight shell that loads sections, CSS, and JS
assets/css/app.css         # All shared styling
assets/js/app.js           # All dashboard behavior and data sync logic
sections/header.html       # Top navigation/header
sections/tasks.html        # Tasks view
sections/deadlines.html    # Deadlines view
sections/projects.html     # Projects view
sections/books.html        # Books view
sections/finance.html      # Finance view
sections/health.html       # Health view shell
sections/health-modals.html
sections/books-modals.html
sections/grocery-modal.html
sections/settings.html
sections/common-modals.html
sections/system-ui.html    # Toast, sync indicator, and loading overlay
```

`index.html` uses `fetch()` to load the files in `sections/`, then loads `assets/js/app.js` after the markup is present. Because browsers block `fetch()` from local `file://` pages, run the app through a local server or deploy it to GitHub Pages.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.
