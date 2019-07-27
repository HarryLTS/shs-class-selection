from django.contrib import admin

from .models import Student, Credit, Course

admin.site.register(Student)
admin.site.register(Credit)
admin.site.register(Course)
