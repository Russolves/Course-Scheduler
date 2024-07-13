const khan_algorithm = (ref_prereq) => {
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
    return sort_output
};

const topological_sort = (sort_output, course_ls) => {
    // console.log(sort_output.slice(0, 10));
};

module.exports = {
    khan_algorithm: (ref_prereq) => khan_algorithm(ref_prereq),
    topological_sort: (sort_output, course_ls) => topological_sort(sort_output, course_ls)
};