# Gunicorn configuration file
import multiprocessing

# Server socket
# Server socket
bind = "0.0.0.0:10000"  # Render expects port 10000 by default or $PORT

# Worker processes
workers = 4  # Default to a safe number or use multiprocessing logic safely

# Logging - Render captures stdout/stderr automatically
accesslog = "-" 
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "ttms"

# Server mechanics
daemon = False
# Remove pidfile/user/group as Render manages the process environment directly
tmp_upload_dir = None

# SSL (if needed)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Max requests
max_requests = 1000
max_requests_jitter = 100

# Graceful timeout
graceful_timeout = 30

# Django settings
raw_env = [
    'DJANGO_SETTINGS_MODULE=config.settings'
]
