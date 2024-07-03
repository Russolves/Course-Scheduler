import React, { useState, useEffect } from 'react';
import './Main.css';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

function Main() {
    // define state variables
    const [courseElements, setCourseElements] = useState([0, 1, 2]); // initialize with 3 options
    const [courseSuggestions, setCourseSuggestions] = useState([]);
    const [courseValues, setCourseValues] = useState({});
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    // function to run upon rending of page
    useEffect(() => {
        // call API to receive list of courses available in db
        async function fetch_courses() {
            try {
                const courses_response = await fetch('http://localhost:2000/courses');
                const courses_data = await courses_response.json();
                const courses_reference = courses_data.payload;
                const course_names = courses_reference.map((entry) => entry.course_name);
                setCourseSuggestions(course_names);
            } catch (error) {
                console.log('Something went wrong with calling /courses backend endpoint:', error);
            }
        }
        fetch_courses();
    }, []);

    // button to add autocomplete DOM component
    const addCourse = () => {
        setCourseElements([...courseElements, courseElements.length])
    };
    // handle autocomplete component answers
    const handleAutocompleteChange = (index, event, newValue) => {
        const removeIndex = courseSuggestions.indexOf(newValue);
        courseSuggestions.splice(removeIndex, 1); // remove option after it has been chosen
        setCourseValues((prevValues) => ({
            ...prevValues,
            [index]: newValue,
        }));
    }
    // to optimize suggestions
    const handleInputChange = (event, newInputValue) => {
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
        const ceiling = keysList.length;
        const course = courseValues[index];
        delete courseValues[index];
        courseSuggestions.push(course);
        for (let i = index + 1; i < ceiling; i++) {
            const courseValue = courseValues[i];
            delete courseValues[i];
            courseValues[i - 1] = courseValue
        }
    }
    function showInput() {
        console.log('Print:', courseValues);
        console.log('Course elements:', courseElements);
    }
    return (
        <div className='page'>
            <h1 className='main-title'>BME course scheduler</h1>
            <p>Please enter the courses you would like to take for the following semester</p>
            <div>
                {courseElements.map((element, index) => (
                    <div key={index} className="autocomplete-row">
                        <Autocomplete
                            disablePortal
                            id={`course-box-${index}`}
                            options={filteredSuggestions}
                            getOptionLabel={(option) => (option ? option.toString() : '')} // Use the option string directly as the label
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
                    <Button style={{ marginBlock: '2vh' }} color="primary" onClick={addCourse}>Add Course</Button>
                </div>
            </div>
            <br />
            <Button variant='contained' color="primary" onClick={showInput}>Click Me</Button>
        </div>
    );
}

export default Main;
