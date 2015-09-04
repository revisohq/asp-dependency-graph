<!-- #include file="functions.asp" -->
<%
someFunc()
a = funcWithoutParans1 1
b = funcWithParans1(1)
c = funcWithoutParans2 funcWithParans2(), 3, bob
funcWithoutParans1 1 2
%>

Some html: <%= inlineWithoutParans %>, and more <%= inlineWithParans() %> bla
