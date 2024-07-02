import React, { useState, useEffect } from 'react';
import './Main.css';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';

function Main() {
    let suggestions = [
        'ECE 46900 - Operating Systems Engineering',
        'ECE 57300 - Embedded Systems',
        'ECE 30200 - Probabilistic Methods',
        'ECE 30100 - Signals and Systems',
        'ECE 10100 - Intro to ECE',
        'ECE 12300 - Test for ECE'
    ]
    const [selectedCourse, setSelectedCourse] = useState('');
    const handleChange = (event, newValue) => {
        setSelectedCourse(newValue);
    }
    function showInput() {
        console.log('Print:', selectedCourse);
    }
    function addCourse() {
        return (
            <p>This element</p>
        )
    }
    return (
        <div className='page'>
            <h1 className='main-title'>BME course scheduler</h1>
            <p>Please enter the courses you would like to take for the following semester</p>
            <div>
                <Autocomplete
                    disablePortal
                    id="combo-box-demo"
                    options={suggestions}
                    sx={{ width: 300 }}
                    value={selectedCourse}
                    onChange={handleChange}
                    renderInput={(params) => <TextField {...params} label="Enter Course" />}
                />
                <Button color="primary" onClick={addCourse}>Add Course</Button>
            </div>
            <br />
            <Button variant='contained' color="primary" onClick={showInput}>Click Me</Button>
        </div>
    );
}

export default Main;
