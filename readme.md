asp-dependency-graph
====================

Visualizing ASP dependencies via neo4j. The tracked dependencies are included
files, ASP functions and what called said functions. [See the wiki for more detailed documentation](https://github.com/debitoor/asp-dependency-graph/wiki).


How to install
--------------

1. Install [node.js](https://nodejs.org). This might not run on anything before v 12.16 (current LTS).
2. Check out the code.
3. Run `npm install`.
4. Install docker. Start the neo4j server using `docker-compose up -d`.


How to use
----------

Start by running the tests (`npm test`). This should show that node.js and
dependencies are installed correctly.

Then run `npm run analyze -- --output <path-to-output.json> <path-to-asp>` to output
the result into a file.

To upload the file into neo4j, run `npm run upload -- <path-to-output.json>`.
This can easily take 3 mins. It is currently hardcoded against neo4j running on
`localhost:7474` without authentication.

For more info on setup, see [the setup.md guide](docs/setup.md).

For more info on queries, see [the guide on some bundled queries](docs/queries.md).
