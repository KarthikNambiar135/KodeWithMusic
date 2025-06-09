"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static  
from django.http import HttpResponse, Http404
from django.views.static import serve
import os
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from urllib.parse import unquote

def serve_audio(request, path):
    """Custom audio serving view with proper headers"""
    safe_path = unquote(path)
    full_path = os.path.normpath(os.path.join(settings.MEDIA_ROOT, safe_path))
    
    if not os.path.exists(full_path):
        raise Http404
    
    # Get file info
    file_size = os.path.getsize(full_path)
    
    # Handle range requests for audio streaming
    range_header = request.META.get('HTTP_RANGE')
    
    if range_header:
        # Parse range header
        try:
            range_match = range_header.replace('bytes=', '').split('-')
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else file_size - 1
            
            # Ensure valid range
            if start >= file_size:
                return HttpResponse(status=416)
            
            end = min(end, file_size - 1)
            content_length = end - start + 1
            
            # Read the requested range
            with open(full_path, 'rb') as f:
                f.seek(start)
                data = f.read(content_length)
            
            response = HttpResponse(
                data,
                content_type='audio/mpeg',
                status=206
            )
            response['Accept-Ranges'] = 'bytes'
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(content_length)
            
        except (ValueError, IndexError):
            # Invalid range header, serve full file
            with open(full_path, 'rb') as f:
                data = f.read()
            response = HttpResponse(data, content_type='audio/mpeg')
            response['Accept-Ranges'] = 'bytes'
            response['Content-Length'] = str(file_size)
    else:
        # Serve full file
        try:
            with open(full_path, 'rb') as f:
                data = f.read()
            response = HttpResponse(data, content_type='audio/mpeg')
            response['Accept-Ranges'] = 'bytes'
            response['Content-Length'] = str(file_size)
        except IOError:
            raise Http404
    
    # Add proper CORS and caching headers
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'   
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Headers'] = 'Range, Content-Type'
    response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range'
    
    return response



urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('app.urls')),
]

# Custom media serving for audio files
if settings.DEBUG:
    from backend.urls import serve_audio
    urlpatterns += [
        path('media/<path:path>', serve_audio, name='serve_media'),
    ]