from django.db import models
from django.contrib.auth.models import User

class Artist(models.Model):
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to='artists/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    duration = models.CharField(max_length=10)
    audio_file = models.FileField(upload_to='songs/')
    cover_image = models.ImageField(upload_to='covers/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.artist.name}"

class Playlist(models.Model):
    PLAYLIST_TYPES = [
        ('quick', 'Quick Access'),
        ('recommended', 'Recommended'),
        ('user', 'User Created'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='playlists/')
    playlist_type = models.CharField(max_length=20, choices=PLAYLIST_TYPES)
    songs = models.ManyToManyField(Song, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    def song_count(self):
        return self.songs.count()
    
    def __str__(self):
        return self.title

class UserActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    played_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-played_at']
    
    def __str__(self):
        return f"{self.user.username} played {self.song.title}"
    

class CustomClip(models.Model):
    name = models.CharField(max_length=200)
    original_song = models.ForeignKey(Song, on_delete=models.CASCADE)
    start_time = models.FloatField()  # in seconds
    end_time = models.FloatField()    # in seconds
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    playlist = models.ForeignKey(Playlist, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def duration(self):
        return self.end_time - self.start_time
    
    def __str__(self):
        return f"{self.name} ({self.original_song.title})"

class Mix(models.Model):
    name = models.CharField(max_length=200)
    clips = models.ManyToManyField(CustomClip, through='MixTrack')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def total_duration(self):
        total = 0
        for track in self.mixtrack_set.all():
            total += track.clip.duration()
        return total
    
    def track_count(self):
        return self.clips.count()
    
    def __str__(self):
        return self.name

class MixTrack(models.Model):
    mix = models.ForeignKey(Mix, on_delete=models.CASCADE)
    clip = models.ForeignKey(CustomClip, on_delete=models.CASCADE)
    order = models.PositiveIntegerField()
    
    class Meta:
        ordering = ['order']
        unique_together = ['mix', 'order']

from mutagen import File
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Song)
def extract_audio_metadata(sender, instance, created, **kwargs):
    """Extract duration and other metadata from uploaded audio"""
    if created and instance.audio_file:
        try:
            audio_file = File(instance.audio_file.path)
            if audio_file:
                # Get duration in seconds
                duration_seconds = int(audio_file.info.length)
                minutes = duration_seconds // 60
                seconds = duration_seconds % 60
                
                # Update duration field
                instance.duration = f"{minutes}:{seconds:02d}"
                instance.save(update_fields=['duration'])
                
        except Exception as e:
            print(f"Error extracting metadata: {e}")