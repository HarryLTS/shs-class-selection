from django.shortcuts import render
from rest_framework import viewsets
from .serializers import StudentSerializer, CourseSerializer
from .models import Student, Course
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json
import statistics
from json.decoder import JSONDecodeError
from scipy.stats import t

'''
class StudentView(APIView):
    def get(self, request):

        students = Student.objects.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

        #courses = Course.objects.all()
        #seralizer = CourseSerializer(courses, many=True)
        #return Response(seralizer.data)
'''


class Counter:
    def __init__(self):
        self.sum = 0
        self.count = 0

    def get_avg(self):
        if self.count == 0:
            return 0

        return self.sum / self.count


FIXED_BUFFER_TOTAL = 0.05
FIXED_BUFFER_CAT = 0.25
BIN_COUNT = 7
CONF_LEVEL = 0.95

class StudentView(APIView):
    def get(self, request):
        instructions = request.META.get('HTTP_INSTRUCTIONS')
        request_keys = request.META.get('HTTP_KEYS')
        request_grades = request.META.get('HTTP_GRADES')
        request_buffer = request.META.get('HTTP_BUFFER')

        if instructions == 'get-classes-on-load':
            return self.fetch_onload_data()
        elif instructions == 'get-pair-data':
            return self.fetch_pair_data(request_keys, request_grades)

        return Response('ERROR: BAD REQUEST.', status=status.HTTP_400_BAD_REQUEST)

    def fetch_onload_data(self):
        courses = Course.objects.all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    def fetch_pair_data(self, request_keys, request_grades):
        try:
            all_destinations = []
            destination_names = []
            origin = None
            for key in json.loads(request_keys):
                split = key.split('=>')
                if not Course.objects.filter(name=split[0]).exists() or not Course.objects.filter(name=split[1]).exists():
                    raise AssertionError

                if not origin:
                    origin = Course.objects.filter(name=split[0])[0]

                destination_names.append(split[1])
                all_destinations.append(Course.objects.filter(name=split[1])[0])
            if not origin:
                raise AssertionError

            submitted_grades = json.loads(request_grades)
            submitted_total = submitted_grades['Total']
            submitted_cat_grades = {k:submitted_grades[k] for k in submitted_grades.keys() if k != 'Total'}

            o_s1_cat_names = json.loads(origin.s1_cat_names)

            if len(submitted_cat_grades) != len(o_s1_cat_names):
                raise AssertionError

            for cat in o_s1_cat_names:
                if cat not in submitted_cat_grades or submitted_cat_grades[cat] < 0 or submitted_cat_grades[cat] > 1:
                    raise AssertionError

        except (IndexError, KeyError, AssertionError, ValueError, AttributeError, TypeError, JSONDecodeError):
            return Response('ERROR: BAD REQUEST.', status=status.HTTP_400_BAD_REQUEST)

        return_package = {}
        all_series = {}

        for d in all_destinations:
            return_package[d.name] = {
                "TotalMean": Counter(),
                "DS1Mean": Counter(),
                "DS2Mean": Counter(),
                "CourseS1Mean": Counter(),
                "CourseS2Mean": Counter(),
                "TotalCount": 0,
                "CourseMean": Counter(),
                "CourseCount": 0,
                "LessThanTotalMean": 0,
                "TotalMedian": 0,
                "TotalStDev": 0,
                "CourseS1CatMeans":{x:Counter() for x in json.loads(d.s1_cat_names)},
                "CourseS2CatMeans":{x:Counter() for x in json.loads(d.s2_cat_names)},
                "DS1CatMeans": {x:Counter() for x in json.loads(d.s1_cat_names)},
                "DS2CatMeans": {x:Counter() for x in json.loads(d.s2_cat_names)},
                "CourseMedian": 0,
                "CourseStDev": 0,
                "HistogramBinNames": [],
                "HistogramBinValues": [],
                "TCriticalValue": 0
            }
            all_series[d.name] = {
                "CourseSeries": [],
                "MatchSeries":[]
            }

        for student in Student.objects.all():
            credits_ordered = student.credits.order_by('year')
            prev_credit = None
            for cur_credit in credits_ordered:
                if prev_credit and prev_credit.year + 1 == cur_credit.year and prev_credit.name == origin.name:
                    for name in destination_names:
                        if cur_credit.name == name:
                            total_grade = (cur_credit.s1_total + cur_credit.s2_total) / 2
                            all_series[name]["CourseSeries"].append(total_grade)
                            return_package[name]["CourseMean"].sum += total_grade
                            return_package[name]["CourseMean"].count += 1

                            return_package[name]["CourseS1Mean"].sum += cur_credit.s1_total
                            return_package[name]["CourseS1Mean"].count += 1

                            return_package[name]["CourseS2Mean"].sum += cur_credit.s2_total
                            return_package[name]["CourseS2Mean"].count += 1

                            return_package[name]["CourseCount"] += 1

                            d_s1_cat_grades = json.loads(cur_credit.s1_cat_grades)
                            for cat, grade in d_s1_cat_grades.items():
                                return_package[name]["CourseS1CatMeans"][cat].sum += grade
                                return_package[name]["CourseS1CatMeans"][cat].count += 1

                            d_s2_cat_grades = json.loads(cur_credit.s2_cat_grades)
                            for cat, grade in d_s2_cat_grades.items():
                                return_package[name]["CourseS2CatMeans"][cat].sum += grade
                                return_package[name]["CourseS2CatMeans"][cat].count += 1

                            if self.is_similar(submitted_cat_grades, json.loads(prev_credit.s1_cat_grades),
                                               submitted_total, prev_credit.s1_total):
                                self.populate_package(cur_credit, return_package[name], all_series[name]["MatchSeries"])
                prev_credit = cur_credit

        for name in destination_names:
            return_package[name]["CourseMean"] = return_package[name]["CourseMean"].get_avg()
            return_package[name]["CourseS1Mean"] = return_package[name]["CourseS1Mean"].get_avg()
            return_package[name]["CourseS2Mean"] = return_package[name]["CourseS2Mean"].get_avg()

            return_package[name]["TotalMean"] = return_package[name]["TotalMean"].get_avg()
            return_package[name]["DS1Mean"] = return_package[name]["DS1Mean"].get_avg()
            return_package[name]["DS2Mean"] = return_package[name]["DS2Mean"].get_avg()

            for cat, counter in return_package[name]["DS1CatMeans"].items():
                return_package[name]["DS1CatMeans"][cat] = counter.get_avg()

            for cat, counter in return_package[name]["DS2CatMeans"].items():
                return_package[name]["DS2CatMeans"][cat] = counter.get_avg()

            for cat, counter in return_package[name]["CourseS1CatMeans"].items():
                return_package[name]["CourseS1CatMeans"][cat] = counter.get_avg()

            for cat, counter in return_package[name]["CourseS2CatMeans"].items():
                return_package[name]["CourseS2CatMeans"][cat] = counter.get_avg()

            if all_series[name]["CourseSeries"]:
                for value in all_series[name]["CourseSeries"]:
                    if value < return_package[name]["TotalMean"]:
                        return_package[name]["LessThanTotalMean"] += 1

                return_package[name]["CourseMedian"] = statistics.median(all_series[name]["CourseSeries"])
            if len(all_series[name]["CourseSeries"]) > 1:
                return_package[name]["CourseStDev"] = statistics.stdev(all_series[name]["CourseSeries"])

            if all_series[name]["MatchSeries"]:
                s_match_series = sorted(all_series[name]["MatchSeries"])
                min_val = s_match_series[0]
                max_val = s_match_series[-1]
                bin_size = (max_val - min_val) / BIN_COUNT

                thresholds = [(x + 1) * bin_size + min_val for x in range(BIN_COUNT)]
                bin_names = [str((round((x * bin_size + min_val) * 100, 2), round(((x + 1) * bin_size + min_val) * 100, 2))) for x in range(BIN_COUNT)]

                counts = [0 for x in range(BIN_COUNT)]
                i = 0
                for value in s_match_series:
                    if value > thresholds[i]:
                        i += 1
                    counts[i] += 1

                return_package[name]["HistogramBinNames"] = bin_names
                return_package[name]["HistogramBinValues"] = counts
                return_package[name]["TotalMedian"] = statistics.median(all_series[name]["MatchSeries"])

            if len(all_series[name]["MatchSeries"]) > 1:
                return_package[name]["TotalStDev"] = statistics.stdev(all_series[name]["MatchSeries"])

            df = return_package[name]["TotalCount"] - 1
            tc_value = t.ppf(CONF_LEVEL, df)
            return_package[name]["TCriticalValue"] = tc_value

        return JsonResponse(return_package)

    def is_similar(self, submitted_grades, s1_cat_grades, submitted_total, s1_total):
        if abs(submitted_total - s1_total) > FIXED_BUFFER_TOTAL:
            return False
        for cat, grade in submitted_grades.items():
            if abs(s1_cat_grades[cat] - grade) > FIXED_BUFFER_CAT:
                return False
        return True

    def populate_package(self, cur_credit, sub_package, sub_series):
        d_s1_total = cur_credit.s1_total
        d_s2_total = cur_credit.s2_total

        sub_package["DS1Mean"].sum += d_s1_total
        sub_package["DS1Mean"].count += 1

        sub_package["DS2Mean"].sum += d_s2_total
        sub_package["DS2Mean"].count += 1

        total_grade = (d_s1_total + d_s2_total) / 2
        sub_series.append(total_grade)

        sub_package["TotalMean"].sum += total_grade
        sub_package["TotalMean"].count += 1

        sub_package["TotalCount"] += 1

        d_s1_cat_grades = json.loads(cur_credit.s1_cat_grades)
        for cat, grade in d_s1_cat_grades.items():
            sub_package["DS1CatMeans"][cat].sum += grade
            sub_package["DS1CatMeans"][cat].count += 1

        d_s2_cat_grades = json.loads(cur_credit.s2_cat_grades)
        for cat, grade in d_s2_cat_grades.items():
            sub_package["DS2CatMeans"][cat].sum += grade
            sub_package["DS2CatMeans"][cat].count += 1



