import React, { Component } from 'react';
import GraphDisplay from './GraphDisplay';

class CourseDisplay extends Component {
  // skip constructor

  generateDisplayInterior() {
    const standardError = this.props.courseData.TCriticalValue * ((this.props.courseData.TotalStDev * 100)/Math.sqrt(this.props.courseData.TotalCount));
    return (
      <div>
        <p className="displayBodyText"> People who performed similar to you in <span className="cdOriginCourseName">{this.props.originCourse}</span> scored on average <span className="cdCourseMean">{(this.props.courseData.CourseMean * 100).toFixed(2)}% ± {standardError.toFixed(2)} with 95% confidence</span> in <span className="cdDestCourseName">{this.props.courseName}</span>, with a standard deviation of <span className="cdStDev">{(this.props.courseData.TotalStDev * 100).toFixed(2)}</span>. This average is higher than the average scores of&nbsp;
        <span className="cdGreaterThan">{this.props.courseData.LessThanTotalMean.toFixed(0)}/{this.props.courseData.CourseCount.toFixed(0)}</span> total people who took this class, placing them into the <span className="cdPercentile">{this.getPercentile(this.props.courseData.LessThanTotalMean, this.props.courseData.CourseCount)}</span> percentile.</p>
        <p className="displaySubText"> {this.props.courseData.TotalCount} matching students found </p>
        <GraphDisplay
          courseName={this.props.courseName}
          courseData={this.props.courseData}
          originCourse={this.props.originCourse}
        />
      </div>
    );
  }

  generateDisplayInteriorEmpty() {
    return (
      <div>
        <p> There were not enough matches to display statistics for this course ({this.props.courseData.TotalCount} {this.props.courseData.TotalCount === 1 ? "match" : "matches"}). </p>
      </div>
    );
  }

  getPercentile(totalLessThan, totalCount) {
    let percentile = Math.round((totalLessThan/totalCount)*100);
    let percentileString = percentile.toString();
    if (percentile%10 === 1) {
      percentileString += "st"
    } else if (percentile%10 === 2) {
      percentileString += "nd"
    } else if (percentile%10 === 3) {
      percentileString += "rd"
    } else {
      percentileString += "th"
    }
    return percentileString;
  }

  render() {
    return (
      <div className="courseDisplay">
      <h1 className='courseTitle'>{this.props.courseName}</h1>
      {this.props.courseData.TotalCount > 1 ? this.generateDisplayInterior() : this.generateDisplayInteriorEmpty()}
      </div>
    )

  }
}
export default CourseDisplay;
