import React, { useState, useEffect } from 'react';
import './Main.css';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

function Main() {
    let suggestions = [
        'ECE 46900 - Operating Systems Engineering',
        'ECE 57300 - Embedded Systems',
        'ECE 30200 - Probabilistic Methods',
        'ECE 30100 - Signals and Systems',
        'ECE 10100 - Intro to ECE',
        'ECE 12300 - Test for ECE'
    ]
    suggestions.sort();
    // define state variables
    const [courseElements, setCourseElements] = useState([0, 1, 2]); // initialize with 3 options
    const [courseSuggestions, setCourseSuggestions] = useState(suggestions);
    const [courseValues, setCourseValues] = useState({});
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
                            options={courseSuggestions}
                            sx={{ width: 300, marginTop: 2 }}
                            value={courseValues[index] || null}
                            onChange={(event, newValue) => handleAutocompleteChange(index, event, newValue)}
                            renderInput={(params) => <TextField {...params} label={`Enter Course ${index + 1}`}
                                style={{ width: '25vw' }} />}
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
