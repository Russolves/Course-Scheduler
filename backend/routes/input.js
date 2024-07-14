const express = require('express');
const { all_courses, questionnaire, course_selection } = require("../controllers/input.js");
const router = express.Router();

// passing arguments (from server.js) into route functions
module.exports = (client, courses_return, sort_output, ref_prereq, course_ref, data) => {
    router.get('/courses', async (req, res) => {
        await all_courses(req, res, client, courses_return);
    });
    router.post('/questionnaire', async (req, res) => {
        await questionnaire(req, res);
    });
    router.post('/selection', async (req, res) => {
        await course_selection(req, res, sort_output, ref_prereq, course_ref);
    })
    return router;
}