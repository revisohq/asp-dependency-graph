# Bundled queries

To import the bundled queries, simply drag the [saved-scripts.zip](saved-scripts.zip) file onto the browser.
This can be done as many times as you please, it will just duplicate any queries that already exists.

Queries can be removed by clicking on the pencil icon that appears when hovering over the query.

As a general rule, all symbol names (files, functions, subs, etc) are lowercased.
ASP is case-insensitive, but the database is not, so keep the strings lower-case or no results will match.

Custom queries can easily be written as well. Either start from one of the queries below or from scratch.
While experimenting, it might really convenient to put `LIMIT 20` after the `RETURN` statement,
so there is less data involved while working out the kinks of an untested query.

Here are some documentation on Cypher, the query language that Neo4j supports:

- [Blog post with an introduction to both graph databases and Cypher](https://neo4j.com/blog/why-database-query-language-matters/?ref=cypher/#cypher)
- [Introduction to Cypher and some tutorials](https://neo4j.com/developer/cypher-query-language/)
- [Cypher manual](https://neo4j.com/docs/cypher-manual/current/)


## Calls to function or sub

Returns any file, function or sub which call the function or sub in question.

If a function or sub is found, the entire call-stack is included.


## From a file

This one comes in three variants, that all start with a path to a specific file:

- From the start file and to all imported files
- From the start file and to all files that import this
- Both of the above put together

In all cases, click on the query and edit the path to match


## Functions which only calls `ASPClientFunction`s

This creates a table with with all functions that only calls ASPClient functions. It sorts them
by the number of functions or files that calls the function.

These are prime candidates for being moved to C#.


## Least called functions

This lists all the ASP functions and sorts them by the number of references.
