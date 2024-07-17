const express = require('express');
const { all_courses, questionnaire, course_selection } = require("../controllers/input.js");
const router = express.Router();

// passing arguments (from server.js) into route functions
module.exports = (client, courses_return, ref_prereq, course_ref, course_prereq, ref_course, data) => {
    router.get('/courses', async (req, res) => {
        await all_courses(req, res, client, courses_return, ref_course);
    });
    router.post('/questionnaire', async (req, res) => {
        await questionnaire(req, res);
    });
    router.post('/selection', async (req, res) => {
        await course_selection(req, res, ref_prereq, course_ref, course_prereq);
    })
    return router;
}