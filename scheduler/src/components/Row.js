// Row.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const Row = (props) => {
    const { row, isItemSelected, handleClick, columns } = props;
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow hover onClick={(event) => handleClick(event, row.name)} role="checkbox" tabIndex={-1} key={row.name} selected={isItemSelected}>
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{ 'aria-labelledby': row.name }}
                    />
                </TableCell>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                {columns.map((column) => {
                    const value = row[column.id];
                    return (
                        <TableCell key={column.id} align={column.align}>
                            {column.format && typeof value === 'number' ? column.format(value) : (value !== null && value !== undefined ? value : '')}
                        </TableCell>
                    );
                })}
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h8" gutterBottom component="div">
                                {row.description}
                            </Typography>
                            <Typography variant="h8" gutterBottom component="div">{(row.grad !== undefined) ? ((row.grad === true) ? 'Graduate Level Course': 'Not a graduate level course'): ''}</Typography>
                            <Typography variant="h8" gutterBottom component="div">{(row.levels.length > 0) ? `Course levels being offered: ${row.levels}`:''}</Typography>
                            <Typography variant="h6" gutterBottom component="div">Prerequisite Course Combinations</Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Combination</TableCell>
                                        <TableCell>Prerequisite Courses</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.prereq.length === 0 ? (
                                        <TableRow>
                                            <TableCell component="th" scope="row"></TableCell>
                                            <TableCell>This course does not require any prerequisites!</TableCell>
                                        </TableRow>
                                    ) : (
                                        row.prereq.map((combination, index) => (
                                            <TableRow key={index}>
                                                <TableCell component="th" scope="row">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell>{combination.join(', ')}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};
// arguments for Row
Row.propTypes = {
    row: PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        credits: PropTypes.string.isRequired,
        time: PropTypes.string.isRequired,
        campus: PropTypes.string.isRequired,
        types: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        grad: PropTypes.bool.isRequired,
        levels: PropTypes.string.isRequired,
        prereq: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired // ls within ls
    }).isRequired,
    isItemSelected: PropTypes.bool.isRequired,
    handleClick: PropTypes.func.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            minWidth: PropTypes.number,
            align: PropTypes.oneOf(['right', 'left', 'center']),
        })
    ).isRequired,
};

export default Row;
