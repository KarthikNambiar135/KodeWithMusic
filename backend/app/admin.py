from django.contrib import admin
from .models import Artist, Song, Playlist, UserActivity
from .models import CustomClip, MixTrack, Mix
# Register your models here.
admin.site.register(Artist)
admin.site.register(Song)
admin.site.register(Playlist)
admin.site.register(UserActivity)
@admin.register(CustomClip)
class CustomClipAdmin(admin.ModelAdmin):
    list_display = ['name', 'original_song', 'created_by', 'start_time', 'end_time', 'created_at']
    list_filter = ['created_at', 'playlist']
    search_fields = ['name', 'original_song__title', 'created_by__username']
    readonly_fields = ['created_at']

class MixTrackInline(admin.TabularInline):
    model = MixTrack
    extra = 0
    ordering = ['order']

@admin.register(Mix)
class MixAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'track_count', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'created_by__username']
    readonly_fields = ['created_at', 'track_count', 'total_duration']
    inlines = [MixTrackInline]
    
    def track_count(self, obj):
        return obj.track_count()
    track_count.short_description = 'Tracks'