$(document).ready(function(){
    $("#uploadForm").submit(function(evt){

        if(!(["csv", "txt"].includes($("#inputFile").val().split("\\").pop().split(".").pop()))){

            $("#alertdiv").show();
            console.log("Wrong extension detected, .csv or .txt file only!");

            return false;
        }

        localStorage.setItem('filename', $("#inputFile").val().split("\\").pop().split(".")[0]);
    });
});
