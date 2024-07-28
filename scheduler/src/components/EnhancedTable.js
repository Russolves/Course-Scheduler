// EnhancedTable.js
import React, { useState, useEffect} from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Checkbox from '@mui/material/Checkbox';
import Row from './Row';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { useNavigate, useSearchParams } from 'react-router-dom';


export default function EnhancedTable({ rows, columns, chosen_length, onSelectedRowsChange, courseSelected }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [selected, setSelected] = useState(courseSelected);

  // for detecting should selected rows change
  useEffect(() => {
    onSelectedRowsChange(selected);
  }, [selected, onSelectedRowsChange]);
  // for reading initial values from URL on component mount
  useEffect(() => {
    const course_page = searchParams.get('page') || 0;
    setPage(parseInt(course_page));
  }, [searchParams]);
  // function to update URL when page changes
  const updateUrlPage = (newPage) => {
    setSearchParams(prev => {
      if (newPage >= 0) prev.set('page', newPage.toString());
      return prev;
    })
  };
  // Modified page change handler
  const handleChangePage = (event, newPage) => {
    updateUrlPage(newPage);
    setPage(newPage);
  }

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
    updateUrlPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.reference);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, reference) => {
    const selectedIndex = selected.indexOf(reference);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, reference);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (reference) => selected.indexOf(reference) !== -1;
  const displayPage = () => {
    const year = Math.ceil((parseInt(page) + 1) / 2);
    return `Year ${year} schedule`;
  };
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < rows.length}
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={handleSelectAllClick}
                  inputProps={{
                    'aria-label': 'select all desserts',
                  }}
                />
              </TableCell>
              <TableCell />
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                const isItemSelected = isSelected(row.reference);
                return (
                  <Row key={row.reference} row={row} isItemSelected={isItemSelected} handleClick={handleClick} columns={columns} />
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="flex-end" alignItems="center" padding={1}>
        <Box mr={2} style={{marginBottom:'0.3rem'}}><strong>{displayPage()}</strong></Box>
        <TablePagination
          rowsPerPageOptions={[3, 4, 5]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Courses per page:"
        />
      </Box>
    </Paper>
  );
}

EnhancedTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      minWidth: PropTypes.number,
      align: PropTypes.oneOf(['right', 'left', 'center']),
    }),
  ).isRequired,
  chosen_length: PropTypes.number.isRequired,
  onSelectedRowsChange: PropTypes.func.isRequired,
  courseSelected: PropTypes.arrayOf(PropTypes.number).isRequired,
};