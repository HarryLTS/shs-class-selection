# Generated by Django 2.2.2 on 2019-07-18 19:18

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('successors', models.CharField(max_length=500)),
                ('s1_cat_names', models.CharField(max_length=200)),
                ('s2_cat_names', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='Credit',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('year', models.IntegerField(default=0)),
                ('s1_total', models.FloatField(default=0)),
                ('s1_cat_grades', models.CharField(max_length=200)),
                ('s2_total', models.FloatField(default=0)),
                ('s2_cat_grades', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='Student',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('credits', models.ManyToManyField(blank=True, to='selection.Credit')),
            ],
        ),
    ]