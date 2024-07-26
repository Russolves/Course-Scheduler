import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CheckIcon from '@mui/icons-material/Check';

export default function BackdropEdit({ rows, selected, onFinishBackdropClose }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [courseData, setCourseData] = useState({});
    const [courseName, setCourseName] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseCredits, setCourseCredits] = useState('');
    const [courseTime, setCourseTime] = useState('');
    const [courseCampus, setCourseCampus] = useState('');
    const [courseTypes, setCourseTypes] = useState('');
    const [courseGrad, setCourseGrad] = useState('');
    const [coursePrereqs, setCoursePrereqs] = useState([]); // course prerequisites in code/name
    const [selectedDone, setSelectedDone] = useState(false); // to see if selected edit has reached last element
    const [editedList, setEditedList] = useState([]); // ls of {} for each selected course
    const [takenCourse, setTakenCourse] = useState(false); // for showing checkmark for taken this course

    // initialize first course on selected list
    useEffect(() => {
        const initialCourse = findCourse(0);
        setCourseData(initialCourse);
        setCourseName(`${initialCourse.code} - ${initialCourse.name}`);
        if (selected.length === 1) setSelectedDone(true);
        selected.forEach((course) => editedList.push({taken: false})); // upon initialization push number of {} equal to number of selected courses into edited
    }, [rows, selected]);
    // for reading in edited data
    useEffect(() => {
        const current_edit = editedList[selectedIndex];
        setTakenCourse(current_edit.taken);
    }, [selectedIndex]);
    // function to find course data within rows ls of objects
    function findCourse(index) {
        let course_interest = {};
        for (let course of rows) {
            if (parseInt(course.reference) === parseInt(selected[index])) {
                course_interest = course;
                break; // stop searching once target course is found
            }
        };
        setCoursePrereqs(course_interest.prereq);
        setCourseDescription(course_interest.description);
        setCourseCredits(course_interest.credits);
        setCourseTime(course_interest.time);
        setCourseCampus(course_interest.campus);
        setCourseTypes(course_interest.types);
        setCourseGrad(course_interest.grad);
        return course_interest;
    };

    const previousCourse = () => {
        if (selected.length > 1) setSelectedDone(false);
        setSelectedIndex((prevIndex) => {
            if (prevIndex > 0) {
                const newIndex = prevIndex - 1;
                const course_data = findCourse(newIndex);
                setCourseData(course_data);
                setCourseName(`${course_data.code} - ${course_data.name}`);
                return newIndex;
            }
            return prevIndex;
        });
    };

    const nextCourse = () => {
        setSelectedIndex((prevIndex) => {
            if (prevIndex < selected.length - 1) {
                const newIndex = prevIndex + 1;
                const course_data = findCourse(newIndex);
                setCourseData(course_data);
                setCourseName(`${course_data.code} - ${course_data.name}`);
                return newIndex;
            } else if (prevIndex === selected.length - 1) {
                setSelectedDone(true);
            }
            return prevIndex;
        });
    };
    const checkTaken = () => {
        if (editedList[selectedIndex].taken === false) {
            editedList[selectedIndex].taken = true;
            setTakenCourse(true); // set checkmark
        } else {
            editedList[selectedIndex].taken = false; // change course taken status to false if checked before
            setTakenCourse(false);
        };
    };
    const completeEdit = () => {
        onFinishBackdropClose(true);
        console.log('Completed edit ls:', editedList);
    };
    return (
        <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start', // Changed from 'center' to allow scrolling
                maxHeight: '80vh', // Ensure it doesn't exceed viewport height
                maxWidth: '80vw',
                backgroundColor: '#f0f0f0',
                overflowY: 'auto', // Allow vertical scrolling
                padding: '2rem',
            }}
        >
            <Paper
                sx={{
                    maxWidth: '70rem',
                    width: 'auto',
                    height: 'auto',
                    padding: '1rem',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: 'auto', // Centers the Paper vertically when content is shorter than viewport
                }}
            >
                <Box sx={{ marginBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                    <h3>{courseName} Course Information</h3>
                </Box>
                <p> Credits: {parseFloat(courseCredits).toFixed(1)}
                    {courseDescription !== '' && (
                        <p>{courseDescription}</p>
                    )}
                </p>
                <div className="row" style={{ display: 'flex', alignItems: 'center' }}>
                    {(courseGrad !== undefined) ? ((courseGrad) ? <p style={{ marginRight: '1.0rem' }}>Graduate course</p> : <p style={{ marginRight: '1.0rem' }}>Undergraduate course</p>) : null}
                    {(courseCampus && courseCampus.length > 0) &&
                        <p>Course offered at {courseCampus}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'start' }}>
                    <div>
                        <h5>Course Prerequisites:</h5>
                        <TableContainer component={Paper} sx={{ maxHeight: 300, width: 400 }}>
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Combination</TableCell>
                                        <TableCell>Prerequisite Courses</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(coursePrereqs !== undefined && coursePrereqs.length > 0) ? (
                                        coursePrereqs.map((course, index) => (
                                            <TableRow key={index}>
                                                <TableCell component="th" scope="row">{index + 1}</TableCell>
                                                <TableCell>{course.join(', ')}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell component="th" scope="row"></TableCell>
                                            <TableCell>This course does not require any prerequisites!</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                    <div style={{ marginLeft: '9.0rem' }}>
                        <h5>COURSENAMEHERE requires this course</h5>
                        <TableContainer component={Paper} sx={{ maxHeight: 300, width: 400 }}>
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Header 1</TableCell>
                                        <TableCell>Header 2</TableCell>
                                        <TableCell>Header 3</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Data 1</TableCell>
                                        <TableCell>Data 2</TableCell>
                                        <TableCell>Data 3</TableCell>
                                    </TableRow>
                                    {/* Add more TableRow components as needed */}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </div>
                <br />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: 'white',
                                color: 'black',
                                fontSize: '0.65rem',
                                ':hover': {
                                    backgroundColor: 'black',
                                    color: 'white',
                                },
                            }}
                            onClick={checkTaken}
                        >
                            I've taken this course before
                        </Button>
                        {takenCourse && (<CheckIcon sx={{ marginLeft: '0.5rem', color: 'green' }} />)}
                    </Box>
                    <Box sx={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            variant="contained"
                            startIcon={<KeyboardArrowLeftIcon sx={{ color: 'grey' }} />}
                            sx={{
                                backgroundColor: 'white',
                                color: 'black',
                                fontSize: '0.65rem',
                                ':hover': {
                                    backgroundColor: '#D4A017',
                                    color: 'white',
                                    '& .MuiSvgIcon-root': {
                                        color: 'white',
                                    },
                                },
                            }}
                            onClick={previousCourse}
                        >
                            Previous
                        </Button>
                        {selectedDone ? (
                            <Button
                                variant="contained"
                                endIcon={<KeyboardArrowRightIcon sx={{ color: 'grey' }} />}
                                sx={{
                                    backgroundColor: 'white',
                                    color: 'black',
                                    fontSize: '0.65rem',
                                    ':hover': {
                                        backgroundColor: '#D4A017',
                                        color: 'white',
                                        '& .MuiSvgIcon-root': {
                                            color: 'white',
                                        },
                                    },
                                }}
                                onClick={completeEdit}
                            >
                                Finish
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                endIcon={<KeyboardArrowRightIcon sx={{ color: 'grey' }} />}
                                sx={{
                                    backgroundColor: 'white',
                                    color: 'black',
                                    fontSize: '0.65rem',
                                    ':hover': {
                                        backgroundColor: '#D4A017',
                                        color: 'white',
                                        '& .MuiSvgIcon-root': {
                                            color: 'white',
                                        },
                                    },
                                }}
                                onClick={nextCourse}
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

BackdropEdit.propTypes = {
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    selected: PropTypes.arrayOf(PropTypes.number).isRequired,
    onFinishBackdropClose: PropTypes.func.isRequired
};