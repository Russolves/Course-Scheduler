const { topological_sort } = require('../algorithms/algorithms.js');
// for constructing user_input
let user_input = {};


// endpoint for returning all course names
const all_courses = async (req, res, client, courses_return) => {
    let response = { message: '', payload: [] }; // each js object should consist of a message (string) and a payload (anything)
    try {
        response.message = 'API endpoint call to /courses successful';
        response.payload = courses_return;
        res.status(200).json(response);
    } catch (e) {
        console.log('An error occurred during calling /courses endpoint');
        response.message = 'Server has encountered an error during /courses endpoint';
        res.status(500).json(response);
    } finally {
        await client.close();
    }
};

// endpoint for receiving questionnaire answers
const questionnaire = async (req, res) => {
    let response = { message: '', payload: {} };
    user_input.gradOr = req.body.gradOr;
    user_input.semesterOr = req.body.semesterOr;
    if (user_input.semesterOr !== undefined && user_input.gradOr !== undefined) {
        response.message = 'API endpoint call to /questionnaire successful';
        response.payload = user_input;
        res.status(200).json(response); // return user_input
    } else {
        response.message = 'User input not recognized for /questionnaire API endpoint call';
        res.status(500).json(response);
    }
};

// endpoint for receiving course selection answers
const course_selection = async (req, res, sort_output) => {
    let response = { message: '', payload: {} };
    user_input.selection = Object.values(req.body);
    if (user_input.selection !== undefined && user_input.selection.length >= 3) {
        response.message = 'API endpoint call to /selection successful';
        topological_sort(sort_output, user_input.selection);
        response.payload = user_input;
        res.status(200).json(response); // return user_input
    } else {
        response.message = 'Something went wrong during /selection API call';
        res.status(500).json(response);
    }
    console.log(user_input);
}

module.exports = {
    all_courses,
    questionnaire,
    course_selection
}
