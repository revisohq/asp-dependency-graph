function javascriptFunction()
{
	PopUp2(Econ.applicationUrl('/Popup/ExportESVAT303.aspx'), 750, 400)
	ASPClient.notFound()
}

<%
function aspFunction()
	ASPClient.internal()
end function

function someFunc()
end function

function funcWithoutParans1()
end function

function funcWithoutParans2()
end function

function funcWithParans1()
end function

function funcWithParans2()
end function

function inlineWithoutParans()
end function

function inlineWithParans()
end function

function blacklistedFunction()
	ASPClient.clientCallInBlacklistedFunction()
end function

sub blacklistedSub()
	ASPClient.clientCallInBlacklistedSub()
end sub

function abc()
end function
function abcdef()
end function

abc
abcdef someFunc(),funcWithoutParans1() , funcWithParans1()
abc

ASPClient.external()
%>

bla()

b = bum(<%= huhej %>)
function moreJavascript()
{}
