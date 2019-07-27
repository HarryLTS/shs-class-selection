from django.db import models


class Credit(models.Model):
    name = models.CharField(max_length=100)
    year = models.IntegerField(default=0)
    s1_total = models.FloatField(default=0)
    s1_cat_grades = models.CharField(max_length=200)
    s2_total = models.FloatField(default=0)
    s2_cat_grades = models.CharField(max_length=200)


class Student(models.Model):
    id = models.IntegerField(primary_key=True)
    credits = models.ManyToManyField(Credit, blank=True)


class Course(models.Model):
    name = models.CharField(max_length=100)
    successors = models.CharField(max_length=500)
    s1_cat_names = models.CharField(max_length=200)
    s2_cat_names = models.CharField(max_length=200)