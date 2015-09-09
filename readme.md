asp-dependency-graph
====================

Visualizing ASP dependencies via neo4j. The tracked dependencies are included
files, ASP functions and what called said functions. [See the wiki for more detailed documentation](https://github.com/debitoor/asp-dependency-graph/wiki).


How to install
--------------

1. Install [neo4j](http://neo4j.com) and host a local server.
2. Install [node.js](https://nodejs.org).
3. Check out the code.
4. Run `npm install`.


How to use
----------

Start by running the tests (`npm test`). This should show that node.js and
dependencies are installed correctly.

Then run `npm run analyze -- <path-to-asp> > <path-to-output.json>` to output
the result into a file.

To upload the file into neo4j, run `npm run upload -- <path-to-output.json>`.
This can easily take 3 mins. It is currently hardcoded against neo4j running on
`localhost:7474` without authentication.

Note: If you are running node.js prior to v. 0.12, `npm` does not support the
`--` to separate arguments to the script. Instead, use
`babel-node --stage=0 index.js analyze <path-to-asp> > <path-to-output.json>`
and `babel-node --stage=0 index.js upload <path-to-output.json>` respectively.
