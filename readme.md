asp-dependency-graph
====================

Visualizing ASP dependencies via neo4j. The tracked dependencies are included
files, ASP functions and what called said functions. [See the wiki for more detailed documentation](https://github.com/debitoor/asp-dependency-graph/wiki).


How to install
--------------

1. Install [neo4j](http://neo4j.com) and host a local server.
2. Install [node.js](https://nodejs.org). This might not run on anything before v 12.16 (current LTS).
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
