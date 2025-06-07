from rest_framework import serializers
from .models import Song, Playlist, Artist, UserActivity

class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['id', 'name', 'bio', 'image']

class SongSerializer(serializers.ModelSerializer):
    artist = ArtistSerializer(read_only=True)
    cover = serializers.SerializerMethodField()
    
    class Meta:
        model = Song
        fields = ['id', 'title', 'artist', 'duration', 'audio_file', 'cover']
    
    def get_cover(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None

class PlaylistSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()
    artist = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = ['id', 'title', 'description', 'cover', 'count', 'artist', 'playlist_type']
    
    def get_count(self, obj):
        return f"{obj.song_count()} songs"
    
    def get_cover(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None
    
    def get_artist(self, obj):
        #For recommended playlists, returns description as artist
        return obj.description if obj.playlist_type == 'recommended' else None

class RecentSongSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    
    class Meta:
        model = UserActivity
        fields = ['song', 'played_at']