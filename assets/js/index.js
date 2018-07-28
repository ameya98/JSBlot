$(document).ready(function(){

    var fileName = "";

    $('#inputFile').bind('change', function() {
        fileName = $("#inputFile").val().split("\\").pop();
        $('#file-selected').html(fileName);
    });

    $("#uploadForm").submit(function(evt){

        var randval = Math.floor(Math.random() * 100000000);
        $("#ID").val(randval);

        if(!(["csv", "txt"].includes(fileName.split(".").pop()))){

            $("#alertdiv").show();
            console.log("Wrong extension detected, .csv or .txt file only!");

            return false;
        }

        localStorage.setItem('filename', fileName.split(".")[0]);
        localStorage.setItem('ID', randval);

    });
});
