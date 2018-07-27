$(document).ready(function(){
    $("#uploadForm").submit(function(evt){

        var randval = Math.floor(Math.random() * 100000000);

        $("#ID").val(randval);

        if(!(["csv", "txt"].includes($("#inputFile").val().split("\\").pop().split(".").pop()))){

            $("#alertdiv").show();
            console.log("Wrong extension detected, .csv or .txt file only!");

            return false;
        }

        localStorage.setItem('filename', $("#inputFile").val().split("\\").pop().split(".")[0]);
        localStorage.setItem('ID', randval);

    });
});
