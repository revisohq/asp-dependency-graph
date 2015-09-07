<!-- #include file="functions.asp" -->
<%

' not calling someFunc() because this is a comment

// not calling funcWithoutParans1() because this is a comment

dim a : a = "comment at end" ' funcWithoutParans2()

"not calling funcWithParans1() because this is a string"

dim b ' _
function func_after_comment()
end function

"not calling funcWithoutParans2 because it is in string with statement sep:"

' some comment before exiting asp %>

not calling funcWithParans2 because it is outside asp
