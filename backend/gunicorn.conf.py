# Gunicorn configuration file
import multiprocessing

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/gunicorn/ttms_access.log"
errorlog = "/var/log/gunicorn/ttms_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "ttms"

# Server mechanics
daemon = False
pidfile = "/var/run/gunicorn/ttms.pid"
user = "www-data"
group = "www-data"
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
