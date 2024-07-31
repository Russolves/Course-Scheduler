import React, { useState, useEffect, useCallback } from 'react';
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

export default function BackdropEdit({ rows, selected, onFinishBackdropClose, onCourseEdit, editedCourseList, setSelectedRows, refPrereq, coursePrereq, refCourse }) {
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
    // {} for each selected course with reference as key and ls as value: [selectedIndex, {taken: true/false}]
    const [takenCourse, setTakenCourse] = useState(false); // for showing checkmark for taken this course
    const [prereqOf, setprereqOf] = useState([]); // for second table
    const [prereqOfName, setprereqOfName] = useState(''); // for telling the user which course requires this current course

    // Initialize first course on selected list
    useEffect(() => {
        if (selected.length === 0) {
            // Handle empty selection
            setCourseData({});
            setCourseName('');
            setSelectedDone(true);
        } else {
            setSelectedDone(selected.length === 1);
            const initialCourse = findCourse(0);
            setCourseData(initialCourse);
            setCourseName(`${initialCourse.code} - ${initialCourse.name}`);
        }
    }, [selected]);
    // for reading in edited data
    useEffect(() => {
        for (let ref in editedCourseList) {
            if (editedCourseList[ref][0] === selectedIndex) {
                setTakenCourse(editedCourseList[ref][1].taken);
                break
            }
        };
        if (selectedIndex === selected.length - 1) {
            setSelectedDone(true);
        } else {
            setSelectedDone(false);
        };
    }, [selectedIndex]);

    useEffect(() => {
        // setting read data from editedCourseList
        for (let ref in editedCourseList) {
            if (editedCourseList[ref][0] === selectedIndex) {
                setTakenCourse(editedCourseList[ref][1].taken);
                break
            }
        };
    }, [editedCourseList]);

    // useEffect(() => {
    //     console.log('Updated prereqOf:', prereqOf);
    //     console.log('Updated prereqOfName:', prereqOfName);
    // }, [prereqOf, prereqOfName]);

    // function to find course data within rows ls of objects
    const findCourse = useCallback((index) => {
        if (selected.length === 0 || index >= selected.length) {
          return;
        }
    
        const selectedRef = parseInt(selected[index]);
        const course_interest = rows.find(course => parseInt(course.reference) === selectedRef) || {};
        const ref = course_interest.reference;
    
        let newPrereqOf = [];
        let newPrereqOfName = '';
    
        // First pass: check for direct matches
        for (let key in refPrereq) {
          if (refPrereq[key].length > 0 && refPrereq[key][0].includes(ref)) {
            newPrereqOf = coursePrereq[key].map((combo, i) => [combo, i === 0]);
            newPrereqOfName = refCourse[key];
            if (editedCourseList[course_interest.reference]) editedCourseList[course_interest.reference][1].original_courses = coursePrereq[key][0]; // setting editedlist for original courses
            break;
          }
        }
    
        // Second pass: check for indirect matches if no direct match found
        if (newPrereqOf.length === 0) {
          for (let key in refPrereq) {
            let ls = [];
            for (let index in refPrereq[key]) {
              if (refPrereq[key][index].includes(ref)) {
                ls.push([coursePrereq[key][index], true]);
                newPrereqOfName = refCourse[key];
                if (editedCourseList[course_interest.reference]) editedCourseList[course_interest.reference][1].original_courses = coursePrereq[key][index]; // setting editedlist for original courses
              } else {
                ls.push([coursePrereq[key][index], false]);
              }
            }
            if (ls.length > 0) {
              newPrereqOf = ls;
              break;
            }
          }
        }
    
        setprereqOf(newPrereqOf);
        setprereqOfName(newPrereqOfName);
        setCoursePrereqs(course_interest.prereq || []);
        setCourseDescription(course_interest.description || '');
        setCourseCredits(course_interest.credits || '');
        setCourseTime(course_interest.time || '');
        setCourseCampus(course_interest.campus || '');
        setCourseTypes(course_interest.types || '');
        setCourseGrad(course_interest.grad || false);
        return course_interest;
    }, [rows, selected, refPrereq, coursePrereq, refCourse]);
    // altering prereqOf when clicking on use
    const alter_prereqOf = (index) => () => {
        const course_interest = rows.find(course => parseInt(course.reference) === parseInt(selected[selectedIndex])) || {};
        let courses_swap = [];
        let ref_swap = [];
        for (let i in prereqOf) {
            if (parseInt(i) === index) {
                // look for reference of prereqOf course
                let reference = -1;
                for (let ref in refCourse) {
                    if (refCourse[ref] === prereqOfName) {
                        reference = parseInt(ref);
                        break
                    }
                };
                ref_swap = refPrereq[reference][i]; // for reference ls (could potentially be undefined if reference not found)
                courses_swap = prereqOf[i][0]; // for course code & name ls
            }
        };
        // edit value for updating checkmark
        setprereqOf(prevPrereqOf => 
          prevPrereqOf.map((item, i) => 
            [item[0], i === index]
          )
        );
        if (editedCourseList[course_interest.reference][1]) editedCourseList[course_interest.reference][1].courses_swap = courses_swap;
        if (editedCourseList[course_interest.reference][1]) editedCourseList[course_interest.reference][1].ref_swap = ref_swap;
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
        const newEditedList = { ...editedCourseList };
        for (let ref in newEditedList) {
            if (newEditedList[ref][0] === selectedIndex) {
                newEditedList[ref][1].taken = !newEditedList[ref][1].taken;
                setTakenCourse(newEditedList[ref][1].taken);
                break;
            }
        }
        onCourseEdit(newEditedList);
    };
    // pressing the finish editing button
    const completeEdit = () => {
        onFinishBackdropClose(true);
        onCourseEdit(editedCourseList);
        setSelectedIndex(0);
        setSelectedRows([]); // Reset selected rows to empty list
        // Immediately clear the current course data
        setCourseData({});
        setCourseName('');
        setSelectedDone(true);
        setTakenCourse(false);
    };

    // Render null of there's no selection
    if (selected.length === 0) {
        return null;
    }
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
                        {(prereqOfName !== '') ? (<h5>{prereqOfName} requires this course</h5>) : <h5 style={{ marginTop: '4.0rem' }}></h5>}
                        <TableContainer component={Paper} sx={{ maxHeight: 300, width: 450 }}>
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Combination</TableCell>
                                        <TableCell>Prerequisite Courses</TableCell>
                                        <TableCell>Currently using</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(prereqOfName !== '') ? (
                                        prereqOf.map((course, index) => (
                                            <TableRow key={index}>
                                                <TableCell component="th" scope="row">{index + 1}</TableCell>
                                                <TableCell>{course[0].join(', ')}</TableCell>
                                                <TableCell>{course[1] && <CheckIcon sx={{ marginLeft: '0.5rem', color: 'black' }} />}</TableCell>
                                                <TableCell>
                                                    <Button sx={{
                                                        fontSize: '0.80rem',
                                                        color: 'black',
                                                        borderColor: 'gold',
                                                        ':hover': {
                                                            color: 'gold',
                                                            borderColor: 'black'
                                                        }
                                                    }} 
                                                    variant='outlined'
                                                    onClick={alter_prereqOf(index)}>use</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell component="th" scope="row"></TableCell>
                                            <TableCell>This course is not a prerequisite to any other course!</TableCell>
                                        </TableRow>
                                    )}
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
    onFinishBackdropClose: PropTypes.func.isRequired,
    onCourseEdit: PropTypes.func.isRequired,
    editedCourseList: PropTypes.object.isRequired,
    setSelectedRows: PropTypes.func.isRequired,
    refPrereq: PropTypes.object.isRequired,
    coursePrereq: PropTypes.object.isRequired,
    refCourse: PropTypes.object.isRequired
};