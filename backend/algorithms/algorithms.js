const khan_algorithm = (ref_prereq, ref_output) => {
    let adj = [];
    // for constructing adj ls for topological sorting
    for (key in ref_prereq) {
        if (ref_prereq[key] === undefined) {
            adj.push([]);
        } else {
            adj.push(ref_prereq[key]);
        }
    };
    let inorder = [];
    // for constructing inorder_ls
    adj.forEach((entry) => inorder.push(0)); // pushing zeroes in
    for (element of adj) {
        if (element.length > 0) {
            for (course of element[0]) { // only used prereqs' first element (modify later)
                inorder[course] += 1;
            }
        }
    };
    let q = [];
    for (index in inorder) {
        if (inorder[parseInt(index)] === 0) {
            q.push(parseInt(index));
        }
    };
    let sort_output = [];
    while (q.length > 0) {
        const n = q.shift();
        sort_output.push(n);
        if (adj[n].length > 0) {
            for (entry of adj[n][0]) { // modify later
                inorder[entry] -= 1;
                if (inorder[entry] === 0) {
                    q.push(entry);
                }
            }
        }
    };
    sort_output.reverse(); // reverse for correct order
    let final_output = [];
    sort_output.forEach((course) => { // retain only the courses specified
        if (Object.keys(ref_output).includes(course.toString())) final_output.push(course)
    });
    return final_output;
};

const topological_sort = (course_ls, ref_prereq, course_ref, course_prereq) => {
    const output = find_combinations(course_ls, ref_prereq, course_ref, course_prereq);
    const ref_output = output[0];
    const add_output = output[1];
    // if (ref_output !== undefined) console.log(khan_algorithm(ref_prereq, ref_output)); // original code

};

const find_combinations = (course_ls, ref_prereq, course_ref, course_prereq) => {
    let q = [];
    course_ls.forEach((entry) => q.push(course_ref[entry.toString()]));
    let output = {};
    let add_ref = {};
    let seen = new Set(); // set for seen courses
    while (q.length > 0) {
        let course = q.shift();
        (course !== undefined) ? null : course = [];
        if (!seen.has(course)) {
            let ls = [];
            (ref_prereq[course.toString()] !== undefined) ? ls = ref_prereq[course.toString()] : null;
            output[course] = ls;
            seen.add(course);
            // append to queue
            if (ls.length > 0) {
                for (index in ls) {
                    add_ref[course] = course_prereq[course]; // additional description for courses with a status of -1 (unknown)
                    for (code_in in ls[index]) {
                        q.push(parseInt(ls[index][code_in])); // push other courses into queue for bfs
                    }
                }
            }
        };
    };
    console.log(output);
    console.log(add_ref);
    return [output, add_ref]; // return output and add_ref
};

module.exports = {
    khan_algorithm,
    topological_sort
};