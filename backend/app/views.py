from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from .models import Song, Playlist, UserActivity
from .serializers import SongSerializer, PlaylistSerializer, RecentSongSerializer
from django.db.models import Q
from .models import Song, Playlist, Artist
from .models import CustomClip, Mix, MixTrack
from .serializers import CustomClipSerializer, MixSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# Helper function to get user for testing
def get_user_for_request(request):
    """Get user for request, with fallback for testing"""
    if request.user.is_authenticated:
        return request.user
    else:
        # For testing without authentication
        from django.contrib.auth.models import User
        user = User.objects.first()
        if not user:
            # Create a test user if none exists
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
        return user

@api_view(['POST'])
def preload_songs(request):
    """Endpoint to preload multiple songs"""
    try:
        song_ids = request.data.get('song_ids', [])
        
        if not song_ids:
            return Response({'error': 'song_ids required'}, status=400)
        
        songs = Song.objects.filter(id__in=song_ids).select_related('artist')
        serializer = SongSerializer(songs, many=True, context={'request': request})
        
        return Response({
            'songs': serializer.data,
            'success': True,
            'preloaded_count': len(songs)
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

        # Clips in playlist
        clips = CustomClip.objects.filter(playlist=playlist).select_related('original_song', 'original_song__artist')
        clip_serializer = CustomClipSerializer(clips, many=True, context={'request': request})
        
        return Response({
            'songs': serializer.data,
            'clips': clip_serializer.data,
            'playlist': {
                'id': playlist.id,
                'title': playlist.title,
                'description': playlist.description,
                'song_count': playlist.song_count(),
                'clip_count': clips.count()
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
    
@api_view(['GET'])
def search_data(request):
    query = request.GET.get('q', '').strip()
    
    if not query:
        return Response({
            'songs': [],
            'artists': [],
            'playlists': [],
            'success': True,
            'query': query
        })
    
    try:
        # Search songs by title or artist name
        songs = Song.objects.filter(
            Q(title__icontains=query) | 
            Q(artist__name__icontains=query)
        ).distinct()[:20]  # Limit to 20 results
        
        # Search artists by name
        artists = Artist.objects.filter(
            name__icontains=query
        )[:10]  # Limit to 10 results
        
        # Search playlists by title or description
        playlists = Playlist.objects.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query),
            is_public=True
        )[:10]  # Limit to 10 results
        
        # Serialize the data
        from .serializers import SongSerializer, PlaylistSerializer, ArtistSerializer
        
        return Response({
            'songs': SongSerializer(songs, many=True, context={'request': request}).data,
            'artists': ArtistSerializer(artists, many=True, context={'request': request}).data,
            'playlists': PlaylistSerializer(playlists, many=True, context={'request': request}).data,
            'success': True,
            'query': query,
            'total_results': {
                'songs': songs.count(),
                'artists': artists.count(),
                'playlists': playlists.count()
            }
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False,
            'query': query
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_songs(request):
    """Get all songs for the customize page"""
    try:
        songs = Song.objects.all().select_related('artist')
        serializer = SongSerializer(songs, many=True, context={'request': request})
        
        return Response({
            'songs': serializer.data,
            'success': True
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_playlists(request):
    """Get all playlists for selection"""
    try:
        playlists = Playlist.objects.all()
        serializer = PlaylistSerializer(playlists, many=True, context={'request': request})
        
        return Response({
            'playlists': serializer.data,
            'success': True
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def create_clip(request):
    """Create a custom clip from a song"""
    try:
        song_id = request.data.get('song_id')
        name = request.data.get('name')
        start_time = request.data.get('start_time', 0)
        end_time = request.data.get('end_time', 0)
        playlist_id = request.data.get('playlist_id')
        
        # Validation
        if not all([song_id, name]):
            return Response({'error': 'song_id and name are required'}, status=400)
        
        if start_time >= end_time:
            return Response({'error': 'end_time must be greater than start_time'}, status=400)
        
        try:
            start_time = float(start_time)
            end_time = float(end_time)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid time format - times must be numbers'}, status=400)
        
        # Additional validation
        if start_time < 0 or end_time < 0:
            return Response({'error': 'Times cannot be negative'}, status=400)

        
        # Get the song
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=404)
        
        # Get playlist if provided
        playlist = None
        if playlist_id:
            try:
                playlist = Playlist.objects.get(id=playlist_id)
            except Playlist.DoesNotExist:
                return Response({'error': 'Playlist not found'}, status=404)
            
        # Get user (with fallback for testing)
        user = get_user_for_request(request)
        
        # Create the clip
        clip = CustomClip.objects.create(
            name=name,
            original_song=song,
            start_time=start_time,
            end_time=end_time,
            created_by=user,
            playlist=playlist
        )
        
        serializer = CustomClipSerializer(clip, context={'request': request})
        return Response({
            'clip': serializer.data,
            'success': True
        })
        
    except Exception as e:
        print(f"Error in create_clip: {e}")  # Debug logging
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_custom_clips(request):
    """Get user's custom clips"""
    try:
        # Get user (with fallback for testing)
        user = get_user_for_request(request)
        
        clips = CustomClip.objects.filter(created_by=user).select_related(
            'original_song', 'original_song__artist'
        ).order_by('-created_at')
        
        serializer = CustomClipSerializer(clips, many=True, context={'request': request})
        
        return Response({
            'clips': serializer.data,
            'success': True
        })
    except Exception as e:
        print(f"Error in get_custom_clips: {e}")  # Debug logging
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def create_mix(request):
    """Create a mix from custom clips"""
    try:
        name = request.data.get('name')
        clip_ids = request.data.get('clips', [])
        
        if not name:
            return Response({'error': 'Mix name is required'}, status=400)
        
        if not clip_ids:
            return Response({'error': 'At least one clip is required'}, status=400)
        
        # Get user (with fallback for testing)
        user = get_user_for_request(request)
        
        # Verify all clips belong to the user
        clips = CustomClip.objects.filter(
            id__in=clip_ids, 
            created_by=user
        )
        
        if len(clips) != len(clip_ids):
            return Response({'error': 'Some clips not found or not owned by user'}, status=400)
        
        # Create the mix
        mix = Mix.objects.create(
            name=name,
            created_by=user
        )
        
        # Add clips to mix in order
        for order, clip_id in enumerate(clip_ids):
            clip = clips.get(id=clip_id)
            MixTrack.objects.create(
                mix=mix,
                clip=clip,
                order=order + 1
            )
        
        serializer = MixSerializer(mix, context={'request': request})
        return Response({
            'mix': serializer.data,
            'success': True
        })
        
    except Exception as e:
        print(f"Error in create_mix: {e}")  # Debug logging
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_user_mixes(request):
    """Get user's mixes"""
    try:
        # Get user (with fallback for testing)
        user = get_user_for_request(request)
        
        mixes = Mix.objects.filter(created_by=user).prefetch_related(
            'mixtrack_set__clip__original_song__artist'
        ).order_by('-created_at')
        
        serializer = MixSerializer(mixes, many=True, context={'request': request})
        
        return Response({
            'mixes': serializer.data,
            'success': True
        })
    except Exception as e:
        print(f"Error in get_user_mixes: {e}")  # Debug logging
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['DELETE'])
def delete_clip(request, clip_id):
    """Delete a custom clip"""
    try:
        # Get user (with fallback for testing)
        user = get_user_for_request(request)
        
        clip = CustomClip.objects.get(id=clip_id, created_by=user)
        clip.delete()
        
        return Response({
            'success': True,
            'message': 'Clip deleted successfully'
        })
    except CustomClip.DoesNotExist:
        return Response({'error': 'Clip not found'}, status=404)
    except Exception as e:
        print(f"Error in delete_clip: {e}")  # Debug logging
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['DELETE'])
def delete_mix(request, mix_id):
    """Delete a mix"""
    try:
        # Get user (with fallback for testing)
        user = get_user_for_request(request)
        
        mix = Mix.objects.get(id=mix_id, created_by=user)
        mix.delete()
        
        return Response({
            'success': True,
            'message': 'Mix deleted successfully'
        })
    except Mix.DoesNotExist:
        return Response({'error': 'Mix not found'}, status=404)
    except Exception as e:
        print(f"Error in delete_mix: {e}")  # Debug logging
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)