import React, { Component } from 'react';
import './App.css';
import Header from "./Header";
import CourseSelectionBar from "./CourseSelectionBar";
import CourseDisplayWrapper from "./CourseDisplayWrapper";
import Footer from "./Footer";
import axios from "axios";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allCourses: {},
      displayData: {},
      originCourse: null,
      apiRequestPending: false
    };
    this.getDataFromAPI = this.getDataFromAPI.bind(this);
    this.setParentOriginCourse = this.setParentOriginCourse.bind(this);
    this.getStartingDataRecursively = this.getStartingDataRecursively.bind(this);
  }
  componentDidMount() {
    this.getStartingDataRecursively();
  }

  getStartingDataRecursively() {
    // testing: http://localhost:8000/api/selection/
    // production: http://shs-class-selection.herokuapp.com/api/selection/
    axios
    .get("http://shs-class-selection.herokuapp.com/api/selection/",
    { headers: {"instructions": "get-classes-on-load"}})
    .then(res => this.setState(prevState => {
      prevState.allCourses = res.data;
      return prevState;
    }))
    .catch(err => {
      setTimeout(this.getStartingDataRecursively, 3000);
    });
  }

  getDataFromAPI(requestKeys, jsonRequestString){
    this.setState(prevState => {
      prevState.apiRequestPending=true;
      return prevState;
    });
    let timer = setTimeout(
        function() {
          if (this.state.apiRequestPending) {
            this.setState(prevState => {
              prevState.apiRequestPending=false;
              prevState.displayData = {};
              this.refs.courseSelectionBarRef.generateServerTimeout();

              return prevState;
            });
          }
        }
        .bind(this),
        10000
    );

    axios
    .get("http://shs-class-selection.herokuapp.com/api/selection/",
    { headers: {"instructions": "get-pair-data", "keys":requestKeys, "grades":jsonRequestString}})
    .then(res => {
      clearTimeout(timer);
      this.setState(prevState => {
        prevState.displayData = res.data;
        prevState.apiRequestPending=false;
        return prevState;
      })
      console.log(res.data);
    })
    .catch(err => console.log(err));
  }

  setParentOriginCourse(originCourse) {
    this.setState(prevState => {
      prevState.originCourse = originCourse;
      return prevState;
    });
  }

  render() {
    return (
      <div className="App">
        <Header />
        <CourseSelectionBar
        ref={"courseSelectionBarRef"}
        all_courses={this.state.allCourses}
        getDataFromAPI={this.getDataFromAPI}
        setParentOriginCourse={this.setParentOriginCourse}
        apiRequestPending={this.state.apiRequestPending}
        />
        <CourseDisplayWrapper
        originCourse={this.state.originCourse}
        displayData={this.state.displayData}
        apiRequestPending={this.state.apiRequestPending}
        />
        <Footer />
      </div>
    );
  }
}
export default App;
