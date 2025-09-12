from django.db import models

class NivelReservatorio(models.Model):
    nivel = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.timestamp} - {self.nivel}"

class VazaoReservatorio(models.Model):
    vazao = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.timestamp} - {self.vazao}"
    
class BombaReservatorio(models.Model):
    status = models.CharField(max_length=3)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.timestamp} - {self. status}"