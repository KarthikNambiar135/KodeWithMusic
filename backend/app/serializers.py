from rest_framework import serializers
from .models import Song, Playlist, Artist, UserActivity
from .models import CustomClip, MixTrack, Mix
from django.conf import settings
import os


class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['id', 'name', 'bio', 'image']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

class SongSerializer(serializers.ModelSerializer):
    artist = ArtistSerializer(read_only=True)
    cover = serializers.SerializerMethodField()
    audio_file = serializers.SerializerMethodField()    
    
    class Meta:
        model = Song
        fields = ['id', 'title', 'artist', 'duration', 'audio_file', 'cover']
    
    def get_cover(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None
    
    def get_audio_file(self, obj):
        request = self.context.get('request')
        try:
            if obj.audio_file and request:
                # Ensure the file exists before returning URL
                if hasattr(obj.audio_file, 'path') and os.path.exists(obj.audio_file.path):
                    return request.build_absolute_uri(obj.audio_file.url)
                else:
                    return None
        except Exception as e:
            print(f"Error getting audio file URL: {e}")
            return None
        return None

class PlaylistSerializer(serializers.ModelSerializer):
    cover = serializers.SerializerMethodField()
    artist = serializers.SerializerMethodField()
    clip_count = serializers.SerializerMethodField() 
    song_count = serializers.SerializerMethodField() 
    
    class Meta:
        model = Playlist
        fields = ['id', 'title', 'description', 'cover', 'artist', 'playlist_type', 'clip_count', 'song_count']

    
    def get_cover(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None
    
    def get_clip_count(self, obj):
        return CustomClip.objects.filter(playlist=obj).count()

    def get_song_count(self, obj):
        return obj.song_count()

    def get_artist(self, obj):
        #For recommended playlists, returns description as artist
        return obj.description if obj.playlist_type == 'recommended' else None


class RecentSongSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    
    class Meta:
        model = UserActivity
        fields = ['song', 'played_at']

class CustomClipSerializer(serializers.ModelSerializer):
    original_song = serializers.CharField(source='original_song.title', read_only=True)
    artist = serializers.CharField(source='original_song.artist.name', read_only=True)
    cover = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    audio_file = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomClip
        fields = ['id', 'name', 'original_song', 'artist', 'start_time', 'end_time', 
          'cover', 'duration', 'created_at', 'audio_file']
    
    def get_cover(self, obj):
        request = self.context.get('request')
        if obj.original_song.cover_image and request:
            return request.build_absolute_uri(obj.original_song.cover_image.url)
        return None
    
    def get_duration(self, obj):
        return obj.duration()
    
    def get_audio_file(self, obj):
        request = self.context.get('request')
        if obj.original_song.audio_file and request:
            return request.build_absolute_uri(obj.original_song.audio_file.url)
        return None

class MixTrackSerializer(serializers.ModelSerializer):
    clip = CustomClipSerializer(read_only=True)
    
    class Meta:
        model = MixTrack
        fields = ['clip', 'order']

class MixSerializer(serializers.ModelSerializer):
    tracks = MixTrackSerializer(source='mixtrack_set', many=True, read_only=True)
    total_duration = serializers.SerializerMethodField()
    track_count = serializers.SerializerMethodField()
    created_by = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Mix
        fields = ['id', 'name', 'tracks', 'total_duration', 'track_count', 
                 'created_by', 'is_public', 'created_at']
    
    def get_total_duration(self, obj):
        return obj.total_duration()
    
    def get_track_count(self, obj):
        return obj.track_count()