from django.db import models

class NivelReservatorio(models.Model):
    nivel = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.timestamp} - {self.nivel}"
