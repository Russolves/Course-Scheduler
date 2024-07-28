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

export default function EnhancedTable({ rows, columns, chosen_length, onSelectedRowsChange, courseSelected }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [selected, setSelected] = useState(courseSelected);

  // for detecting should selected rows change
  useEffect(() => {
    onSelectedRowsChange(selected);
  }, [selected, onSelectedRowsChange]);

  const handleChangePage = (event, newPage) => {
    // arriving at first page changes page length to number of user chosen courses
    // if (newPage === 0) {
    //   setRowsPerPage(chosen_length);
    // };
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
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
    if (page === 0 && rowsPerPage === chosen_length) {
      return 'Showing results for selected year'
    }
    return '';
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
          rowsPerPageOptions={[5]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
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