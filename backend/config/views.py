from django.db import connection
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
import datetime


class HealthCheckView(APIView):
    """
    Health check endpoint returning DB connection status, Cache readiness, and timestamp.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: dict})
    def get(self, request):
        db_ok = True
        try:
            connection.ensure_connection()
        except Exception:
            db_ok = False

        cache_ok = True
        try:
            cache.set("health_check_ping", "pong", timeout=10)
            cache_ok = (cache.get("health_check_ping") == "pong")
        except Exception:
            cache_ok = False

        overall_status = "healthy" if (db_ok and cache_ok) else "degraded"

        return Response({
            "status": overall_status,
            "database": "connected" if db_ok else "disconnected",
            "cache": "operational" if cache_ok else "unreachable",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }, status=status.HTTP_200_OK if overall_status == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE)
