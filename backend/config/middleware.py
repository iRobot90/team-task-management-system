import logging

logger = logging.getLogger(__name__)


class DebugAuthMiddleware:
    """Temporary middleware to log Authorization header for debugging token issues.

    Install only for local debugging. It prints the HTTP_AUTHORIZATION header (if any)
    for each request so you can confirm whether the frontend is sending the token.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION')
        if auth:
            logger.debug('Incoming Authorization header for %s: %s', request.path, auth[:200])
        else:
            logger.debug('No Authorization header for %s', request.path)
        return self.get_response(request)
