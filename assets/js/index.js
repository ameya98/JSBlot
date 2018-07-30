/*
    File: index.js
    Author: Ameya Daigavane
    The front page JS logic that handles the forms.
*/

$(document).ready(function(){

    var fileName = "";
    var stringID = null;

    $('#inputFile').bind('change', function() {
        fileName = $("#inputFile").val().split("\\").pop();
        $('#file-selected').html(fileName);
    });

    $('#sampleChosen').click(function(evt){
        window.location.href = '/sample';
    });

    $("#uploadForm").submit(function(evt){

        if(stringID == null){
            evt.preventDefault();
            getID();
        }

        function getID(){
            $.ajax({
                   type: "POST",
                   url: "/generateID",
                   success: function (response) {

                       stringID = Number(response);
                       console.log(stringID, "assigned.");

                       $("#ID").val(stringID);

                       if(!(["csv", "txt"].includes(fileName.split(".").pop()))){

                           $("#alertdiv").show();
                           console.log("Wrong extension detected, .csv or .txt file only!");

                           return false;
                       }

                       localStorage.setItem('filename', fileName.split(".")[0]);
                       localStorage.setItem('ID', stringID);

                       $("#uploadForm").unbind('submit');
                       $("#uploadForm").submit();

                   },
                   error: function(error) {
                       window.location.replace('/');
                   }
               });
        }


    });

});
