const express = require('express');
const { all_courses, questionnaire, course_selection } = require("../controllers/input.js");
const router = express.Router();

module.exports = (client, courses_return, sort_output) => {
    router.get('/courses', async (req, res) => {
        await all_courses(req, res, client, courses_return);
    });
    router.post('/questionnaire', async (req, res) => {
        await questionnaire(req, res);
    });
    router.post('/selection', async (req, res) => {
        await course_selection(req, res, sort_output);
    })
    return router;
}