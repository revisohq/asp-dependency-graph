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

ASPClient.external()
%>

bla()

b = bum(<%= huhej %>)
function moreJavascript()
{}
