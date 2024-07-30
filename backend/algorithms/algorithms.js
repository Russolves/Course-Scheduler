const khan_algorithm = (ref_prereq, ref_output) => {
    console.log('ref_output:', ref_output);
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
    // const all_combinations = generate_combinations(ref_output, add_output);
    // console.log('All combinations:', all_combinations.slice(0, 5));
    if (ref_output !== undefined) return [khan_algorithm(ref_prereq, ref_output), ref_output, add_output]; // return based on user_input course order, ref_prereq, course_prereq in that order
};

// recursive function for dps on course combinations
const generate_combinations = (ref_output, add_output) => {
    const keys = Object.keys(ref_output); // list of all keys in ref_output
    let result = [];
    let add_result = [];

    function dfs(current_combination, depth, add_obj) {
        if (depth === keys.length) {
            result.push({...current_combination});
            add_result.push({...add_obj});
            return;
        }
        const key = keys[depth];
        let valueArray = ref_output[key];
        (valueArray.length === 0) ? valueArray = [[]] : null;
        for (let index in valueArray) {
            if (Object.keys(add_output).includes(key) || valueArray[index].includes(-1)) add_obj[key] = add_output[key][index]; // to ensure courses whose prereqs contain a -1 combination are specified in add_result
            current_combination[key] = valueArray[index];
            dfs(current_combination, depth + 1, add_obj);
        }
    };
    dfs({}, 0, {}); // call function
    console.log(add_result.slice(0, 5));
    return result;
};
// function to return course order (through ref) and additional output (course code) from user_input
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
    // console.log('Ref output:', output);
    // console.log('Additional output:', add_ref);
    return [output, add_ref]; // return output and add_ref
};

module.exports = {
    khan_algorithm,
    topological_sort
};