<%
	function getLink(editform, supplier, invoiceType)
		getLink = "Econ.showDataEditForm('" & _
			"applet/df_doform.asp?form=" & editform & "&ops=" & setupId & _
			"&gennr=" & GenNr & "&type=" & invoiceType & "&levnr=" & supplier & "&returnertil=" & form & _
			"');"
	end function

	function getShowDocumentLink(invoiceType, hasGenNr)
	end function

function BogfoerFakturaPostering ()
End function

function HarAdminLogo (AftaleNr)
end function

%>
