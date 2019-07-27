import React, { Component } from 'react';
import CourseDisplay from "./CourseDisplay"

class CourseDisplayWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      courseDisplays:[]
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.displayData !== this.props.displayData) {

      const courseDisplays = Object.keys(this.props.displayData).map((courseName, i) => {
        return <CourseDisplay
        courseName={courseName}
        courseData={this.props.displayData[courseName]}
        originCourse={this.props.originCourse}
        key = {i}
        />;
      });

      this.setState({
        courseDisplays:courseDisplays
      });


    }
  }

  generateCourseDisplayWrapper() {
    return (
      <div className = "courseDisplayWrapper">
        {this.state.courseDisplays}
      </div>
    );
  }

  generateCourseDisplayWrapperEmpty() {
    return (
      <div className ="courseDisplayWrapperEmpty">
        <h3> The Course Selector for Skyline High School's Math Department </h3>
        <p className="emptyBodyText"> Well, its not quite there yet. Right now, this application is running on a randomly generated set of test data - 1500 simulated students, each of whom took 3-4 math courses over the course of 4 years, all of whom scored between 50-100% on all assignments, for all categories. This data isn't particularily interesting right now - in fact, nearly every category mean will fall incredibly close to 75%, simply due to the way our students were generated. Likewise, it is currently easiest to find matches for a mock student whose grades for all categories are near or equal to 75%. Currently, this application only has its technology, without any of the data - a demo for what's to come.</p>

        <h3> So How Does It Work? </h3>
        <p className="emptyBodyText"> The Course Selector for Skyline High School's Math Department attempts to predict student performance in future classes based on the performance of previous students who performed similarly in the same classes as them. For example, to predict the performance of a student who took Geometry in 9th Grade and is looking to take Algebra II in 10th grade, we would simply look at all records of previous students who had taken Geometry in 9th grade and Algebra II in 10th grade, we would find similar students in the past who had taken Algebra II the year directly after taking Geometry. To determine which students are "similar" to the inquiring student, we check how similar their Algebra II Semester 1 grades were to those of the inquirer. Currently, two students are considered similar if their Semester 1 grades are within 5% of each other, and if their grades in all sub-categories (Homework, Tests, Quizzes) are within 25% of each other. These numbers were tuned to fit our generated set of data, and will likely be changed in the future to accomodate our incoming dataset.</p>

        <h3> Alright. How Do I Use It? </h3>
        <p className="emptyBodyText"> This application is fairly intuitive. Simply select your course from our selection of (currently) mock data from the box in the top left, and input your grades for each (currently) mock category into the text boxes which pop up. Hit "Find Options" and get ready to see some (currently) useless information!</p>


      </div>
    );
  }

  generateLoadingDisplay() {
    return (
      <div className ="loadingDisplay">
        <p> Loading... </p>
      </div>
    );
  }

  generateConditionalBody() {
    if (this.props.apiRequestPending) {
      return this.generateLoadingDisplay();
    } else if (this.state.courseDisplays === undefined || this.state.courseDisplays.length === 0) {
      return this.generateCourseDisplayWrapperEmpty();
    } else {
      return this.generateCourseDisplayWrapper();
    }

  }
  render() {
    return this.generateConditionalBody();
  }
}
export default CourseDisplayWrapper;
