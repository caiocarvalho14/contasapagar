from django.db import models
from django.contrib.auth.models import User
import secrets

def gerar_token():
    return secrets.token_hex(3)  # 6 caracteres hex (≈ 16.7M combinações)

class UserToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='token')
    token = models.CharField(max_length=12, unique=True, default=gerar_token)
    dc_id = models.CharField(null=True, blank=True)
    verificado = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.user.username} — {self.token}"