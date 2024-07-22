const { topological_sort } = require('../algorithms/algorithms.js');
// for constructing user_input
let user_input = {};

// endpoint for returning all course names
const all_courses = async (req, res, client, courses_return, ref_course) => {
    let response = { message: '', payload: [] }; // each js object should consist of a message (string) and a payload (anything)
    try {
        response.message = 'API endpoint call to /courses successful';
        response.payload = [courses_return, ref_course]; // first being courses_return, second being ref_course
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
const course_selection = async (req, res, ref_prereq, course_ref, course_prereq) => {
    let response = { message: '', payload: {} };
    user_input.selection = Object.values(req.body);
    if (user_input.selection !== undefined && user_input.selection.length >= 3) {
        response.message = 'API endpoint call to /selection successful';
        let course_ls = [];
        user_input.selection.forEach((course) => (course !== null)? course_ls.push(course): null);
        course_ls.forEach((entry) => console.log(`${entry}: ${course_ref[entry]}`));
        const result = topological_sort(course_ls, ref_prereq, course_ref, course_prereq); // apply to user chosen courses
        response.payload = result; // return based on user_input course order, ref_prereq, course_prereq in that order
        res.status(200).json(response); // return user_input
    } else {
        response.message = 'Something went wrong during /selection API call';
        res.status(500).json(response);
    }
};

// endpoint for checking whether user input aligns with their chosen courses
const preference_check = async (req, res, course_ref, data) => {
    let response = { message: '', payload: {gradOr: true, semesterOr: true} };
    const newCourse = req.body.newCourse;
    const ref = course_ref[newCourse];
    if (ref === undefined) {
        response.message = `The course ${newCourse} does not seem to have a corresponding reference number within db`;
        res.status(200).json(response);
    } else {
        const course_data = data.filter((entry) => entry.reference === ref)[0];
        if (course_data.grad !== undefined && user_input.gradOr !== '' && user_input.gradOr !== course_data.grad.toString()) response.payload.gradOr = false; // check if an undergrad is trying to take a grad course or if a grad student is trying to take an undergrad course
        if (course_data.time_offered !== undefined && user_input.semesterOr !== '' && !(course_data.time_offered.includes(user_input.semesterOr))) response.payload.semesterOr = false;
        response.message = 'Preference check with backend successful!';
        res.status(200).json(response);
    };
};

module.exports = {
    all_courses,
    questionnaire,
    course_selection,
    preference_check,
}
