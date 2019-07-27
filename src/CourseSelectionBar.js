import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import Select from "react-select";
import Button from '@material-ui/core/Button';

class CourseSelectionBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedCourse:null,
      courseSuccessors:{},
      courseS1CatNames:{},
      apiRequestPending:props.apiRequestPending,
      projectedWait:0,
      shouldDisplayWaiting: false
    }

    this.getDataFromAPI = props.getDataFromAPI;
    this.setParentOriginCourse = props.setParentOriginCourse;
    this.lastSubmitted = null;
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.updateFormValues = this.updateFormValues.bind(this);
    this.formValues = {};
    this.inputKeys = {"Total":Math.random()};
    setTimeout(function() {
      this.setState(prevState => {
        prevState.shouldDisplayWaiting = true;
        return prevState;
      });
    }.bind(this), 2000);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.all_courses !== this.props.all_courses) {
      this.setState(prevState => {
        this.props.all_courses.forEach(course=>{
          prevState.courseSuccessors[course.name] = JSON.parse(course.successors);
          prevState.courseS1CatNames[course.name] = JSON.parse(course.s1_cat_names);
        });
        return prevState;
      });
    }
  }

  handleChange(fieldLabel) {
    let fieldVal = fieldLabel.value;
    if (fieldVal in this.state.courseSuccessors) {
      this.setState(prevState => {
        prevState.selectedCourse = fieldVal;
        this.formValues = {};
        this.inputKeys = {"Total":Math.random()};
        this.state.courseS1CatNames[prevState.selectedCourse].forEach(fieldName => {
          this.inputKeys[fieldName] = Math.random();
        });

        return prevState;
      });
    }
  }

  isNSecondsApart(startDate, endDate, seconds) {
    return startDate == null ? true : (endDate.getTime() - startDate.getTime()) / 1000 > seconds;
  }

  onSubmit(event) {
    event.preventDefault();
    let jsonRequest = {};
    let isValidInput = true;
    let willWarn = false;


    for (let fieldName of Object.keys(this.formValues)) {
      let grade = this.formValues[fieldName];
      if (isNaN(grade)) {
        isValidInput = false;
        break;
      } else {
        let num = parseFloat(grade)/100;
        if (num < 0 || num > 1) {
          isValidInput = false;
          break;
        }
        if (num <= 0.01) {
          willWarn = true;
        }
        jsonRequest[fieldName] = num;
      }
    }

    if (Object.keys(this.formValues).length !== this.state.courseS1CatNames[this.state.selectedCourse].length + 1) {
      isValidInput = false;
    }

    let notRapid = this.isNSecondsApart(this.lastSubmitted, new Date(), 5);
    if (isValidInput && notRapid && !this.apiRequestPending) {
      if (willWarn) {
        this.generateWarning();
      } else {
        this.removeWarningsOrErrors();
      }
      this.lastSubmitted = new Date();
      this.setParentOriginCourse(this.state.selectedCourse);
      let requestKeys = []
      for (let child of this.state.courseSuccessors[this.state.selectedCourse]) {
        requestKeys.push(this.state.selectedCourse + "=>" + child);
      }
      this.getDataFromAPI(JSON.stringify(requestKeys), JSON.stringify(jsonRequest));
    } else if (notRapid) {
      this.generateError();
    } else {
      this.setState(prevState => {
        prevState.projectedWait = (5 - ((new Date().getTime() - this.lastSubmitted.getTime()) / 1000));
        return prevState;
      });
      this.generateTimeout();
    }
  }

  updateFormValues(event) {
    this.formValues[event.target.name] = event.target.value;
  }

  getCourseGradesForm() {
    let inputs = [];
    this.state.courseS1CatNames[this.state.selectedCourse].forEach((catName, i)=>{
      inputs.push(<span className='inputGrade' key={this.inputKeys[catName]}><p className="courseLabel">{catName}:&nbsp;</p><TextField type='number' step='any' autoComplete='off' placeholder='Grade %' className='gradeDiv'name={catName} onChange={this.updateFormValues}/></span>);
    })
    return (
      <div ref='formDiv'>
        {inputs}
        <span className='inputGrade' id='totalField' key={this.inputKeys['Total']}><p className="courseLabel">TOTAL:&nbsp;</p><TextField type='number' step='any' autoComplete='off' placeholder='Grade %' className='gradeDiv' name='Total' onChange={this.updateFormValues}/></span>
        <span className='submitGrade'> <Button variant="contained" color="primary" onClick={this.onSubmit}> Find Options </Button> </span>
      </div>
    );
  }

  generateWarning() {
    var warning = this.refs.warningBar;
    var error = this.refs.errorBar;
    var timeout = this.refs.timeoutBar;
    var serverTimeout = this.refs.serverTimeoutBar;
    error.classList.add('invisible');
    warning.classList.remove('invisible');
    timeout.classList.add('invisible');
    serverTimeout.classList.add('invisible');
  }

  generateError() {
    var warning = this.refs.warningBar;
    var error = this.refs.errorBar;
    var timeout = this.refs.timeoutBar;
    var serverTimeout = this.refs.serverTimeoutBar;
    error.classList.remove('invisible');
    warning.classList.add('invisible');
    timeout.classList.add('invisible');
    serverTimeout.classList.add('invisible');
  }

  generateTimeout() {
    var warning = this.refs.warningBar;
    var error = this.refs.errorBar;
    var timeout = this.refs.timeoutBar;
    var serverTimeout = this.refs.serverTimeoutBar;
    error.classList.add('invisible');
    warning.classList.add('invisible');
    timeout.classList.remove('invisible');
    serverTimeout.classList.add('invisible');
  }

  removeWarningsOrErrors() {
    var warning = this.refs.warningBar;
    var error = this.refs.errorBar;
    var timeout = this.refs.timeoutBar;
    var serverTimeout = this.refs.serverTimeoutBar;
    error.classList.add('invisible');
    warning.classList.add('invisible');
    timeout.classList.add('invisible');
    serverTimeout.classList.add('invisible');
  }

  generateServerTimeout() {
    var warning = this.refs.warningBar;
    var error = this.refs.errorBar;
    var timeout = this.refs.timeoutBar;
    var serverTimeout = this.refs.serverTimeoutBar;
    error.classList.add('invisible');
    warning.classList.add('invisible');
    timeout.classList.add('invisible');
    serverTimeout.classList.remove('invisible');
  }

  generateNoServerResponseDisplay() {
    return (
      <span className="noServerResponse">
        <p> Waiting for server... </p>
      </span>
    );
  }
  render() {
    let courseOptions = [];
    Object.keys(this.state.courseSuccessors).forEach(courseName=>{
      if (this.state.courseSuccessors[courseName].length > 0) courseOptions.push({'label':courseName, 'value':courseName});
    });
    return (
      <div>
        <div className='courseBarContainer'>
          <span className='inputCourse'>
            <Select
            onChange={this.handleChange}
            placeholder='Select Course'
            options = {courseOptions}
            menuPortalTarget={document.body}
            />
          </span>
          {(Object.keys(this.state.courseSuccessors).length === 0 && this.state.shouldDisplayWaiting) && this.generateNoServerResponseDisplay()}
          {this.state.selectedCourse != null && this.getCourseGradesForm()}
        </div>
        <div ref='warningBar' className='warningBar invisible'>
          <p> Warning: One or more of the submitted fields contains a value which is less or equal to 1. Please ensure that you are inputting percents rather than proportions.</p>
        </div>
        <div ref='errorBar' className='errorBar invisible'>
          <p> Invalid Input: One or more of the submitted fields is empty or contains a value which is not a number between 1 and 100.</p>
        </div>
        <div ref='timeoutBar' className='timeoutBar invisible'>
          <p> Please wait {this.state.projectedWait.toFixed(2)} more seconds to submit.</p>
        </div>
        <div ref='serverTimeoutBar' className='serverTimeoutBar invisible'>
          <p> Error: Server failed to respond.</p>
        </div>
      </div>
    );
  }
}
export default CourseSelectionBar;
