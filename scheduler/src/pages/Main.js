import React, { useState, useEffect } from 'react';
import './Main.css';
import EnhancedTable from '../components/EnhancedTable';
import BackdropEdit from '../components/BackdropEdit';
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
import Snackbar from '@mui/material/Snackbar';
import Backdrop from '@mui/material/Backdrop';

// backend uri
const backend_uri = 'http://localhost:2000'
// defining steps for page
const steps = ['Questionnaire', 'Select Courses', 'Scheduler Builder'];

function Main() {
    // define state variables
    const [slideDirection, setSlideDirection] = useState('');
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
    const [playAnimation, setPlayAnimation] = useState(false); // only play animation when next button is pressed
    const [stepPressed, setStepPressed] = useState('');
    const [prereqList, setPrereqList] = useState([]); // for prereqs list after backend has been set
    const [refCourse, setRefCourse] = useState({}); // for converting references back to course names ({reference:course_name})
    const [snackbarStatusGradOr, setSnackbarStatusGradOr] = useState(false); // used for answering whether use input in questionnaire aligns with courses chosen
    const [snackbarStatusSemester, setSnackbarStatusSemester] = useState(false);
    const [tableRows, setTableRows] = useState([]); // ls of objects for table rows
    const [tableColumns, setTableColumns] = useState([
        { id: 'code', label: 'Course code', minWidth: 80 },
        { id: 'name', label: 'Course name', minWidth: 170 },
        { id: 'credits', label: 'Credits', minWidth: 20 },
        { id: 'time', label: 'Time offered', minWidth: 100 },
        { id: 'campus', label: 'Campus offered at', minWidth: 80 },
        { id: 'types', label: 'Schedule types', minWidth: 120 }]); // ls of objects for table columns
    const [chosenLength, setChosenLength] = useState(0); // chosen number of courses
    const [selectedRows, setSelectedRows] = useState([]); // selected rows (passed into Enhanced Table component)
    const [openBackdrop, setOpenBackdrop] = useState(false);
    const [editedList, setEditedList] = useState({}); // pass into child component BackdropEdit.js (also set to this variable when returned)

    // define steps that can be skipped
    const isStepOptional = (step) => {
        return step === 0;
    };
    const isStepSkipped = (step) => {
        return skipped.has(step);
    }
    const handleNext = () => {
        setPlayAnimation(true);
        setStepPressed('0.35s forwards');
        let count = 0;
        Object.values(courseValues).forEach((entry) => (entry !== null) ? count += 1 : null);
        if (activeStep === 0) {
            setSlideDirection('slide-left');
            showQuestion();
        };
        if (activeStep === 1 && count < 3) {
            setShowNullAlert(true);
        } else {
            let newSkipped = skipped;
            if (isStepSkipped(activeStep)) {
                newSkipped = new Set(newSkipped.values());
                newSkipped.delete(activeStep);
            }
            setSlideDirection('slide-left');
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            setSkipped(newSkipped);
            // make async call to backend for fetching all necessary data
            if (activeStep === 1) {
                fetch_data(prereqList); // prereqList is name of courses to be taken in order
            };
        }
        // reset the animation after it has been played
        setTimeout(() => {
            setPlayAnimation(false);
            setSlideDirection(''); // set to empty so that slide-left animation plays
        }, 350);
    }
    // place this async function in try catch
    const fetch_request = async (course_ls) => {
        const payload = { courses: course_ls };
        const response = await fetch(`${backend_uri}/data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return data;
    };
    // async function call to backend to retrieve course data
    const fetch_data = async (prereq_ls) => {
        const chosen_courses = Object.values(courseValues).map((entry, index) => entry);
        setChosenLength(chosen_courses.length);
        const prereqs = prereq_ls.filter((entry) => (!chosen_courses.includes(entry))); // prereqs contains a ls of course names to be taken in order (without chosen_courses)
        // call to backend for courses data
        let chosen_data = [];
        let prereq_data = [];
        try {
            chosen_data = await fetch_request(chosen_courses);
            prereqs.reverse(); // reverse prereq list (to display courses in the right order)
            prereq_data = await fetch_request(prereqs);
        } catch (error) {
            console.log('Error occurred during fetch_data function for retrieving data for courses:', error);
        } finally {
            // construct table
            const chosen_rows = courseLoop(chosen_courses, chosen_data); // for user chosen courses
            const prereq_rows = courseLoop(prereqs, prereq_data);
            setTableRows([...chosen_rows, ...prereq_rows]);
        };
    };
    // for loop function to return createData list
    function courseLoop(courses, data) {
        let rows = []; // initialize rows object
        for (let i = 0; i < courses.length; i++) {
            const course_code = courses[i].slice(0, courses[i].indexOf('-'));
            const course_name = courses[i].slice(courses[i].indexOf(' - ') + ' - '.length);
            const course_data = data.payload[i];
            const course_ref = course_data.reference; // this is required
            let course_credits = course_data.credit_hours || [];
            let course_link = course_data.course_link || '';
            let course_time = course_data.time_offered || [];
            let course_additional = course_data.additional || '';
            let course_campus = course_data.campus || [];
            let course_description = course_data.course_description || '';
            let course_grad = (course_data.grad === undefined) ? undefined : (course_data.grad) ? true : false; // grad boolean value or undefined
            let course_levels = course_data.levels || [];
            let course_refprereq = course_data.prereq_reference || []; // prereqs reference
            let course_prereq = course_data.prereq_courses || []; // prereqs code/name
            let course_types = course_data.schedule_types || [];
            // cleaning course types ls data up
            course_types = course_types.map((entry, index) => entry.replace(/<[^>]*>/g, ''));
            rows.push(createData(course_ref, course_code, course_name, course_credits.join(', '), course_time.join(', '), course_campus.join(', '), course_types.join(', '), course_description, course_grad, course_levels.join(', '), course_prereq));
        };
        return rows;
    };
    // creating rows data
    function createData(reference, code, name, credits, time, campus, types, description, grad, levels, prereq) {
        return {
            reference,
            code,
            name,
            credits,
            time,
            campus,
            types,
            description,
            grad,
            levels,
            prereq
        };
    };
    // for closing backdrop through finish button in child component
    const handleFinishBackdropClose = (close) => {
        if (close) {
            setOpenBackdrop(false);
        };
    };
    // for removing the courses that were marked 'taken' in edit mode
    const courseTaken = (newEdited) => {
        setEditedList(newEdited);
    };
    // for backdrop button
    const handleBackdropClose = () => {
        setOpenBackdrop(false);
    };
    // function to handle selected rows change from child component (enhancedtable.js)
    const handleSelectedRowsChange = (newSelectedRows) => {
        setSelectedRows(newSelectedRows);
    };
    // The edit button for courses (to swap or to delete)
    const handleEdit = () => {
        setOpenBackdrop(true);
    }
    // The back button
    const handleBack = () => {
        setStepPressed('0s forwards');
        setPlayAnimation(true);
        setSlideDirection('slide-right');
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        // reset the animation after it has been played
        setTimeout(() => {
            setPlayAnimation(false);
            setSlideDirection(''); // set to empty so that slide-right animation can be played
        }, 350);
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
        setSlideDirection('slide-right');
        setTimeout(() => {
            setSlideDirection(''); // set to empty so that slide-right animation can be played
        }, 350);
    };
    // This section here controls the containers displayed on screen
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div className="step-content">
                        <p className="explanation">Please fill in the following options</p>
                        <div className="row">
                            <p>Are you an undergraduate or graduate student?</p>
                        </div>
                        <div className="radio-row">
                            <Radio {...controlGradProps('true')} sx={radio_sx} />
                            <span>Graduate</span>
                        </div>
                        <div className="radio-row">
                            <Radio {...controlGradProps('false')} sx={radio_sx} />
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
                        <Button style={{ color: 'white', backgroundColor: 'black', width: '6.0vw' }} variant="contained" onClick={showQuestion}>Submit</Button>                    </div>
                );
            case 1:
                return (
                    <div className="step-content">
                        <p className="explanation">Please enter the courses you would like to take for the following semester</p>
                        {showAlert && (
                            <Alert severity="error">The course {alertText} has already been selected!</Alert>
                        )}
                        {showNullAlert && (
                            <Alert severity="error">Please choose a minimum of at least 3 courses!</Alert>
                        )}
                        <div>
                            <div className="multi-column-container">
                                {courseElements.map((element, index) => (
                                    <div key={index} className="autocomplete-row" style={{ paddingRight: '3rem' }}>
                                        <Autocomplete
                                            disablePortal
                                            id={`course-box-${index}`}
                                            options={filteredSuggestions}
                                            getOptionLabel={(option) => (option ? option.toString() : '')}
                                            sx={{ width: 300, marginTop: 2 }}
                                            value={courseValues[index] || null}
                                            onChange={(event, newValue) => handleAutocompleteChange(index, event, newValue)}
                                            onInputChange={(event, newValue) => handleInputChange(event, newValue)}
                                            renderInput={(params) => <TextField {...params} label={`Enter Course ${index + 1}`} style={{ maxWidth: '18rem' }} />}
                                        />
                                        {index > 2 && (
                                            <IconButton
                                                aria-label="delete"
                                                size="small"
                                                onClick={() => handleDelete(index)}
                                                style={{ marginTop: '1vh' }}
                                            >
                                                <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                                                </svg>
                                            </IconButton>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <Button style={{ marginBlock: '1.0rem', color: 'black' }} color="primary" onClick={addCourse}>Add Course</Button>
                            </div>
                        </div>
                        <Button style={{ margin: '5px', color: 'white', backgroundColor: 'black' }} variant='contained' onClick={showInput}>Click Me</Button>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <p className="explanation">Schedule:</p>
                        <div>
                            <EnhancedTable rows={tableRows} columns={tableColumns} chosen_length={chosenLength} onSelectedRowsChange={handleSelectedRowsChange} courseSelected={selectedRows} />
                        </div>
                        <div>
                            <Backdrop
                                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                                open={openBackdrop}
                                onClick={handleBackdropClose}
                            >
                                <BackdropEdit rows={tableRows} selected={selectedRows} onFinishBackdropClose={handleFinishBackdropClose} onCourseEdit={courseTaken} editedCourseList={editedList} />
                            </Backdrop>
                        </div>
                        {/* <div className="multi-column-container" style={{paddingRight:'10rem'}}>
                            {Object.values(prereqList).map((value, index) => (
                                <p key={index}>{value}</p>
                            ))}
                        </div> */}
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <h2>This program was written by Russell Ho as an open source project</h2>
                    </div>
                );
            default:
                console.log('No activeStep container was called');
                return "Unknown Step\nSomething went wrong in activeSteps";
        }
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
                animation: playAnimation ? `${fillAnimation} ${stepPressed}` : `${fillAnimation} 0s forwards`,
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
            try {
                const data = await update_selection(); // returned in order ls based on initial_suggestion for course order, ref_prereq, course_prereq
                const initial_suggestion = data.payload[0];
                const ref_prereq = data.payload[1];
                const course_prereq = data.payload[2];
                let prereq_ls = [];
                initial_suggestion.forEach((entry) => prereq_ls.push(refCourse[entry]));
                console.log('Initial suggestion:', initial_suggestion);
                console.log('Ref_prereq:', ref_prereq); // prereqs based on references
                console.log('Course_prereq:', course_prereq); // additional supplement if course is -1 for reference
                setPrereqList(prereq_ls); // set prereqList
            } catch (error) {
                console.log('Something went wrong during the initial_prereq async function call for reflecting user course changes:', error);
            }
        };
        // checking if input reaches at least 3 courses before outputing prereqs
        let count = 0;
        Object.values(courseValues).forEach((entry) => (entry !== null) ? count += 1 : null);
        if (count >= 3) {
            initial_prereq(); // call async function only when count >= 3
            setSelectedRows([]); // clear selected rows if courses have changed
        };
    }, [JSON.stringify(courseValues)])
    // everytime selected value changes
    useEffect(() => {
        // upon initialization use selected course ref as key and make selectedIndex first entry on ls for value
        for (let key in editedList) {
            if (!selectedRows.includes(key)) {
                delete editedList[key];
            }
        };
        let initial_index = 0;
        for (let ref of selectedRows) {
            if (!Object.keys(editedList).includes(ref)) {
                editedList[ref] = [-1, { taken: false }];
            };
            editedList[ref][0] = initial_index;
            initial_index += 1;
        };
    }, [selectedRows]);
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
    // snackbar close
    const handleBothClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarStatusGradOr(false);
        setSnackbarStatusSemester(false);
    };
    // controlling snackbar open
    const bothSnackbarStatus = snackbarStatusGradOr || snackbarStatusSemester;
    // to optimize suggestions and handle snackbar
    const handleInputChange = async (event, newInputValue) => {
        setShowAlert(false);
        setShowNullAlert(false);
        try {
            // check for whether user input in questionnaire aligns with courses chosen
            if (courseSuggestions.includes(newInputValue)) {
                let packet = { newCourse: newInputValue };
                const response = await fetch(`${backend_uri}/check`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(packet)
                });
                const data = await response.json();
                if (data.payload.gradOr === false) setSnackbarStatusGradOr(true);
                if (data.payload.semesterOr === false) setSnackbarStatusSemester(true);
            };
            // if null course_names exist within db make sure suggestion filters them out
            const filtered = courseSuggestions.filter((suggestion) =>
                suggestion && suggestion.toLowerCase().includes(newInputValue.toLowerCase()) // filter based on user input
            ).slice(0, 15); // limit number of suggestions
            setFilteredSuggestions(filtered);
        } catch (error) {
            console.log('Error in handleInputChange, could be /check API endpoint error:', error);
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
            <div className={`step-container ${slideDirection}`}>
                {getStepContent(activeStep)}
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
                        {activeStep === 2 && (
                            <Button style={{ color: "black", borderColor: "black" }} variant="outlined" onClick={handleEdit} sx={{ mr: 1 }}>
                                Edit
                            </Button>
                        )}
                        <Button style={{ color: "white", backgroundColor: "rgb(190, 153, 50)" }} onClick={handleNext} variant="contained">
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                    </Box>
                </React.Fragment>
            )}
            <Snackbar open={bothSnackbarStatus} autoHideDuration={6000} onClose={handleBothClose}>
                <Alert
                    onClose={handleBothClose}
                    severity="warning"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    <div>
                        {snackbarStatusGradOr &&
                            (gradOr === 'false'
                                ? "As an undergrad you might want to check before taking a grad class"
                                : "As a grad student you might want to check before taking an undergrad class"
                            )
                        }
                        {snackbarStatusGradOr && snackbarStatusSemester && (<br />)}
                        {snackbarStatusSemester &&
                            `Course chosen is not being offered for ${semester} semester`
                        }
                    </div>
                </Alert>
            </Snackbar>
        </div>
    );
}

export default Main;
