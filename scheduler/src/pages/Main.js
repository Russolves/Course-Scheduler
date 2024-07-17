import React, { useState, useEffect } from 'react';
import './Main.css';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import { keyframes } from '@mui/system';

// backend uri
const backend_uri = 'http://localhost:2000'
// defining steps for page
const steps = ['Questionnaire', 'Select Courses', 'Scheduler Builder'];

function Main() {
    // define state variables
    const [courseElements, setCourseElements] = useState([0, 1, 2]); // initialize with 3 options
    const [courseSuggestions, setCourseSuggestions] = useState([]);
    const [courseValues, setCourseValues] = useState({});
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [alertText, setAlertText] = useState('');
    const [showNullAlert, setShowNullAlert] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [skipped, setSkipped] = useState(new Set());
    const [gradOr, setGradOr] = useState(''); // empty string ('grad' for graduate, 'undergraduate' ...)
    const [semester, setSemester] = useState('') // empty string ('spring', 'fall', 'summer'...)
    const [animationClass, setAnimationClass] = useState(['slide-in', 'slide-o', 'slide-back']); // for animating the sliding window between steps
    const [stepPressed, setStepPressed] = useState('');
    const [prereqList, setPrereqList] = useState([]); // for prereqs list after backend has been set
    const [refCourse, setRefCourse] = useState({}); // for converting references back to course names ({reference:course_name})

    // define steps that can be skipped
    const isStepOptional = (step) => {
        return step === 0;
    };
    const isStepSkipped = (step) => {
        return skipped.has(step);
    }
    const handleNext = () => {
        setStepPressed('0.35s forwards');
        // setAnimationClass('slide-left');
        // setTimeout(() => {
        //     setActiveStep((prevActiveStep) => prevActiveStep + 1);
        //     setAnimationClass('slide-right');
        // }, 300); // adjust timeout to match duration of slide-out animation
        let count = 0;
        Object.values(courseValues).forEach((entry) => (entry !== null) ? count += 1 : null);
        if (activeStep === 0) {
            showQuestion();
        };
        if (activeStep === 1 && count < 3) { // to ensure at least 3 courses have been chosen before moving on
            setShowNullAlert(true);
        } else {
            let newSkipped = skipped;
            if (isStepSkipped(activeStep)) {
                newSkipped = new Set(newSkipped.values());
                newSkipped.delete(activeStep); // 
            }
            animationClass[activeStep] = 'slide-out';
            if (activeStep + 1 < steps.length) animationClass[activeStep + 1] = 'slide-in';
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            setSkipped(newSkipped);
        }
    }
    const handleBack = () => {
        setStepPressed('0s forwards');
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        (activeStep === 1) ? animationClass[activeStep] = 'slide-o' : animationClass[activeStep] = 'slide-back';
        if (activeStep - 1 >= 0) animationClass[activeStep - 1] = 'slide-in';
    };
    const handleSkip = () => {
        if (!isStepOptional(activeStep)) {
            // You probably want to guard against something like this,
            // it should never occur unless someone's actively trying to break something.
            throw new Error("You can't skip a step that isn't optional.");
        }
        animationClass[activeStep] = 'slide-out';
        if (activeStep + 1 < steps.length) animationClass[activeStep + 1] = 'slide-in';
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped((prevSkipped) => {
            const newSkipped = new Set(prevSkipped.values());
            newSkipped.add(activeStep);
            return newSkipped;
        });
    };
    const handleReset = () => { // to reset progress of stepper
        setActiveStep(0);
    };
    // stepper styles
    const connectorColor = '#D4A017';
    const iconColor = '#000000'
    // Define the keyframes for the fill animation
    const fillAnimation = keyframes`
        0% {
        width: 0%; /* Start with no fill */
        border-color: #eaeaf0; /* Inactive color */
        }
        100% {
        width: 100%; /* Fully filled */
        border-color: ${connectorColor}; /* Active color */
        }
    `;
    const CustomConnector = styled(StepConnector)(({ theme }) => ({
        [`&.${stepConnectorClasses.alternativeLabel}`]: {
            top: 10,
        },
        [`&.${stepConnectorClasses.active}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                animation: `${fillAnimation} ${stepPressed}`,
            },
        },
        [`&.${stepConnectorClasses.completed}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                animation: `${fillAnimation} 0s forwards`,
            },
        },
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
            borderTopWidth: 3,
            borderRadius: 1,
            width: '100%', // Ensure the initial state is full width
        },
    }));
    const CustomStepIconRoot = styled('div')(({ theme, ownerState }) => ({
        color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
        display: 'flex',
        height: 22,
        alignItems: 'center',
        ...(ownerState.active && {
            color: iconColor, // Active icon color
        }),
        '& .CustomStepIcon-completedIcon': {
            color: iconColor, // Completed icon color
            zIndex: 1,
            fontSize: 18,
        },
        '& .CustomStepIcon-circle': {
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
        },
    }));
    function CustomStepIcon(props) {
        const { active, completed, className } = props;

        return (
            <CustomStepIconRoot ownerState={{ active }} className={className}>
                {completed ? (
                    <CheckCircleIcon style={{ width: '0.9rem', height: '0.9rem' }} className="CustomStepIcon-completedIcon" />
                ) : (
                    <div className="CustomStepIcon-circle" />
                )}
            </CustomStepIconRoot>
        );
    }
    CustomStepIcon.propTypes = {
        active: PropTypes.bool,
        className: PropTypes.string,
        completed: PropTypes.bool,
    };
    // function to run upon rending of page
    useEffect(() => {
        // call API to receive list of courses available in db
        async function fetch_courses() {
            try {
                const courses_response = await fetch(`${backend_uri}/courses`);
                const courses_data = await courses_response.json();
                const courses_reference = courses_data.payload[0];
                const ref_course = courses_data.payload[1];
                for (let key in ref_course) {
                    refCourse[key] = ref_course[key];
                };
                const course_names = courses_reference.map((entry) => entry.course_name);
                setCourseSuggestions(course_names);
            } catch (error) {
                console.log('Something went wrong with calling /courses backend endpoint:', error);
            }
        }
        fetch_courses();
    }, []);
    // everytime courseValues changes
    useEffect(() => {
        async function update_selection() {
            try {
                const response = await fetch(`${backend_uri}/selection`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(courseValues)
                })
                const data = await response.json(); // data.message contains the status of the message
                return data;
            } catch (error) {
                console.log('Something went wrong during the updating of useEffect update_selection:', error);
            }
        };
        async function initial_prereq() {
            const data = await update_selection(); // returned in order ls based on initial_suggestion for course order, ref_prereq, course_prereq
            const initial_suggestion = data.payload[0];
            const ref_prereq = data.payload[1];
            const course_prereq = data.payload[2];
            let prereq_ls = [];
            initial_suggestion.forEach((entry) => prereq_ls.push(refCourse[entry]));
            console.log('Initial suggestion:', initial_suggestion);
            console.log('Ref_prereq:', ref_prereq);
            console.log('Course_prereq:', course_prereq);
            setPrereqList(prereq_ls); // set prereqList
        };
        let count = 0;
        Object.values(courseValues).forEach((entry) => (entry !== null) ? count += 1 : null);
        if (count >= 3) {
            initial_prereq(); // call async function only when count >= 3
        };
    }, [JSON.stringify(courseValues)])
    // selected values
    const handlegradChange = (event) => {
        setGradOr(event.target.value); // empty string
    };
    const radio_sx = { color: '#999999', '&.Mui-checked': { color: '#fbc02d' } };
    // for controlling radio style
    const controlGradProps = (item) => ({
        checked: gradOr === item,
        onChange: handlegradChange, // selected value
        value: item,
        name: 'grad-radio-button',
        inputProps: { 'aria-label': item }
    });
    // which semester
    const handlesemesterChange = (event) => {
        setSemester(event.target.value);
    };
    const controlSemesterProps = (item) => ({
        checked: semester === item,
        onChange: handlesemesterChange,
        value: item,
        name: 'semester-radio-button',
        inputProps: { 'aria-label': item }
    });
    const showQuestion = async () => {
        let output = {};
        output.gradOr = gradOr;
        output.semesterOr = semester;
        try {
            const response = await fetch(`${backend_uri}/questionnaire`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(output)
            });
            const data = await response.json();
            console.log('This is the data:', data);
        } catch (error) {
            console.log('Encountered error during showQuestion function for call to /questionnaire API endpoint');
        }
    };
    // button to add autocomplete DOM component
    const addCourse = () => {
        setCourseElements([...courseElements, courseElements.length])
    };
    // handle autocomplete component answers
    const handleAutocompleteChange = (index, event, newValue) => {
        if (newValue == null) {
            let courseSuggestions_ls = courseSuggestions;
            courseSuggestions_ls.push(courseValues[index]);
            const courseSuggestions_set = new Set(courseSuggestions_ls);
            courseSuggestions_ls = Array.from(courseSuggestions_set);
            courseSuggestions_ls.sort();
            setCourseSuggestions(courseSuggestions_ls);
        } else if (newValue != null) {
            const removeIndex = courseSuggestions.indexOf(newValue);
            courseSuggestions.splice(removeIndex, 1); // remove option after it has been chosen
            setCourseSuggestions(courseSuggestions);
        }
        if (newValue != null && Object.values(courseValues).includes(newValue)) {
            setShowAlert(true);
            setAlertText(newValue.slice(0, newValue.indexOf(' -')));
            return; // do not push already chosen course
        }
        setCourseValues((prevValues) => ({
            ...prevValues,
            [index]: newValue,
        }));
    }
    // to optimize suggestions
    const handleInputChange = (event, newInputValue) => {
        setStepPressed('0s forwards');
        setShowAlert(false);
        setShowNullAlert(false);
        try {
            // if null course_names exist within db make sure suggestion filters them out
            const filtered = courseSuggestions.filter((suggestion) =>
                suggestion && suggestion.toLowerCase().includes(newInputValue.toLowerCase())
            ).slice(0, 15); // limit number of suggestions
            setFilteredSuggestions(filtered);
        } catch (error) {
            console.log('Error in handleInputChange:', error);
        }
    }
    // for deletion
    const handleDelete = (index) => {
        setCourseElements(courseElements.filter((_, i) => i !== index));
        const keysList = Object.keys(courseValues);
        const course = courseValues[index];
        delete courseValues[index];
        if (course != null) courseSuggestions.push(course);
        let i = 3;
        for (let j = 0; j < keysList.length; j++) {
            if (parseInt(keysList[j]) >= 3) {
                const courseValue = courseValues[keysList[j]];
                delete courseValues[keysList[j]];
                (courseValue !== undefined) ? courseValues[i] = courseValue : i--;
                i++;
            }
        }
        setCourseValues(courseValues);
    }
    async function showInput() {
        const output = Object.values(courseValues);
        let count = 0;
        for (let i = 0; i < output.length; i++) {
            if (output[i] != null) {
                count += 1;
            }
        };
        if (count < 3) {
            setShowNullAlert(true);
        } else {
            console.log('Print:', courseValues);
            console.log('Course elements:', courseElements);
            try {
                const response = await fetch(`${backend_uri}/selection`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(courseValues)
                });
                const data = await response.json();
                console.log('/selection API call result:', data);
            } catch (error) {
                console.log('Encountered error during calling of /selection API endpoint for selected courses');
            }
        };
    }
    return (
        <div className='page'>
            <Box width="75vw">
                <Stepper activeStep={activeStep} connector={<CustomConnector />}>
                    {steps.map((label, index) => {
                        const stepProps = {};
                        const labelProps = {};
                        if (isStepOptional(index)) {
                            labelProps.optional = (
                                <Box display="flex" flexDirection="column" alignItems="flex-start" mt={-1}>
                                    <Typography style={{ fontSize: '0.6rem', marginTop: '0.5rem' }} variant="caption">Optional</Typography>
                                </Box>
                            );
                        }
                        if (isStepSkipped(index)) {
                            stepProps.completed = false;
                        }
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps} StepIconComponent={CustomStepIcon}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
            </Box>
            <h1 className='main-title' style={{ display: 'flex', justifyContent: 'center' }}>BME course scheduler</h1>
            <div className={`step-container`}>
                {/* all in the same row */}
                <Stack className='step-container' direction="row">
                    {/* first step */}
                    <div className={`first-step-container ${animationClass[0]}`}>
                        <div>
                            <p className="explanation">Please fill in the following options</p>
                        </div>
                        <div className="row">
                            <p>Are you an undergraduate or graduate student?</p>
                        </div>
                        <div className="radio-row">
                            <Radio {...controlGradProps('grad')} sx={radio_sx} />
                            <span>Graduate</span>
                        </div>
                        <div className="radio-row">
                            <Radio {...controlGradProps('undergrad')} sx={radio_sx} />
                            <span>Undergraduate</span>
                        </div>
                        <div className="row">
                            <p>Which semester?</p>
                        </div>
                        <div className="radio-row">
                            <Radio {...controlSemesterProps('fall')} sx={radio_sx} />
                            <span>Fall</span>
                        </div>
                        <div className="radio-row">
                            <Radio {...controlSemesterProps('spring')} sx={radio_sx} />
                            <span>Spring</span>
                        </div>
                        <div className="radio-row">
                            <Radio {...controlSemesterProps('summer')} sx={radio_sx} />
                            <span>Summer</span>
                        </div>
                        <Button style={{ color: 'white', backgroundColor: 'black', width: '6.0vw' }} variant="contained" onClick={showQuestion}>Submit</Button>
                    </div>
                    {/* second step */}
                    <div className={`second-step-container ${animationClass[1]}`}>
                        <div>
                            <p className="explanation">Please enter the courses you would like to take for the following semester</p>
                            {showAlert && (
                                <Alert severity="error">The course {alertText} has already been selected!</Alert>
                            )}
                            {showNullAlert && (
                                <Alert severity="error">Please choose a minimum of at least 3 courses!</Alert>
                            )}
                            <div>
                                {courseElements.map((element, index) => (
                                    <div key={index} className="autocomplete-row">
                                        <Autocomplete
                                            disablePortal
                                            id={`course-box-${index}`}
                                            options={filteredSuggestions}
                                            getOptionLabel={(option) => (option ? option.toString() : '')}
                                            sx={{ width: 300, marginTop: 2 }}
                                            value={courseValues[index] || null}
                                            onChange={(event, newValue) => handleAutocompleteChange(index, event, newValue)}
                                            onInputChange={(event, newValue) => handleInputChange(event, newValue)}
                                            renderInput={(params) => <TextField {...params} label={`Enter Course ${index + 1}`} style={{ width: '25vw' }} />}
                                        />
                                        {index > 2 && (
                                            <IconButton
                                                aria-label="delete"
                                                size="small"
                                                onClick={() => handleDelete(index)}
                                                style={{ marginTop: '2vh' }}
                                            >
                                                <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                                                </svg>
                                            </IconButton>
                                        )}
                                    </div>
                                ))}
                                <div>
                                    <Button style={{ marginBlock: '2vh', color: 'black' }} color="primary" onClick={addCourse}>Add Course</Button>
                                </div>
                            </div>
                            <Button style={{ margin: '5px', color: 'white', backgroundColor: 'black' }} variant='contained' onClick={showInput}>Click Me</Button>
                        </div>
                    </div>
                    {/* third step */}
                    <div className={`third-step-container ${animationClass[2]}`}>
                        <p className="explanation">Schedule:</p>
                        {Object.values(prereqList).map((value, index) => (
                            <p key={index}>{value}</p>
                        ))}

                    </div>
                </Stack>
            </div>
            {activeStep === steps.length ? (
                <React.Fragment>
                    <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                        <Box sx={{ flex: '1 1 auto' }} />
                        <Button onClick={handleReset}>Reset</Button>
                    </Box>
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                        <Button
                            color="inherit"
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            sx={{ mr: 1 }}
                        >
                            Back
                        </Button>
                        <Box sx={{ flex: '1 1 auto' }} />
                        {isStepOptional(activeStep) && (
                            <Button style={{ color: "black", borderColor: "black" }} variant="outlined" onClick={handleSkip} sx={{ mr: 1 }}>
                                Skip
                            </Button>
                        )}
                        <Button style={{ color: "white", backgroundColor: "rgb(190, 153, 50)" }} onClick={handleNext} variant="contained">
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                    </Box>
                </React.Fragment>
            )}
        </div>
    );
}

export default Main;
