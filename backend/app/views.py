from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from .models import Song, Playlist, UserActivity
from .serializers import SongSerializer, PlaylistSerializer, RecentSongSerializer

@api_view(['GET'])
def home_data(request):
    try:
        #Quick access playlists
        quick_playlists = Playlist.objects.filter(playlist_type='quick')
        quick_serializer = PlaylistSerializer(quick_playlists, many=True, context={'request': request})
        
        #Recommended playlists
        recommended_playlists = Playlist.objects.filter(playlist_type='recommended')
        recommended_serializer = PlaylistSerializer(recommended_playlists, many=True, context={'request': request})
        
        #Recent songs(6)
        if request.user.is_authenticated:
            recent_activities = UserActivity.objects.filter(user=request.user)[:6]
            recent_songs = [activity.song for activity in recent_activities]
        else:
            #or show all songs
            recent_songs = Song.objects.all()[:6]
        
        recent_serializer = SongSerializer(recent_songs, many=True, context={'request': request})
        
        return Response({
            'quick_access': quick_serializer.data,
            'recommended': recommended_serializer.data,
            'recent_songs': recent_serializer.data,
            'success': True
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def library_data(request):
    try:
        #Get all playlists for library view
        all_playlists = Playlist.objects.all().order_by('-created_at')
        serializer = PlaylistSerializer(all_playlists, many=True, context={'request': request})
        
        return Response({
            'playlists': serializer.data,
            'success': True
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def playlist_songs(request, playlist_id):
    try:
        playlist = Playlist.objects.get(id=playlist_id)
        songs = playlist.songs.all()
        serializer = SongSerializer(songs, many=True, context={'request': request})
        
        return Response({
            'songs': serializer.data,
            'playlist': {
                'id': playlist.id,
                'title': playlist.title,
                'description': playlist.description,
                'song_count': playlist.song_count()
            },
            'success': True
        })
        
    except Playlist.DoesNotExist:
        return Response({
            'error': 'Playlist not found',
            'success': False
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuickAccessPlaylistsView(generics.ListAPIView):
    queryset = Playlist.objects.filter(playlist_type='quick')
    serializer_class = PlaylistSerializer

class RecommendedPlaylistsView(generics.ListAPIView):
    queryset = Playlist.objects.filter(playlist_type='recommended')
    serializer_class = PlaylistSerializer

class RecentSongsView(generics.ListAPIView):
    serializer_class = SongSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            recent_activities = UserActivity.objects.filter(user=self.request.user)[:6]
            song_ids = [activity.song.id for activity in recent_activities]
            return Song.objects.filter(id__in=song_ids)
        else:
            return Song.objects.all()[:6]

@api_view(['POST'])
def track_song_play(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)
    
    song_id = request.data.get('song_id')
    if not song_id:
        return Response({'error': 'song_id required'}, status=400)
    
    try:
        song = Song.objects.get(id=song_id)
        UserActivity.objects.create(user=request.user, song=song)
        return Response({'success': True})
    except Song.DoesNotExist:
        return Response({'error': 'Song not found'}, status=404)