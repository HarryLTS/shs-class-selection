import React, { Component } from 'react';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

class GraphDisplay extends Component {
  range(start, stop, step) {
      if (typeof stop == 'undefined') {
          // one param defined
          stop = start;
          start = 0;
      }

      if (typeof step == 'undefined') {
          step = 1;
      }

      if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
          return [];
      }

      var result = [];
      for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
          result.push(i);
      }

      return result;
  };

  render() {
    let optionsCol = {
      chart: {
          type: 'column',
          backgroundColor: 'transparent'
      },
      title: {
          text: 'Comparative Performance'
      },
      xAxis: {
          categories: [
          ],
          crosshair: true
      },
      yAxis: {
          min: 0,
          title: {
              text: 'Performance (%)'
          }
      },
      tooltip: {
          headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
              '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
          footerFormat: '</table>',
          shared: true,
          useHTML: true
      },
      plotOptions: {
          column: {
              pointPadding: 0.2,
              borderWidth: 0
          }
      },
      series: [{
          name: 'Similar To You',
          data: []

      }, {
          name: 'Class Average',
          data: []

      }],
      colors: ['#2a4d69',  '#4b86b4'],
      credits: {
      	enabled:false
      }
    };

    // DS1CatMeans and CourseS1CatMeans share a keyset
    let pairCategoryNames = [
      "Mean Total Grade",
      "Mean S1 Grade",
      "Mean S2 Grade",
    ]

    let avgPairs = [
      ["TotalMean", "CourseMean"],
      ["DS1Mean", "CourseS1Mean"],
      ["DS2Mean", "CourseS2Mean"]

    ]

    // total/sem means first
    for (let i = 0; i < avgPairs.length; i++) {
      optionsCol.xAxis.categories.push(pairCategoryNames[i]);
      optionsCol.series[0].data.push(this.props.courseData[avgPairs[i][0]] * 100);
      optionsCol.series[1].data.push(this.props.courseData[avgPairs[i][1]] * 100);
    }

    // cat means next
    for (let catName of Object.keys(this.props.courseData.DS1CatMeans)) {
      optionsCol.xAxis.categories.push("Mean " + catName + " Grade");
      optionsCol.series[0].data.push(this.props.courseData.DS1CatMeans[catName] * 100);
      optionsCol.series[1].data.push(this.props.courseData.CourseS1CatMeans[catName] * 100);
    }

    optionsCol.xAxis.categories.push("Median Total Grade");
    optionsCol.series[0].data.push(this.props.courseData.TotalMedian * 100);
    optionsCol.series[1].data.push(this.props.courseData.CourseMedian * 100);

    const relativeLowerBound = this.props.courseData.CourseMean - (this.props.courseData.CourseStDev * 3);
    const relativeUpperBound = this.props.courseData.CourseMean + (this.props.courseData.CourseStDev * 3);
    const lowerBound = 0.5 - (0.5/3) * 2, upperBound = 0.5 + (0.5/3) * 2;
    const matchPosition = (this.props.courseData.TotalMean - relativeLowerBound) / (relativeUpperBound - relativeLowerBound);

    console.log(this.props.courseData);
    console.log(matchPosition);

    const normalY = (x, mean, stdDev) => Math.exp((-0.5) * Math.pow((x - mean) / stdDev, 2)) * 100000;

    const getMean = (lowerBound, upperBound) => (upperBound + lowerBound) / 2;

    // distance between mean and each bound of a 95% confidence interval
    // is 2 stdDeviation, so distance between the bounds is 4
    const getStdDeviation = (lowerBound, upperBound) => (upperBound - lowerBound) / 4;


    const generatePoints = (lowerBound, upperBound) => {
      let stdDev = getStdDeviation(lowerBound, upperBound);
      let min = lowerBound - 2 * stdDev;
      let max = upperBound + 2 * stdDev;
      let unit = (max - min) / 100;
      return this.range(min, max, unit);
    }

    let mean = getMean(lowerBound, upperBound);
    let stdDev = getStdDeviation(lowerBound, upperBound);
    let points = generatePoints(lowerBound, upperBound);
    let seriesData = points.map(x => ({ x, y: normalY(x, mean, stdDev)}));

    const optionsDist = {
        chart: {
            type: 'area',
            height: 300,
            backgroundColor: 'transparent'
        },
        title: {
            text: 'Mean Grade of Similar Students vs. Class Average (Normal Curve)',
            y:40
        },
        yAxis: {
          labels: {
          	enabled: false,
    			},
          gridLineWidth: 0,
          title: ''
        },
        xAxis: {
        	tickInterval: 1/6,
          labels: {
            formatter: function() {
                if ( this.isFirst ) { return ''; }
                return this.value.toFixed(2);
            }
          }
        },
        tooltip: {
           enabled: false,
        },
        legend: {
        	enabled: false,
    		},
        series: [{
            data: seriesData,
            marker: {
              enabled: false
            }
        }],
        plotOptions: {
        	area: {
          	enableMouseTracking: false,
            color: '#2a4d69',
            fillColor: '#4b86b4',
            zoneAxis: 'x',
            zones: [{
              fillColor: 'white',
              value: matchPosition
            }]
    			}
        },
        credits: {
        	enabled:false
        }
    };

    const optionsHist = {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Performance of Similar Students'
      },
      subtitle: {
        text: ''
      },
      xAxis: {
        categories: this.props.courseData.HistogramBinNames,
        crosshair: true
      },
      yAxis: {
        min: 0,
        title: {
          text: ''
        }
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
          '<td style="padding:0"><b>{point.y:.1f} students</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0,
          borderWidth: 0,
          groupPadding: 0,
          shadow: false
        }
      },
      series: [{
        name: 'Count',
        data: this.props.courseData.HistogramBinValues,
        borderWidth: 1,
        borderColor: '#2a4d69'
      }],
      colors: ['#4b86b4'],
      credits: {
        enabled:false
      }
    };

    return (
      <div className='graphDisplay'>
      <HighchartsReact
        highcharts={Highcharts}
        options={optionsHist}
      />
      <HighchartsReact
        highcharts={Highcharts}
        options={optionsCol}
      />
      <HighchartsReact
        highcharts={Highcharts}
        options={optionsDist}
      />
      </div>
    );
  }
}
export default GraphDisplay;
