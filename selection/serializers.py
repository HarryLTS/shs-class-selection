from rest_framework import serializers
from .models import Course, Student, Credit


class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = ('name', 'year', 's1_total', 's1_cat_grades', 's2_total', 's2_cat_grades',)


class StudentSerializer(serializers.ModelSerializer):
    credits = CreditSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = ('id', 'credits', )


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ('name', 'successors', 's1_cat_names', 's2_cat_names', )
