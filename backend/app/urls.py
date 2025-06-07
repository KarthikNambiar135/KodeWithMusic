#app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/home/', views.home_data, name='home_data'),
    path('api/quick-access/', views.QuickAccessPlaylistsView.as_view(), name='quick_access'),
    path('api/library/', views.library_data, name='library_data'),
    path('api/playlist/<int:playlist_id>/songs/', views.playlist_songs, name='playlist_songs'),
    path('api/recommended/', views.RecommendedPlaylistsView.as_view(), name='recommended'),
    path('api/recent-songs/', views.RecentSongsView.as_view(), name='recent_songs'),
    path('api/track-play/', views.track_song_play, name='track_play'),
]
