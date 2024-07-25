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

export default function BackdropEdit({ rows, selected }) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // function to find course data within object
    function findCourse(index) {
        let course_interest = {};
        for (let course of rows) {
            if (parseInt(course.reference) === parseInt(selected[index])) {
                course_interest = course;
                break; // stop searching once the course is found
            }
        };
        return course_interest;
    };

    // initialize first course on selected list
    useEffect(() => {
        const initialCourse = findCourse(0);
        setCourseData(initialCourse);
        setCourseName(`${initialCourse.code} - ${initialCourse.name}`);
    }, [rows, selected]);

    const [courseData, setCourseData] = useState({});
    const [courseName, setCourseName] = useState('');

    const previousCourse = () => {
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
            }
            return prevIndex;
        });
    };
    return (
        <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f0f0f0',
                maxHeight: '20rem',
                maxWidth: '60rem'
            }}
        >
            <Paper
                sx={{
                    minWidth: '60rem',
                    minHeight: '20rem',
                    padding: '1rem',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ marginBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                    <h3>{courseName} Course Information</h3>
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 240 }}>
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
                {/* <br />
                <br /> */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5.0rem' }}>
                    <Button
                        variant="contained"
                        startIcon={<KeyboardArrowLeftIcon sx={{ color: 'grey' }} />}
                        sx={{
                            width: 'auto',
                            minWidth: '6.0rem',
                            padding: '0.25rem 0.25rem',
                            backgroundColor: 'white',
                            color: 'black',
                            fontSize: '0.75rem', // Smaller text size
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
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
                    <Button
                        variant="contained"
                        sx={{
                            marginLeft: '1.0rem',
                            width: 'auto',
                            minWidth: '6.0rem',
                            padding: '0.25rem 0.25rem',
                            backgroundColor: 'white',
                            color: 'black',
                            fontSize: '0.75rem', // Smaller text size
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
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
                        <KeyboardArrowRightIcon sx={{ color: 'grey', marginLeft: '0.25rem' }} />
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

BackdropEdit.propTypes = {
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    selected: PropTypes.arrayOf(PropTypes.number).isRequired,
};